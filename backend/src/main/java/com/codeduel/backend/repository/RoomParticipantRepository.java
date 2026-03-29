package com.codeduel.backend.repository;

import com.codeduel.backend.entity.Role;
import com.codeduel.backend.entity.Room;
import com.codeduel.backend.entity.RoomParticipant;
import com.codeduel.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {
    List<RoomParticipant> findByRoomOrderByTotalScoreDesc(Room room);
    Optional<RoomParticipant> findByRoomAndPlayer(Room room, User player);
    List<RoomParticipant> findByRoomAndRole(Room room, Role role);
    int countByRoom(Room room);
    @Query("SELECT rp FROM RoomParticipant rp WHERE rp.player = :player AND rp.room.status = com.codeduel.backend.entity.RoomStatus.WAITING")
    Optional<RoomParticipant> findActiveRoomByPlayer(@Param("player") User player);
}
