package com.codeduel.backend.controller;

import com.codeduel.backend.dto.CreateRoomRequest;
import com.codeduel.backend.dto.RoomResponse;
import com.codeduel.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {
    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomResponse> create(@RequestBody CreateRoomRequest request) {
        RoomResponse roomResponse = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(roomResponse);
    }

    @PostMapping("/{code}/join")
    public ResponseEntity<RoomResponse> join(@PathVariable String code) {
        RoomResponse roomResponse = roomService.joinRoom(code);
        return ResponseEntity.status(HttpStatus.OK).body(roomResponse);
    }

    @GetMapping("/{code}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable String code) {
        RoomResponse roomResponse = roomService.getRoom(code);
        return ResponseEntity.status(HttpStatus.OK).body(roomResponse);
    }
}
