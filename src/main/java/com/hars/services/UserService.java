package com.hars.services;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hars.persistence.entities.User;
import com.hars.persistence.entities.UserRepository;

@Service
public class UserService{

    @Autowired
    private UserRepository userRepository;

    public String registerUser(User user){
        try {
            User user2 = userRepository.save(user);
            return "\"ok\"";
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return "\"no\"";
    
    }

    public String loginUser(User userLog){
        Optional<User> userOpt = userRepository.findByName(userLog.getName());

        if (userOpt.isEmpty()) {
            return "Utente non trovato";
        }

        User user = userOpt.get();

        String hashedPassword = hashPassword(userLog.getPassword());
        if (!user.getPassword().equals(hashedPassword)) {
            return "Password errata";
        }
 
        return "Login riuscito!"; 

    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(password.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : encodedHash) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Errore nell'hashing della password", e);
        }
    }
}