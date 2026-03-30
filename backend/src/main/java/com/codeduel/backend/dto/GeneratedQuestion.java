package com.codeduel.backend.dto;

import java.util.List;

public record GeneratedQuestion(
        String title,
        String description,
        List<TestCaseDTO> testCases
) {
    public record TestCaseDTO(
            String input,
            String output
    ) {}
}