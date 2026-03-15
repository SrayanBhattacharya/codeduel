package com.srayan.backend.repository;

import com.srayan.backend.entity.Room;
import com.srayan.backend.entity.RoomParticipant;
import com.srayan.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {
    List<RoomParticipant> findByRoomOrderByTotalScoreDesc(Room room);
    Optional<RoomParticipant> findByRoomAndPlayer(Room room, User player);
}
