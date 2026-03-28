package com.codeduel.backend.controller;

import com.codeduel.backend.dto.LeaderboardEntryResponse;
import com.codeduel.backend.dto.SubmissionResponse;
import com.codeduel.backend.dto.SubmitCodeRequest;
import com.codeduel.backend.service.RoomService;
import com.codeduel.backend.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class SubmissionController {
    private final SubmissionService submissionService;
    private final RoomService roomService;

    @PostMapping("/{code}/rounds/{roundId}/submit")
    public ResponseEntity<SubmissionResponse> submit(@PathVariable String code, @PathVariable Long roundId, @RequestBody SubmitCodeRequest request) {
        SubmissionResponse response = submissionService.submit(code, roundId, request);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{code}/leaderboard")
    public ResponseEntity<List<LeaderboardEntryResponse>> getLeaderboard(@PathVariable String code) {
        return ResponseEntity.ok(roomService.getLeaderboard(code));
    }
}
