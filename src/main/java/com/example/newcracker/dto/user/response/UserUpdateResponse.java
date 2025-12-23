package com.example.newcracker.dto.user.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserUpdateResponse {
    private Long userId;
    private String email;
    private String nickname;
    private LocalDateTime createdAt;
}
