package com.hars.routes.home;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hars.persistence.dto.home.HomeDTO;
import com.hars.persistence.entities.home.Home;
import com.hars.services.OwnershipService;
import com.hars.services.home.HomeService;


@RestController
@RequestMapping("/api/entities/home")
public class HomeController {

    @Autowired
    private HomeService homeService;

    @Autowired
    private OwnershipService ownershipService;

    @GetMapping("/")
    public ResponseEntity<?> getAllHomes() {
        try {
            //ownership
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            List<Long> userHomes = ownershipService.getIds(username, "home"); 
            List<HomeDTO> validHomes = new ArrayList<>();
            for (HomeDTO home: homeService.getAllHomes()) {
                if (userHomes.contains(home.getId())) {
                    validHomes.add(home);
                }
            }

            return ResponseEntity.ok(validHomes);
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

            Home newHome = homeService.createHome(home);
            String newHomeS = newHome.toJson();

            //ownership
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            ownershipService.addOwnerShip(username, newHome);

            return ResponseEntity.ok("{" + "\"Response\" : \"Home created successfully!\" , \"Entity\" : {" + newHomeS + "}}");
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

            return ResponseEntity.ok("{ \"Entity\" : {" + newHome + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify name\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
        
    }

    @PatchMapping("/patch/rollerShutters/{id}")
    public ResponseEntity<String> patchRollerShuttersHome(@PathVariable Long id, @RequestBody HomeDTO.rollerShutterInput home){
        try {
            if (!homeService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            Home newHome_ = homeService.patchRollerShuttersHome(id, home.rollerShutters());
            String newHome = newHome_.toJson(newHome_.getRollerShutters());

            return ResponseEntity.ok("{ \"Entity\" : {" + newHome + "}}");
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify roller shutters\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
        
    }

    @PatchMapping("/patch/lightSensor/{id}")
    public ResponseEntity<String> patchLightSensorHome(@PathVariable Long id, @RequestBody HomeDTO.lightSensorInput home){
        try {
            if (home.lightSensor() == null) {
                homeService.removeLightSensorHome(id);
                return ResponseEntity.ok("");
            } else {
                if (!homeService.isPresentById(id)) {
                    return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
                }
                Home newHome_ = homeService.patchLightSensorHome(id, home.lightSensor());
                String newHome = newHome_.toJson(newHome_.getLightSensor());
                return ResponseEntity.ok("{ \"Entity\" : {" + newHome + "}}");
            }          
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify light sensor\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
        
    }



}