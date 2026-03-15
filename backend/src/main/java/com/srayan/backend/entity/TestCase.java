package com.srayan.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "test_cases")
public class TestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "round_id", nullable = false)
    private Round round;
    @Column(columnDefinition = "TEXT", nullable = false)
    private String input;
    @Column(columnDefinition = "TEXT", nullable = false)
    private String expectedOutput;
}
