package com.hars.routes.home;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hars.persistence.entities.home.Home;
import com.hars.services.home.HomeService;

@RestController
@RequestMapping("/api/entities/home")
public class HomeController {

    @Autowired
    private HomeService homeService;

    @PostMapping("/create")
    public ResponseEntity<?> createHome(@RequestBody Home home) {
        if (homeService.isPresent(home)) {
            return ResponseEntity.badRequest().body("Error: Name is already taken!");
        }

        homeService.createHome(home);

        return ResponseEntity.ok("\"Home created successfully!\"");
    }

    @GetMapping("/")
    public List<Home> getAllHomes() {
        return homeService.getAllHomes();
    }

}