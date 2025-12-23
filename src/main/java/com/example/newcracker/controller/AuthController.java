package com.example.newcracker.controller;

import com.example.newcracker.common.ApiResponse;
import com.example.newcracker.dto.refreshToken.request.RefreshRequest;
import com.example.newcracker.dto.refreshToken.response.RefreshResponse;
import com.example.newcracker.dto.user.request.DeleteUserRequest;
import com.example.newcracker.dto.user.request.LoginRequest;
import com.example.newcracker.dto.user.request.LogoutRequest;
import com.example.newcracker.dto.user.request.SignupRequest;
import com.example.newcracker.dto.user.response.LoginResponse;
import com.example.newcracker.dto.user.response.SignupResponse;
import com.example.newcracker.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
@Tag(name = "Auth Controller", description = "Authentication Controller API")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @Operation(summary = "User Sign up", description = "유저 회원가입 API")
    public ResponseEntity<ApiResponse<SignupResponse>> signup(@Valid @RequestBody SignupRequest request){
        SignupResponse response = authService.signup(request);
        return ApiResponse.ok(response, "회원가입이 성공적으로 완료되었습니다.");
    }

    @PostMapping("/login")
    @Operation(summary = "User Log in", description = "유저 로그인 API")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request){
        LoginResponse response = authService.login(request);
        return ApiResponse.ok(response, "로그인이 성공적으로 완료되었습니다.");
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "액세스 토큰 재발급 API")
    public ResponseEntity<ApiResponse<RefreshResponse>> refresh(@Valid @RequestBody RefreshRequest request){
        RefreshResponse response = authService.refresh(request);
        return ApiResponse.ok(response, "액세스 토큰이 성공적으로 발급되었습니다.");
    }

    @PostMapping("/logout")
    @Operation(summary = "User Logout", description = "유저 로그아웃 API")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest httpServletRequest, @Valid @RequestBody LogoutRequest request){
        authService.logout(httpServletRequest, request);
        return ApiResponse.ok("로그아웃이 성공적으로 완료되었습니다.");
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "User Logout", description = "회원 탈퇴 API")
    public ResponseEntity<ApiResponse<Void>> deleteUser(HttpServletRequest httpServletRequest, @Valid @RequestBody DeleteUserRequest request){
        authService.deleteUser(httpServletRequest, request);
        return ApiResponse.ok("회원 정보를 성공적으로 삭제하였습니다.");
    }
}
