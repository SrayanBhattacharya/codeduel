package com.codeduel.backend.util;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class PistonClient {
    @Value("${piston.api.url}")
    private String pistonApiUrl;

    private RestClient restClient;

    @PostConstruct
    public void init() {
        this.restClient = RestClient.builder()
                .baseUrl(pistonApiUrl)
                .build();
    }

    public String execute(String language, String code, String stdin) {
        PistonRequest request = new PistonRequest(
                language,
                "*",
                List.of(new PistonFile(code)),
                stdin
        );

        PistonResponse response = restClient.post()
                .uri("/api/v2/execute")
                .body(request)
                .retrieve()
                .body(PistonResponse.class);

        if (response == null || response.run() == null) {
            throw new RuntimeException("Piston returned null response");
        }

        return response.run().stdout();
    }

    private record PistonRequest(
            String language,
            String version,
            List<PistonFile> files,
            String stdin
    ) {}

    private record PistonFile(String content) {}

    private record PistonResponse(PistonRun run) {}

    private record PistonRun(String stdout, String stderr, int code) {}
}