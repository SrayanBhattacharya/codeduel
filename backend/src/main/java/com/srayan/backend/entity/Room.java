package com.srayan.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String roomCode;
    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    private User host;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomStatus status;
    private int maxPlayers = 10;
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
