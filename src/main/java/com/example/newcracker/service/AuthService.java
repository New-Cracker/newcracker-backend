package com.example.newcracker.service;

import com.example.newcracker.config.TokenProvider;
import com.example.newcracker.dto.refreshToken.RefreshDto;
import com.example.newcracker.dto.refreshToken.request.RefreshRequest;
import com.example.newcracker.dto.refreshToken.response.RefreshResponse;
import com.example.newcracker.dto.user.request.DeleteUserRequest;
import com.example.newcracker.dto.user.request.LoginRequest;
import com.example.newcracker.dto.user.request.LogoutRequest;
import com.example.newcracker.dto.user.request.SignupRequest;
import com.example.newcracker.dto.user.response.LoginResponse;
import com.example.newcracker.dto.user.response.SignupResponse;
import com.example.newcracker.entity.Users;
import com.example.newcracker.global.exception.InvalidTokenException;
import com.example.newcracker.global.exception.NotAcceptableUserException;
import com.example.newcracker.global.exception.NotLoggedInException;
import com.example.newcracker.global.exception.UserAlreadyExistException;
import com.example.newcracker.repository.BlacklistRepository;
import com.example.newcracker.repository.RefreshTokenRepository;
import com.example.newcracker.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final BlacklistRepository blacklistRepository;


    public SignupResponse signup(SignupRequest request){
        if(userRepository.existsByEmailAndIsDeletedFalse(request.getEmail())){
            throw new UserAlreadyExistException("이미 가입된 이메일입니다.");
        }

        Users user = Users.builder()
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .email(request.getEmail())
                .build();

        userRepository.save(user);

        return SignupResponse.builder()
                .userId(user.getId())
                .build();
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        // ID, PW 검증
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );


        Users user = userRepository.findByEmailAndIsDeletedFalse(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User doesn't exist"));

        String accessToken = tokenProvider.createAccessToken(request.getEmail());

        String refreshToken = tokenProvider.createRefreshToken(request.getEmail());

        long refreshTokenTtl = 7 * 24 * 60 * 60; // 7일 (초 단위)
        refreshTokenRepository.save(refreshToken, user, refreshTokenTtl);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public RefreshResponse refresh(RefreshRequest requestDto){

        RefreshDto existingRefreshToken = refreshTokenRepository.findByToken(requestDto.getRefreshToken())
                .orElseThrow(() -> new InvalidTokenException("토큰을 찾을 수 없습니다."));

        if(existingRefreshToken.getExpiryDatetime().isBefore(LocalDateTime.now())){
            refreshTokenRepository.deleteByToken(requestDto.getRefreshToken());
            throw new InvalidTokenException("토큰이 만료되었습니다.");
        }

        String username = tokenProvider.extractUsername(existingRefreshToken.getToken());
        String newAccessToken = tokenProvider.createAccessToken(username);

        return RefreshResponse.builder()
                .accessToken(newAccessToken)
                .build();
    }

    @Transactional
    public void logout(HttpServletRequest httpServletRequest, LogoutRequest request) {
        String accessToken = extractAccessToken(httpServletRequest);
        if (accessToken == null) {
            throw new NotLoggedInException("로그인이 필요한 요청입니다.");
        }

        if (!tokenProvider.validateToken(accessToken)) {
            throw new InvalidTokenException("유효하지 않은 Access Token입니다.");
        }

        Long expiration = tokenProvider.getExpiration(accessToken);
        if (expiration > 0) {
            blacklistRepository.addToBlacklist(accessToken, expiration);
        }

        String refreshToken = request.getRefreshToken();
        if (refreshToken != null && !refreshToken.isEmpty()) {
            refreshTokenRepository.deleteByToken(refreshToken);
        }
    }

    @Transactional
    public void deleteUser(HttpServletRequest httpServletRequest, DeleteUserRequest request) {
        String bearerToken = httpServletRequest.getHeader("Authorization");
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            throw new InvalidTokenException("토큰 형식이 잘못되었거나 유효하지 않습니다.");
        }
        String accessToken = bearerToken.substring(7);

        if (!tokenProvider.validateToken(accessToken)) {
            throw new InvalidTokenException("유효하지 않거나 만료된 Access Token입니다.");
        }

        String email = tokenProvider.extractUsername(accessToken);

        Users user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new UsernameNotFoundException("유저가 존재하지 않습니다."));

        RefreshDto refreshDto = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new InvalidTokenException("토큰이 존재하지 않습니다."));

        if (!refreshDto.getUserId().equals(user.getId())) {
            throw new NotAcceptableUserException("요청에 포함된 Refresh Token이 현재 유저의 토큰이 아닙니다.");
        }

        refreshTokenRepository.deleteByToken(request.getRefreshToken());


        long remainingTtlSeconds = tokenProvider.getExpiration(accessToken);
        blacklistRepository.addToBlacklist(accessToken, remainingTtlSeconds);

        user.delete();
        userRepository.save(user);
    }

    private String extractAccessToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // "Bearer " 제거
        }

        return null;
    }
}
