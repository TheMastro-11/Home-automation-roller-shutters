package com.hars.routes.roller_shutter;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hars.persistence.entities.roller_shutter.Roller_shutter;
import com.hars.services.roller_shutter.Roller_shutterService;

@RestController
@RequestMapping("/api/entities/roller_shutter")
public class Roller_shutterController {

    @Autowired
    private Roller_shutterService roller_shutterService;

    @PostMapping("/create")
    public ResponseEntity<?> createRoller_shutter(@RequestBody Roller_shutter roller_shutter) {
        // Check if the username is already taken
        if (roller_shutterService.roller_shutterRepository.findByName(roller_shutter.getName()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Name is already taken!");
        }

        String result = roller_shutterService.createRollerShutter(roller_shutter.getName(), roller_shutter.getHome().getName());

        return ResponseEntity.ok("\""+result+"\"");
    }

    @GetMapping("/")
    public List<Roller_shutter> getAllRoller_shutter() {
        return roller_shutterService.getAllRoller_shutters();
    }

}