package com.example.newcracker.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApiResponse<T> {
    private T data;
    private String message;
    private boolean success;

    // controller 용
    public static <T> ResponseEntity<ApiResponse<T>> ok(T data, String message){
        return ResponseEntity.status(200).body(
                ApiResponse.<T>builder()
                    .success(true)
                    .data(data)
                    .message(message)
                    .build()
        );
    }

    public static <T> ResponseEntity<ApiResponse<T>> ok(String message){
        return ResponseEntity.status(200).body(
                ApiResponse.<T>builder()
                        .success(true)
                        .message(message)
                        .build()
        );
    }

    public static <T> ResponseEntity<ApiResponse<T>> fail(String message, HttpStatus status){
        return ResponseEntity.status(status).body(
                ApiResponse.<T>builder()
                    .success(false)
                    .message(message)
                    .build()
        );
    }
}
