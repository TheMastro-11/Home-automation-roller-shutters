package com.hars.routes.lightSensor;

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

import com.hars.persistence.dto.lightSensor.LightSensorDTO;
import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.services.OwnershipService;
import com.hars.services.lightSensor.LightSensorService;

@RestController
@RequestMapping("/api/entities/lightSensor")
public class LightSensorController {

    @Autowired
    private LightSensorService lightSensorService;

    @Autowired
    private OwnershipService ownershipService;

    @GetMapping("/")
    public ResponseEntity<?> getAllLightSensors() {
        try {
            //ownership
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            List<Long> userLightSensors = ownershipService.getIds(username, "lightSensor"); 
            List<LightSensorDTO> validLightSensors = new ArrayList<>();
            for (LightSensorDTO lightSensor : lightSensorService.getAllLightSensors()) {
                if (userLightSensors.contains(lightSensor.getId())) {
                    validLightSensors.add(lightSensor);
                }
            }
            
            return ResponseEntity.ok(validLightSensors);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Get all RollerShutters\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PostMapping("/create")
    public ResponseEntity<String> createLightSensor(@RequestBody LightSensorDTO.nameInput lightSensor) {
        try {
            if (lightSensorService.isPresentByName(lightSensor.name())) {
                return ResponseEntity.badRequest().body("Error: Name is already taken!");
            }

            LightSensor newLightSensor = lightSensorService.createLightSensor(lightSensor);
            String newLightSensorS = newLightSensor.toJson();

            //ownership
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            ownershipService.addOwnerShip(username, newLightSensor);

            return ResponseEntity.ok("{" + "\"Response\" : \"LightSensor created successfully!\" , \"Entity\" : {" + newLightSensorS + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot create\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }

    }

    @DeleteMapping(("/delete/{id}"))
    public ResponseEntity<String> deleteLightSensor(@PathVariable Long id){
        try {
            if (!lightSensorService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }
            lightSensorService.deleteLightSensor(id);
            return ResponseEntity.ok("\"LightSensor deleted successfully!\"");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Delete\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/name/{id}")
    public ResponseEntity<String> patchNameLightSensor (@PathVariable Long id, @RequestBody LightSensorDTO.nameInput lightSensor) {
        try {
            if (!lightSensorService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newLightSensor = lightSensorService.patchNameLightSensor(id, lightSensor.name() ).toJson();
            return ResponseEntity.ok("{ \"Entity\" : {" + newLightSensor + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify name\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/value/{id}")
    public ResponseEntity<String> patchValueLightSensor (@PathVariable Long id, @RequestBody LightSensorDTO.lightValueInput lightSensor) {
        try {
            if (!lightSensorService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newLightSensor = lightSensorService.patchValueLightSensor(id, lightSensor.value()).toJson();
            return ResponseEntity.ok("{ \"Entity\" : {" + newLightSensor + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify light value\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

}