package com.example.newcracker.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class TokenProvider {
    private final SecretKey key;
    private static final long ACCESS_TOKEN_ABILITY = 1000L * 60 * 60;
    private static final long REFRESH_TOKEN_ABILITY = 1000L * 60 * 60 * 24 * 7;

    @Autowired
    private final RedisTemplate<String, Object> redisTemplate;

    public TokenProvider(@Value("${spring.jwt.secret}") String secretKey, RedisTemplate<String, Object> redisTemplate){
        this.key = Keys.hmacShaKeyFor(secretKey.getBytes());
        this.redisTemplate = redisTemplate;
    }


    //액세스 토큰 생성
    public String createAccessToken(String username){
        Date now = new Date();
        Date expiry = new Date(now.getTime() + ACCESS_TOKEN_ABILITY);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    //리프레시 토큰 생성
    public String createRefreshToken(String username){
        Date now = new Date();
        Date expiry = new Date(now.getTime() + REFRESH_TOKEN_ABILITY);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    //사용자 정보 추출
    public String extractUsername(String token) {
        return Jwts.parser()
                .verifyWith(this.key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    //토큰 유효성 검사
    public boolean validateToken(String token){
        try{
            Jwts.parser()
                    .verifyWith(this.key) // SecretKey
                    .build()
                    .parseSignedClaims(token); // 서명된 클레임 파싱 및 검증
            return true;
        } catch(JwtException | IllegalArgumentException e){
            return false;
        }
    }

    //만료 기간 가져옴
    public Long getExpiration(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Date expiration = claims.getExpiration();
            Date now = new Date();

            long remainingTime = expiration.getTime() - now.getTime();
            return remainingTime > 0 ? remainingTime : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }
}
