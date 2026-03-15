package com.srayan.backend.dto;

import java.util.List;

public record CreateRoundRequest(String problemTitle, String problemDescription, int timeLimitSeconds, List<TestCaseRequest> testCases) {}
