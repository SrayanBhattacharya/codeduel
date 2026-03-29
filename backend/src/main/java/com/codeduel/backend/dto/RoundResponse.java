package com.codeduel.backend.dto;

import java.time.Instant;
import java.util.List;

public record RoundResponse(Long id, int roundNumber, String problemTitle, String problemDescription, int timeLimitSeconds, String status, List<TestCaseResponse> testCases, Instant startedAt) {}
