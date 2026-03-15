package com.srayan.backend.repository;

import com.srayan.backend.entity.Round;
import com.srayan.backend.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    List<TestCase> findByRound(Round round);
}
