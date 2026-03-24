package com.codeduel.backend.repository;

import com.codeduel.backend.entity.Room;
import com.codeduel.backend.entity.Round;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoundRepository extends JpaRepository<Round, Long> {
    List<Round> findByRoomOrderByRoundNumberAsc(Room room);
}
