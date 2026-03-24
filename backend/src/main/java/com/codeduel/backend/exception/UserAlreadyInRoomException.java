package com.codeduel.backend.exception;

public class UserAlreadyInRoomException extends RuntimeException {
    public UserAlreadyInRoomException(String message) {
        super(message);
    }
}
