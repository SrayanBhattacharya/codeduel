package com.srayan.backend.dto;

import com.srayan.backend.entity.Role;

public record ParticipantResponse(Long id, String username, Role role) {}
