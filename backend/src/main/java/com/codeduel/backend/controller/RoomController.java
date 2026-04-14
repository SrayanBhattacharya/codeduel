package com.codeduel.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeduel.backend.dto.CreateRoomRequest;
import com.codeduel.backend.dto.RoomResponse;
import com.codeduel.backend.service.RoomService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/rooms")
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

    @GetMapping("/current")
    public ResponseEntity<RoomResponse> getCurrentRoom() {
        return roomService.getCurrentRoom()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @DeleteMapping("/{code}/leave")
    public ResponseEntity<Void> leaveRoom(@PathVariable String code) {
        roomService.leaveRoom(code);
        return ResponseEntity.noContent().build();
    }
}
