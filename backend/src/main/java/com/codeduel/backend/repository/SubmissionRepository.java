package com.codeduel.backend.repository;

import com.codeduel.backend.entity.Round;
import com.codeduel.backend.entity.Submission;
import com.codeduel.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByRoundAndUser(Round round, User user);
    List<Submission> findByRound(Round round);
}
