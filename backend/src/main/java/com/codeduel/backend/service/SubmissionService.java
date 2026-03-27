package com.codeduel.backend.service;

import com.codeduel.backend.dto.SubmissionResponse;
import com.codeduel.backend.dto.SubmitCodeRequest;
import com.codeduel.backend.entity.*;
import com.codeduel.backend.exception.RoundNotActiceException;
import com.codeduel.backend.exception.RoundNotFoundException;
import com.codeduel.backend.repository.RoundRepository;
import com.codeduel.backend.repository.SubmissionRepository;
import com.codeduel.backend.util.PistonClient;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionService {
    private final RoundRepository roundRepository;
    private final SubmissionRepository submissionRepository;
    private final PistonClient pistonClient;

    public SubmissionResponse submit(String roomCode, Long roundId, SubmitCodeRequest request) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new RoundNotFoundException("Round not found with id: " + roundId));

        if (!round.getRoom().getRoomCode().equals(roomCode)) {
            throw new RoundNotFoundException("Round does not belong to room with code: " + roomCode);
        }

        if (round.getStatus() != RoundStatus.ACTIVE) {
            throw new RoundNotActiceException("Round is not active. Cannot submit code.");
        }

        User currentUser = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        int timeTakenSeconds = (int) Duration.between(round.getStartTime(), LocalDateTime.now()).getSeconds();

        List<TestCase> testCases = round.getTestCases();
        int totalTestCases = testCases.size();
        int testCasesPassed = 0;

        for (TestCase testCase : testCases) {
            String actualOutput = pistonClient.execute(request.language(), request.code(), testCase.getInput());
            if (actualOutput.trim().equals(testCase.getExpectedOutput().trim())) {
                testCasesPassed++;
            }
        }

        double speedMultiplier = Math.max(0.5, 1.0 - ((double) timeTakenSeconds / round.getTimeLimitSeconds()) * 0.5);
        double pointsEarned = ((double) testCasesPassed / totalTestCases) * 100 * speedMultiplier;

        Submission submission = new Submission();
        submission.setRound(round);
        submission.setUser(currentUser);
        submission.setCode(request.code());
        submission.setLanguage(request.language());
        submission.setTestCasesPassed(testCasesPassed);
        submission.setTimeTakenSeconds(timeTakenSeconds);
        submission.setPointsEarned((int) pointsEarned);

        submissionRepository.save(submission);

        return new SubmissionResponse(submission.getId(), testCasesPassed, (int) pointsEarned, timeTakenSeconds, totalTestCases);
    }
}
