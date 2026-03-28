package com.codeduel.backend.service;

import com.codeduel.backend.dto.LeaderboardEntryResponse;
import com.codeduel.backend.dto.RoundResponse;
import com.codeduel.backend.dto.SubmissionResponse;
import com.codeduel.backend.dto.SubmitCodeRequest;
import com.codeduel.backend.entity.*;
import com.codeduel.backend.exception.RoundNotActiceException;
import com.codeduel.backend.exception.RoundNotFoundException;
import com.codeduel.backend.repository.RoomParticipantRepository;
import com.codeduel.backend.repository.RoundRepository;
import com.codeduel.backend.repository.SubmissionRepository;
import com.codeduel.backend.util.PistonClient;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionService {
    private final RoundRepository roundRepository;
    private final SubmissionRepository submissionRepository;
    private final PistonClient pistonClient;
    private final RoomParticipantRepository roomParticipantRepository;
    private final SimpMessagingTemplate messagingTemplate;

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

        int timeTakenSeconds = (int) Duration.between(round.getStartTime(), Instant.now()).getSeconds();

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

    @Transactional
    public void finishRound(Long id) {
        Round round = roundRepository.findById(id)
                .orElseThrow(() -> new RoundNotFoundException("Round not found with id: " + id));

        if (round.getStatus() != RoundStatus.ACTIVE) {
            return;
        }

        List<RoomParticipant> players = roomParticipantRepository
                .findByRoomAndRole(round.getRoom(), Role.ROLE_PLAYER);

        for (RoomParticipant participant : players) {
            List<Submission> playerSubmissions = submissionRepository
                    .findByRoundAndUser(round, participant.getPlayer());

            if (playerSubmissions.isEmpty()) {
                Submission blank = new Submission();
                blank.setRound(round);
                blank.setUser(participant.getPlayer());
                blank.setCode("");
                blank.setLanguage("none");
                blank.setTestCasesPassed(0);
                blank.setTimeTakenSeconds(round.getTimeLimitSeconds());
                blank.setPointsEarned(0);
                submissionRepository.save(blank);
                playerSubmissions = List.of(blank);
            }

            int bestScore = playerSubmissions.stream()
                    .mapToInt(Submission::getPointsEarned)
                    .max()
                    .orElse(0);

            participant.setTotalScore((participant.getTotalScore() + bestScore));
            roomParticipantRepository.save(participant);
        }

        round.setStatus(RoundStatus.FINISHED);
        roundRepository.save(round);

        String roomCode = round.getRoom().getRoomCode();

        messagingTemplate.convertAndSend(
                "/topic/rooms/" + roomCode + "/round-finished",
                new RoundResponse(
                        round.getId(),
                        round.getRoundNumber(),
                        round.getProblemTitle(),
                        round.getProblemDescription(),
                        round.getTimeLimitSeconds(),
                        round.getStatus().name(),
                        List.of()
                )
        );

        List<LeaderboardEntryResponse> leaderboard = players.stream()
                .sorted((a, b) -> b.getTotalScore() - a.getTotalScore())
                .map(p -> new LeaderboardEntryResponse(
                        p.getPlayer().getUsername(),
                        p.getTotalScore()
                ))
                .toList();

        messagingTemplate.convertAndSend(
                "/topic/rooms/" + roomCode + "/leaderboard",
                leaderboard
        );
    }
}
