package com.srayan.backend.dto;

public record RoomResponse(Long id, String roomCode, String hostUsername, String status, int maxPlayers) {}
