package com.codeduel.backend.service;

import com.codeduel.backend.dto.CreateRoomRequest;
import com.codeduel.backend.dto.LeaderboardEntryResponse;
import com.codeduel.backend.dto.ParticipantResponse;
import com.codeduel.backend.dto.RoomResponse;
import com.codeduel.backend.entity.*;
import com.codeduel.backend.exception.GameAlreadyStartedException;
import com.codeduel.backend.exception.PlayerLimitReachedException;
import com.codeduel.backend.exception.RoomNotFoundException;
import com.codeduel.backend.exception.UserAlreadyInRoomException;
import com.codeduel.backend.repository.RoomParticipantRepository;
import com.codeduel.backend.repository.RoomRepository;
import com.codeduel.backend.util.RoomCodeGenerator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {
    private final RoomParticipantRepository roomParticipantRepository;
    private final RoomRepository roomRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request) {
        String code = RoomCodeGenerator.generate();
        User currentUser = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        Room room = new Room();
        room.setRoomCode(code);
        room.setHost(currentUser);
        room.setStatus(RoomStatus.WAITING);
        room.setMaxPlayers(request.maxPlayers());
        roomRepository.save(room);

        RoomParticipant roomParticipant = new RoomParticipant();
        roomParticipant.setRoom(room);
        roomParticipant.setPlayer(currentUser);
        roomParticipant.setRole(Role.ROLE_HOST);
        roomParticipantRepository.save(roomParticipant);

        ParticipantResponse participantResponse = new ParticipantResponse(currentUser.getId(), currentUser.getUsername(), Role.ROLE_HOST);

        return new RoomResponse(room.getId(), code, currentUser.getUsername(), room.getStatus().name(), request.maxPlayers(), List.of(participantResponse));
    }

    @Transactional
    public RoomResponse joinRoom(String code) {
        User currentUser = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        Room room = roomRepository.findByRoomCode(code)
                .orElseThrow(() -> new RoomNotFoundException("Room not found with code: " + code));

        if (roomParticipantRepository.findByRoomAndPlayer(room, currentUser).isPresent()) {
            throw new UserAlreadyInRoomException("User is already in a room");
        }

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new GameAlreadyStartedException("Cannot join room, game has already started");
        }

        if (roomParticipantRepository.countByRoom(room) >= room.getMaxPlayers()) {
            throw new PlayerLimitReachedException("Cannot join room, player limit reached");
        }

        RoomParticipant roomParticipant = new RoomParticipant();
        roomParticipant.setRoom(room);
        roomParticipant.setPlayer(currentUser);
        roomParticipant.setRole(Role.ROLE_PLAYER);
        roomParticipantRepository.save(roomParticipant);

        List<ParticipantResponse> participants = roomParticipantRepository
                .findByRoomOrderByTotalScoreDesc(room)
                .stream()
                .map(p -> new ParticipantResponse(p.getPlayer().getId(), p.getPlayer().getUsername(), p.getRole()))
                .toList();

        RoomResponse roomResponse = new RoomResponse(room.getId(), room.getRoomCode(), room.getHost().getUsername(), room.getStatus().name(), room.getMaxPlayers(), participants);

        messagingTemplate.convertAndSend("/topic/rooms/" + code + "/participants", roomResponse);

        return roomResponse;
    }

    public RoomResponse getRoom(String code) {
        Room room = roomRepository.findByRoomCode(code)
                .orElseThrow(() -> new RoomNotFoundException("Room not found with code: " + code));

        List<ParticipantResponse> participants = roomParticipantRepository
                .findByRoomOrderByTotalScoreDesc(room)
                .stream()
                .map(p -> new ParticipantResponse(p.getPlayer().getId(), p.getPlayer().getUsername(), p.getRole()))
                .toList();

        return new RoomResponse(room.getId(), room.getRoomCode(), room.getHost().getUsername(), room.getStatus().name(), room.getMaxPlayers(), participants);
    }

    public List<LeaderboardEntryResponse> getLeaderboard(String roomCode) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RoomNotFoundException("Room not found with code: " + roomCode));

        return roomParticipantRepository.findByRoomOrderByTotalScoreDesc(room)
                .stream()
                .filter(p -> p.getRole() != Role.ROLE_HOST)
                .map(p -> new LeaderboardEntryResponse(p.getPlayer().getUsername(), p.getTotalScore()))
                .toList();
    }
}
