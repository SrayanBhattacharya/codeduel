package com.codeduel.backend.util;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
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
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);

        this.restClient = RestClient.builder()
                .baseUrl(pistonApiUrl)
                .requestFactory(factory)
                .build();
    }

    public String execute(String language, String code, String stdin) {

        if (code == null || code.length() > 5000) {
            throw new RuntimeException("Invalid code length");
        }

        PistonRequest request = new PistonRequest(
                language,
                "*",
                List.of(new PistonFile(code)),
                stdin,
                3000
        );

        PistonResponse response = restClient.post()
                .uri("/api/v2/execute")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(PistonResponse.class);

        if (response == null || response.run() == null) {
            throw new RuntimeException("Piston returned null response");
        }

        if (response.run().stderr() != null && !response.run().stderr().isEmpty()) {
            return response.run().stderr();
        }
        return response.run().stdout();
    }

    private record PistonRequest(
            String language,
            String version,
            List<PistonFile> files,
            String stdin,
            Integer run_timeout
    ) {}

    private record PistonFile(String content) {}

    private record PistonResponse(PistonRun run) {}

    private record PistonRun(String stdout, String stderr, int code) {}
}