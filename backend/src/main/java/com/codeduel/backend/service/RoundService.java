package com.codeduel.backend.service;

import com.codeduel.backend.dto.CreateRoundRequest;
import com.codeduel.backend.dto.RoundResponse;
import com.codeduel.backend.dto.TestCaseRequest;
import com.codeduel.backend.dto.TestCaseResponse;
import com.codeduel.backend.entity.*;
import com.codeduel.backend.exception.NotHostException;
import com.codeduel.backend.exception.RoomNotFoundException;
import com.codeduel.backend.exception.RoundNotFoundException;
import com.codeduel.backend.repository.RoomParticipantRepository;
import com.codeduel.backend.repository.RoomRepository;
import com.codeduel.backend.repository.RoundRepository;
import com.codeduel.backend.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

@Service
@AllArgsConstructor
public class RoundService {
    private final RoomRepository roomRepository;
    private final RoundRepository roundRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final TaskScheduler taskScheduler;
    private final SubmissionService submissionService;
    private final SimpMessagingTemplate messagingTemplate;

    private RoundResponse mapToResponse(Round round) {
        return new RoundResponse(round.getId(), round.getRoundNumber(), round.getProblemTitle(), round.getProblemDescription(), round.getTimeLimitSeconds(), round.getStatus().name(), round.getTestCases().stream().map(tc -> new TestCaseResponse(tc.getId(), tc.getInput(), tc.getExpectedOutput())).toList());
    }

    private RoomParticipant getHostParticipant(Room room) {
        User currentUser = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        RoomParticipant participant = roomParticipantRepository.findByRoomAndPlayer(room, currentUser)
                .orElseThrow(() -> new RoomNotFoundException("User is not a participant"));

        if (participant.getRole() != Role.ROLE_HOST) {
            throw new NotHostException("Only the host can perform this action");
        }

        return participant;
    }

    public RoundResponse createRound(String roomCode, CreateRoundRequest request) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RoomNotFoundException("Room not found with code: " + roomCode));

        getHostParticipant(room);

        int roundNumber = roundRepository.findByRoomOrderByRoundNumberAsc(room).size() + 1;

        Round round = new Round();
        round.setRoom(room);
        round.setRoundNumber(roundNumber);
        round.setStatus(RoundStatus.WAITING);
        round.setProblemTitle(request.problemTitle());
        round.setProblemDescription(request.problemDescription());
        round.setTimeLimitSeconds(request.timeLimitSeconds());

        for (TestCaseRequest tc : request.testCases()) {
            TestCase testCase = new TestCase();
            testCase.setRound(round);
            testCase.setInput(tc.input());
            testCase.setExpectedOutput(tc.expectedOutput());
            round.getTestCases().add(testCase);
        }

        roundRepository.save(round);
        return mapToResponse(round);
    }

    public RoundResponse startRound(String roomCode, Long roundId) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RoomNotFoundException("Room not found with code: " + roomCode));

        getHostParticipant(room);

        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new RoundNotFoundException("Round not found with id: " + roundId));

        if (!round.getRoom().getId().equals(room.getId())) {
            throw new RoomNotFoundException("Round does not belong to the room: " + roomCode);
        }

        round.setStartTime(Instant.now());
        round.setStatus(RoundStatus.ACTIVE);

        Instant expiryTime = round.getStartTime()
                        .plusSeconds(round.getTimeLimitSeconds());

        taskScheduler.schedule(
                () -> submissionService.finishRound(round.getId()),
                expiryTime
        );

        roundRepository.save(round);

        messagingTemplate.convertAndSend(
                "/topic/rooms/" + roomCode + "/round-started",
                mapToResponse(round)
        );

        return mapToResponse(round);
    }

    public List<RoundResponse> getRounds(String roomCode) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RoomNotFoundException("Room not found with code: " + roomCode));

        List<RoundResponse> rounds = roundRepository
                .findByRoomOrderByRoundNumberAsc(room)
                .stream()
                .map(round -> mapToResponse(round))
                .toList();

        return rounds;
    }
}
