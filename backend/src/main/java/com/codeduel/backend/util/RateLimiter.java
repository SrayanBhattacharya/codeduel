package com.codeduel.backend.util;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

import java.time.Duration;

public class RateLimiter {

    private static final Bucket bucket = Bucket.builder()
            .addLimit(
                    Bandwidth.builder()
                            .capacity(5)
                            .refillGreedy(5, Duration.ofSeconds(1))
                            .build()
            )
            .build();

    public static boolean tryConsume() {
        return bucket.tryConsume(1);
    }
}
