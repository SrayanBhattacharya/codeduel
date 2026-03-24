package com.codeduel.backend.util;

import java.security.SecureRandom;

public class RoomCodeGenerator {
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    public static String generate() {
        SecureRandom random = new SecureRandom();
        StringBuilder roomCode = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            roomCode.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }

        return roomCode.toString();
    }
}
