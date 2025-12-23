package com.example.newcracker.config;

import com.example.newcracker.global.exception.JwtAuthenticationException;
import com.example.newcracker.repository.BlacklistRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final TokenProvider tokenProvider;
    private final CustomUserDetailService userDetailsService;
    private final BlacklistRepository blacklistRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String uri = request.getRequestURI();

        return uri.startsWith("/api/auth/") ||
                uri.startsWith("/swagger-ui/") ||
                uri.startsWith("/v3/api-docs");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        final String header = request.getHeader("Authorization");

        try {
            if (header == null) {
                throw new JwtAuthenticationException("Authorization 헤더가 없습니다.");
            }

            if (!header.startsWith("Bearer ")) {
                throw new JwtAuthenticationException("Authorization 형식이 올바르지 않습니다.");
            }

            String token = header.substring(7);

            if (!tokenProvider.validateToken(token)) {
                throw new JwtAuthenticationException("유효하지 않은 Access Token입니다.");
            }

            if (blacklistRepository.isBlacklisted(token)) {
                throw new JwtAuthenticationException("로그아웃된 토큰입니다.");
            }

            String username = tokenProvider.extractUsername(token);
            if (username == null || username.isEmpty()) {
                throw new JwtAuthenticationException("이메일을 추출할 수 없습니다.");
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch(JwtAuthenticationException e){
            SecurityContextHolder.clearContext();
            request.setAttribute("jwtException", e);
            throw e;
        }

        filterChain.doFilter(request, response);
    }
}
