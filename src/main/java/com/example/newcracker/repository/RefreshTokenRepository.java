package com.example.newcracker.repository;


import com.example.newcracker.dto.refreshToken.RefreshDto;
import com.example.newcracker.entity.RefreshToken;
import com.example.newcracker.entity.Users;

import java.util.Optional;

public interface RefreshTokenRepository{
    void save(String token, Users user, long ttl);

    Optional<RefreshDto> findByToken(String token);

    void deleteByToken(String token);

    RefreshToken findByUser(Users user);
}
