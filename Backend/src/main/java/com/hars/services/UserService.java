package com.hars.services;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.hars.persistence.entities.User;
import com.hars.persistence.repository.UserRepository;

@Service
public class UserService  {

    private UserRepository userRepository;

    public Optional<User> checkUser(String authenticationRequestUsername) {
        Optional<User> userOpt = userRepository.findByUsername(authenticationRequestUsername);

        return userOpt;
    }
}