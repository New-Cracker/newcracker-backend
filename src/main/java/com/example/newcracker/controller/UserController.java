package com.example.newcracker.controller;

import com.example.newcracker.common.ApiResponse;
import com.example.newcracker.dto.user.request.UserPasswordUpdateRequest;
import com.example.newcracker.dto.user.request.UserUpdateRequest;
import com.example.newcracker.dto.user.response.UpdateUserPasswordResponse;
import com.example.newcracker.dto.user.response.UserDetailResponse;
import com.example.newcracker.dto.user.response.UserUpdateResponse;
import com.example.newcracker.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
@Tag(name = "User Controller", description = "User Controller API")
public class UserController {
    private final UserService userService;


    @GetMapping
    @Operation(summary = "Get User Detail", description = "유저 정보 상세 조회 API")
    public ResponseEntity<ApiResponse<UserDetailResponse>> getUserDetail(HttpServletRequest httpServletRequest){
        UserDetailResponse response = userService.getUserDetail(httpServletRequest);
        return ApiResponse.ok(response, "회원 정보를 성공적으로 조회하였습니다.");
    }

    @PutMapping
    @Operation(summary = "Update User Info", description = "유저 정보 수정 API")
    public ResponseEntity<ApiResponse<UserUpdateResponse>> updateUser(HttpServletRequest httpServletRequest, @Valid @RequestBody UserUpdateRequest request){
        UserUpdateResponse response = userService.updateUser(httpServletRequest, request);
        return ApiResponse.ok(response, "회원 정보를 성공적으로 수정하였습니다.");
    }

    @PatchMapping("/password")
    @Operation(summary = "Update User Password", description = "유저 비밀번호 수정 API")
    public ResponseEntity<ApiResponse<UpdateUserPasswordResponse>> updateUserPassword(HttpServletRequest httpServletRequest, @Valid @RequestBody UserPasswordUpdateRequest request){
        UpdateUserPasswordResponse response = userService.updateUserPassword(httpServletRequest, request);
        return ApiResponse.ok(response, "비밀번호를 성공적으로 변경하였습니다.");
    }
}
