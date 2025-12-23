package com.example.newcracker.repository.adapter;

import com.example.newcracker.dto.refreshToken.RefreshDto;
import com.example.newcracker.entity.RefreshToken;
import com.example.newcracker.entity.Users;
import com.example.newcracker.repository.RefreshTokenJpaRepository;
import com.example.newcracker.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
@Profile("mysql")
@RequiredArgsConstructor
public class JpaRefreshTokenRepositoryAdapter implements RefreshTokenRepository {
    private final RefreshTokenJpaRepository jpaRepository;

    @Override
    public void save(String token, Users user, long ttl) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .user(user)
                .expiryDatetime(LocalDateTime.now().plusSeconds(ttl))
                .build();
        jpaRepository.save(refreshToken);
    }

    @Override
    public Optional<RefreshDto> findByToken(String token) {
        return jpaRepository.findByToken(token)
                .map(this::toDto);
    }

    @Override
    @Transactional
    public void deleteByToken(String refreshToken) {
        jpaRepository.findByToken(refreshToken)
                .ifPresent(token -> jpaRepository.deleteByToken(token.getToken()));
    }

    @Override
    public RefreshToken findByUser(Users user) {
        return jpaRepository.findByUser(user);
    }

    // Entity → DTO 변환
    private RefreshDto toDto(RefreshToken refreshToken) {
        return RefreshDto.builder()
                .token(refreshToken.getToken())
                .userId(refreshToken.getUser().getId())
                .expiryDatetime(refreshToken.getExpiryDatetime())
                .build();
    }
}
