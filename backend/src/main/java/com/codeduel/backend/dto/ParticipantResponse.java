package com.codeduel.backend.dto;

import com.codeduel.backend.entity.Role;

public record ParticipantResponse(Long id, String username, Role role) {}
