package com.hars.routes.rollerShutter;

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

import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.services.OwnershipService;
import com.hars.services.mqtt.MqttPublisherService;
import com.hars.services.rollerShutter.RollerShutterService;

@RestController
@RequestMapping("/api/entities/rollerShutter")
public class RollerShutterController {

    @Autowired
    private RollerShutterService rollerShutterService;

    @Autowired
    private MqttPublisherService mqttPublisherService;

    @Autowired
    private OwnershipService ownershipService;

    @GetMapping("/")
    public ResponseEntity<?> getAllRollerShutter() {
        try {
            //ownership
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            List<Long> userRollerShutters = ownershipService.getIds(username, "rollerShutter"); 
            List<RollerShutterDTO> validRollerShutter = new ArrayList<>();
            for (RollerShutterDTO rollerShutter : rollerShutterService.getAllRollerShutters()) {
                if (userRollerShutters.contains(rollerShutter.getId())) {
                    validRollerShutter.add(rollerShutter);
                }
            }

            return ResponseEntity.ok(validRollerShutter);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Get all RollerShutters\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PostMapping("/create")
    public ResponseEntity<String> createRollerShutter(@RequestBody RollerShutterDTO.nameInput rollerShutter) {
        try {
            if (rollerShutterService.isPresentByName(rollerShutter.name())) {
                return ResponseEntity.badRequest().body("Error: Name is already taken!");
            }

            RollerShutter newRollerShutter = rollerShutterService.createRollerShutter(rollerShutter.name());
            String newRollerShutterS = newRollerShutter.toJson();

            //ownership
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            ownershipService.addOwnerShip(username, newRollerShutter);

            return ResponseEntity.ok("{" + "\"Response\" : \"RollerShutter created successfully!\" , \"Entity\" : {" + newRollerShutterS + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot create\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }

    }

    @DeleteMapping(("/delete/{id}"))
    public ResponseEntity<String> deleteRollerShutter(@PathVariable Long id){
        try {
            if (!rollerShutterService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }
            
            rollerShutterService.deleteRollerShutter(id);
            return ResponseEntity.ok("\"RollerShutter deleted successfully!\"");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Delete\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/name/{id}")
    public ResponseEntity<String> patchNameRollerShutter (@PathVariable Long id, @RequestBody RollerShutterDTO.nameInput rollerShutter) {
        try {
            if (!rollerShutterService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newRollerShutter = rollerShutterService.patchNameRollerShutter(id, rollerShutter.name() ).toJson();
            return ResponseEntity.ok("{ \"Entity\" : {" + newRollerShutter + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify name\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/opening/{id}")
    public ResponseEntity<String> patchOpeningRollerShutter (@PathVariable Long id, @RequestBody RollerShutterDTO.openingInput rollerShutter) {
        
        if (!rollerShutterService.isPresentById(id)) {
            return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
        }
        
        try {
            mqttPublisherService.publish("$aws/things/roller_shutter/shadow/sendControl", "{ \"message\" : \"ciao\"}");
        } catch (Exception e) {
            throw new RuntimeException("Publish Error", e);
        }
        
        try {
            String newRollerShutter = rollerShutterService.patchOpeningRollerShutter(id, rollerShutter.value()).toJson();
            return ResponseEntity.ok("{ \"Entity\" : {" + newRollerShutter + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify opening percentage\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }
}