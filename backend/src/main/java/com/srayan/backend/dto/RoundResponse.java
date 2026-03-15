package com.srayan.backend.dto;

import java.util.List;

public record RoundResponse(Long id, int roundNumber, String problemTitle, String problemDescription, int timeLimitSeconds, String status, List<TestCaseRequest> testCases) {}
