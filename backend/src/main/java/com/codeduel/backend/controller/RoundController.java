package com.codeduel.backend.controller;

import com.codeduel.backend.dto.CreateRoundRequest;
import com.codeduel.backend.dto.GeneratedQuestion;
import com.codeduel.backend.dto.RoundResponse;
import com.codeduel.backend.service.QuestionGenerationService;
import com.codeduel.backend.service.RoundService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoundController {
    private final RoundService roundService;
    private final QuestionGenerationService questionGenerationService;

    @PostMapping("/{code}/rounds")
    public ResponseEntity<RoundResponse> create(@PathVariable String code, @RequestBody CreateRoundRequest request) {
        RoundResponse response = roundService.createRound(code, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{code}/rounds/{roundId}/start")
    public ResponseEntity<RoundResponse> start(@PathVariable String code, @PathVariable Long roundId) {
        RoundResponse response = roundService.startRound(code, roundId);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{code}/rounds")
    public ResponseEntity<List<RoundResponse>> getRounds(@PathVariable String code) {
        List<RoundResponse> response = roundService.getRounds(code);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/{code}/rounds/generate")
    public ResponseEntity<GeneratedQuestion> generate(@PathVariable String code, @RequestParam(defaultValue = "easy") String difficulty) {
        GeneratedQuestion response = questionGenerationService.generateQuestion(difficulty);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
