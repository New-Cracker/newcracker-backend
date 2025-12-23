package com.example.newcracker.dto.user.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class SignupRequest {
    @NotNull
    private String email;

    @NotNull
    private String nickname;

    @NotNull
    private String password;
}
