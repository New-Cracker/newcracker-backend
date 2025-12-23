package com.example.newcracker.dto.user.request;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserPasswordUpdateRequest {
    @NotNull
    private String currentPassword;

    @NotNull
    private String newPassword;
}
