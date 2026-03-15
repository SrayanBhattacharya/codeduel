package com.srayan.backend.repository;

import com.srayan.backend.entity.Room;
import com.srayan.backend.entity.Round;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoundRepository extends JpaRepository<Round, Long> {
    List<Round> findByRoomOrderByRoundNumberAsc(Room room);
}
