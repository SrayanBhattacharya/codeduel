package com.codeduel.backend.dto;

import java.util.List;

public record CreateRoundRequest(String problemTitle, String problemDescription, int timeLimitSeconds, List<TestCaseRequest> testCases) {}
