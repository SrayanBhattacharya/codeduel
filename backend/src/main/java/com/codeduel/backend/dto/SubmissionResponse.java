package com.codeduel.backend.dto;

public record SubmissionResponse(Long id, boolean isCorrect, int testCasesPassed, int pointsEarned, int timeTakenSeconds) {}
