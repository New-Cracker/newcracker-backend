package com.example.newcracker.repository;

import com.example.newcracker.entity.RefreshToken;
import com.example.newcracker.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenJpaRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByToken(String token);

    RefreshToken findByUser(Users user);
}
