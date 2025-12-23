package com.example.newcracker.repository;

public interface BlacklistRepository {
    void addToBlacklist(String token, long ttl);
    boolean isBlacklisted(String token);
}
