package com.codeduel.backend.repository;

import com.codeduel.backend.entity.Round;
import com.codeduel.backend.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    List<TestCase> findByRound(Round round);
}
