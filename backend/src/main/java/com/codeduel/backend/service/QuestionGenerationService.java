package com.codeduel.backend.service;

import com.codeduel.backend.dto.GeneratedQuestion;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class QuestionGenerationService {
    private final ChatClient.Builder chatClientBuilder;
    private final ObjectMapper objectMapper;

    public GeneratedQuestion generateQuestion (String difficulty) {
        ChatClient chatClient = chatClientBuilder.build();

        String prompt = """
                Generate a competitive coding problem with the following structure.
                Respond ONLY with a valid JSON object, no markdown, no explanation.
                
                Difficulty: %s
                
                JSON format:
                {
                  "title": "Problem title",
                  "description": "Full problem description with constraints and examples",
                  "testCases": [
                    { "input": "input value", "output": "expected output" },
                    { "input": "input value", "output": "expected output" },
                    { "input": "input value", "output": "expected output" }
                  ]
                }
                
                Rules:
                - Generate exactly 3 test cases
                - Input and output must be plain strings
                - Description must include input format, output format, and constraints
                - Make it suitable for a timed competitive coding round
                """.formatted(difficulty);

        String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        try {
            String cleaned = response.replaceAll("```json", "").replaceAll("```", "").trim();
            return objectMapper.readValue(cleaned, GeneratedQuestion.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse generated question: " + e.getMessage(), e);
        }
    }
}
