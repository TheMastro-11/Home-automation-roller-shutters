package com.hars.services.users;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hars.persistence.entities.Ownership;
import com.hars.persistence.entities.users.User;
import com.hars.persistence.repository.OwnershipRepository;
import com.hars.persistence.repository.users.UserRepository;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OwnershipRepository ownershipRepository;

    @Override
    public User loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        return user;
    }

    public Boolean isPresent(String username){
        return userRepository.findByUsername(username).isPresent();
    }

    public List<User> getAllUsers(){
        return userRepository.findAll();
    }

    public void createUser(User user){
        userRepository.save(user);

        Ownership ownership = new Ownership(user.getUsername());
        ownershipRepository.save(ownership);
    }
}