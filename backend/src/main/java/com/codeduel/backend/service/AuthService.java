package com.codeduel.backend.service;

import com.codeduel.backend.dto.AuthResponse;
import com.codeduel.backend.dto.LoginRequest;
import com.codeduel.backend.dto.RegisterRequest;
import com.codeduel.backend.entity.Role;
import com.codeduel.backend.entity.User;
import com.codeduel.backend.exception.InvalidCredentialsException;
import com.codeduel.backend.exception.UserAlreadyExistsException;
import com.codeduel.backend.repository.UserRepository;
import com.codeduel.backend.util.JwtService;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new UserAlreadyExistsException("Username already taken");
        }

        User user = new User(
                request.username(),
                passwordEncoder.encode(request.password()),
                Role.ROLE_PLAYER
        );

        user = userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole().name());
    }
}
