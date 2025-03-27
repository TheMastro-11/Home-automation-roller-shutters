package com.hars.routes.home;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hars.persistence.dto.home.HomeDTO;
import com.hars.persistence.entities.home.Home;
import com.hars.services.home.HomeService;

@RestController
@RequestMapping("/api/entities/home")
public class HomeController {

    @Autowired
    private HomeService homeService;

    @PostMapping("/create")
    public ResponseEntity<String> createHome(@RequestBody Home home) {
        if (homeService.isPresentByName(home.getName())) {
            return ResponseEntity.badRequest().body("Error: Name is already taken!");
        }

        String newHome = homeService.createHome(home).toJson();

        return ResponseEntity.ok("\"Response\" : \"Home created successfully!\" , \"Entity\" :" + newHome);
    }

    @GetMapping("/")
    public ResponseEntity<List<HomeDTO>> getAllHomes() {
        return ResponseEntity.ok(homeService.getAllHomes());
    }

    @DeleteMapping(("/delete/{id}"))
    public ResponseEntity<String> deleteHome(@PathVariable Long id){
        if (!homeService.isPresentById(id)) {
            return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
        }

        try {
            homeService.deleteHome(id);
            return ResponseEntity.ok("\"Home deleted successfully!\"");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Delete\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PutMapping("/put/{id}")
    public ResponseEntity<String> putHome(@PathVariable Long id, @RequestBody Home home){
        if (!homeService.isPresentById(id)) {
            return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
        }

        String newHome = homeService.putHome(id, home).toJson();

        return ResponseEntity.ok("\"Response\" : \"Home modified successfully!\" , \"Entity\" :" + newHome);
    }

}