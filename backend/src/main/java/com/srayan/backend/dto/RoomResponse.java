package com.srayan.backend.dto;

import java.util.List;

public record RoomResponse(Long id, String roomCode, String hostUsername, String status, int maxPlayers, List<ParticipantResponse> participants) {}
