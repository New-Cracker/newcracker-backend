package com.example.newcracker.dto.user.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String refreshToken;
    private String accessToken;
}
