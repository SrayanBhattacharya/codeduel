package com.srayan.backend.dto;

public record AuthResponse(String token, Long id, String username, String role) {}
