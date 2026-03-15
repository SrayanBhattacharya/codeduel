package com.srayan.backend.repository;

import com.srayan.backend.entity.Round;
import com.srayan.backend.entity.Submission;
import com.srayan.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByRoundAndPlayer(Round round, User player);
    Optional<Submission> findByRoundAndPlayerOrderByPointsEarnedDesc(Round round, User player);
}
