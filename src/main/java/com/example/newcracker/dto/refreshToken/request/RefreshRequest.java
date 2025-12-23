package com.example.newcracker.dto.refreshToken.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RefreshRequest {
    @NotNull
    private String refreshToken;
}
