package com.hars.routes.rollerShutter;

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

import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.services.rollerShutter.RollerShutterService;

@RestController
@RequestMapping("/api/entities/rollerShutter")
public class RollerShutterController {

    @Autowired
    private RollerShutterService rollerShutterService;

    @GetMapping("/")
    public ResponseEntity<?> getAllRollerShutter() {
        try {
            return ResponseEntity.ok(rollerShutterService.getAllRollerShutters());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Get all RollerShutters\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PostMapping("/create")
    public ResponseEntity<String> createRollerShutter(@RequestBody RollerShutter rollerShutter) {
        try {
            if (rollerShutterService.isPresentByName(rollerShutter.getName())) {
                return ResponseEntity.badRequest().body("Error: Name is already taken!");
            }

            String result = rollerShutterService.createRollerShutter(rollerShutter.getName(), rollerShutter.getHome().getName());
            return ResponseEntity.ok("\""+result+"\"");
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
    public ResponseEntity<String> patchNameRollerShutter (@PathVariable Long id, @RequestBody RollerShutter rollerShutter) {
        try {
            if (!rollerShutterService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newRollerShutter = rollerShutterService.patchNameRollerShutter(id, rollerShutter.getName() ).toJson();
            return ResponseEntity.ok(newRollerShutter);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify name\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/opening/{id}")
    public ResponseEntity<String> patchOpeningRollerShutter (@PathVariable Long id, @RequestBody RollerShutter rollerShutter) {
        try {
            if (!rollerShutterService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newRollerShutter = rollerShutterService.patchOpeningRollerShutter(id, rollerShutter.getPercentageOpening()).toJson();
            return ResponseEntity.ok(newRollerShutter);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify opening percentage\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/home/{id}")
    public ResponseEntity<String> patchHomeRollerShutter (@PathVariable Long id, @RequestBody RollerShutter rollerShutter) {
        try {
            if (!rollerShutterService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newRollerShutter = rollerShutterService.patchHomeRollerShutter(id, rollerShutter.getHome().getName()).toJson();
            return ResponseEntity.ok(newRollerShutter);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify related home\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }
}