package com.hars.routes.home;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hars.persistence.dto.home.HomeDTO;
import com.hars.services.home.HomeService;


@RestController
@RequestMapping("/api/entities/home")
public class HomeController {

    @Autowired
    private HomeService homeService;

    @GetMapping("/")
    public ResponseEntity<?> getAllHomes() {
        try {
            return ResponseEntity.ok(homeService.getAllHomes());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Get all Homes\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PostMapping("/create")
    public ResponseEntity<String> createHome(@RequestBody HomeDTO.nameInput home) {
    
        try {
            if (homeService.isPresentByName(home.name())) {
                return ResponseEntity.badRequest().body("Error: Name is already taken!");
            }

            String newHome = homeService.createHome(home).toJson();
            return ResponseEntity.ok("\"Response\" : \"Home created successfully!\" , \"Entity\" :" + newHome);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Create\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
        
    }

    @DeleteMapping(("/delete/{id}"))
    public ResponseEntity<String> deleteHome(@PathVariable Long id){
        try {
            if (!homeService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            homeService.deleteHome(id);
            return ResponseEntity.ok("\"Home deleted successfully!\"");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Delete\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/name/{id}")
    public ResponseEntity<String> patchNameHome(@PathVariable Long id, @RequestBody HomeDTO.nameInput home){
        try {
            if (!homeService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newHome = homeService.patchNameHome(id, home.name()).toJson();

            return ResponseEntity.ok(newHome);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify name\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
        
    }

    @PatchMapping("/patch/user/{id}")
    public ResponseEntity<String> patchOwnerHome(@PathVariable Long id, @RequestBody HomeDTO.userInput home){
        try {
            if (!homeService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newHome = homeService.patchOwnerHome(id, home.user()).toJson();

            return ResponseEntity.ok(newHome);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify user\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
        
    }

    @PatchMapping("/patch/rollerShutters/{id}")
    public ResponseEntity<String> patchRollerShuttersHome(@PathVariable Long id, @RequestBody HomeDTO.rollerShutterInput home){
        try {
            if (!homeService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newHome = homeService.patchRollerShuttersHome(id, home.rollerShutters()).toJson();

            return ResponseEntity.ok(newHome);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify roller shutters\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
        
    }

    @PatchMapping("/patch/lightSensor/{id}")
    public ResponseEntity<String> patchLightSensorHome(@PathVariable Long id, @RequestBody HomeDTO.lightSensorInput home){
        try {
            if (!homeService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newHome = homeService.patchLightSensorHome(id, home.lightSensor()).toJson();

            return ResponseEntity.ok(newHome);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify light sensor\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
        
    }



}