package com.srayan.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import java.time.Instant;

@Entity
@Getter
@Setter
@ToString
@NoArgsConstructor
@Table(name = "rounds")
public class Round {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;
    @Column(nullable = false)
    private int roundNumber;
    @Column(nullable = false)
    private String problemTitle;
    @Column(columnDefinition = "TEXT")
    private String problemDescription;
    @Column(nullable = false)
    private int timeLimitSeconds;
    @Column(nullable = false)
    private int totalTestCases;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoundStatus status;
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
