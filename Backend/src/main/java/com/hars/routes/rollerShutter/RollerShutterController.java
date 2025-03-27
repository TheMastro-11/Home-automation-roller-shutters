package com.hars.routes.rollerShutter;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.services.rollerShutter.RollerShutterService;

@RestController
@RequestMapping("/api/entities/rollerShutter")
public class RollerShutterController {

    @Autowired
    private RollerShutterService rollerShutterService;

    @PostMapping("/create")
    public ResponseEntity<?> createRoller_shutter(@RequestBody RollerShutter roller_shutter) {
        if (rollerShutterService.isPresent(roller_shutter)) {
            return ResponseEntity.badRequest().body("Error: Name is already taken!");
        }

        try {
            String result = rollerShutterService.createRollerShutter(roller_shutter.getName(), roller_shutter.getHome().getName());
            return ResponseEntity.ok("\""+result+"\"");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok("\""+e.toString()+"\"");
        }

    }

    @GetMapping("/")
    public List<RollerShutter> getAllRollerShutter() {
        return rollerShutterService.getAllRollerShutters();
    }

}