package com.hars.routes.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hars.services.users.UserService;


@RestController
@RequestMapping("/api/users/")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(userService.getAllUsers());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Get all Users\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }
    
}
