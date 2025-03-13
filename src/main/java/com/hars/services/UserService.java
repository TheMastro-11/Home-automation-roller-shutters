package com.hars.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hars.persistence.entities.User;
import com.hars.persistence.entities.UserRepository;

@Service
public class UserService{

    @Autowired
    private UserRepository userRepository;

    public String registerUser(User user){
        User user2 = userRepository.save(user);
        return "\"no\"";
    
    }
}