package com.codeduel.backend.exception;

public class PlayerLimitReachedException extends RuntimeException {
    public PlayerLimitReachedException(String message) {
        super(message);
    }
}
