package com.example.newcracker.dto.user.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeleteUserRequest {
    @NotNull
    private String refreshToken;
}
