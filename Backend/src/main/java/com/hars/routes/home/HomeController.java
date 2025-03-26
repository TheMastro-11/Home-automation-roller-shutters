package com.hars.routes.home;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hars.persistence.entities.home.Home;
import com.hars.services.home.HomeService;

@RestController
@RequestMapping("/home")
public class HomeController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private HomeService homeService;

    @PostMapping("/create")
    public ResponseEntity<?> createHome(@RequestBody Home home) {
        // Check if the username is already taken
        if (homeService.homeRepository.findByName(home.getName()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        // Save the user to the database
        homeService.homeRepository.save(home);

        return ResponseEntity.ok("\"Home created successfully!\"");
    }

    @GetMapping("/")
    public List<Home> getAllHomes() {
        return homeService.getAllHomes();
    }

}