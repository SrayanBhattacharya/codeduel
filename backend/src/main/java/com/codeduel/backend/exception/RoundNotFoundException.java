package com.codeduel.backend.exception;

public class RoundNotFoundException extends RuntimeException {
    public RoundNotFoundException(String message) {
        super(message);
    }
}
