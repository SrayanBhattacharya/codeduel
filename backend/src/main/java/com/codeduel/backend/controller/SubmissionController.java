package com.codeduel.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeduel.backend.dto.LeaderboardEntryResponse;
import com.codeduel.backend.dto.SubmissionResponse;
import com.codeduel.backend.dto.SubmitCodeRequest;
import com.codeduel.backend.service.RoomService;
import com.codeduel.backend.service.SubmissionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class SubmissionController {
    private final SubmissionService submissionService;
    private final RoomService roomService;

    @PostMapping("/{code}/rounds/{roundId}/submit")
    public ResponseEntity<SubmissionResponse> submit(@PathVariable String code, @PathVariable Long roundId,
            @RequestBody SubmitCodeRequest request) {
        SubmissionResponse response = submissionService.submit(code, roundId, request);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{code}/leaderboard")
    public ResponseEntity<List<LeaderboardEntryResponse>> getLeaderboard(@PathVariable String code) {
        return ResponseEntity.ok(roomService.getLeaderboard(code));
    }
}
