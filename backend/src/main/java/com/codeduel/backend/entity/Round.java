package com.codeduel.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoundStatus status;
    @OneToMany(mappedBy = "round", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestCase> testCases = new ArrayList<>();
    private Instant createdAt;
    private Instant startTime;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
