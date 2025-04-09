package com.hars.routes.lightSensor;

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

import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.services.lightSensor.LightSensorService;

@RestController
@RequestMapping("/api/entities/lightSensor")
public class LightSensorController {

    @Autowired
    private LightSensorService lightSensorService;

    @GetMapping("/")
    public ResponseEntity<?> getAllLightSensors() {
        try {
            return ResponseEntity.ok(lightSensorService.getAllLightSensors());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Get all RollerShutters\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PostMapping("/create")
    public ResponseEntity<String> createLightSensor(@RequestBody LightSensor lightSensor) {
        try {
            if (lightSensorService.isPresentByName(lightSensor.getName())) {
                return ResponseEntity.badRequest().body("Error: Name is already taken!");
            }

            String result = lightSensorService.createLightSensor(lightSensor.getName()).toJson();
            return ResponseEntity.ok("\""+result+"\"");
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
    public ResponseEntity<String> patchNameLightSensor (@PathVariable Long id, @RequestBody LightSensor lightSensor) {
        try {
            if (!lightSensorService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newLightSensor = lightSensorService.patchNameLightSensor(id, lightSensor.getName() ).toJson();
            return ResponseEntity.ok(newLightSensor);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify name\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/value/{id}")
    public ResponseEntity<String> patchValueLightSensor (@PathVariable Long id, @RequestBody LightSensor lightSensor) {
        try {
            if (!lightSensorService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newLightSensor = lightSensorService.patchValueLightSensor(id, lightSensor.getLightValue()).toJson();
            return ResponseEntity.ok(newLightSensor);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify light value\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

}