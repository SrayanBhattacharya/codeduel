package com.codeduel.backend.dto;

public record SubmissionResponse(Long id, int testCasesPassed, int pointsEarned, Integer timeTakenSeconds, int totalTestCases) {}
