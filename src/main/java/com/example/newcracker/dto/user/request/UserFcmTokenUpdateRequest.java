package com.example.newcracker.dto.user.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserFcmTokenUpdateRequest {
    @NotNull
    private String fcmToken;
}
