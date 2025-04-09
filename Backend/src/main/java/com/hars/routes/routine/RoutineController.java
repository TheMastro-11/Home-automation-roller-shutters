package com.hars.routes.routine;

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

import com.hars.persistence.entities.routine.Routine;
import com.hars.services.routine.RoutineService;

@RestController
@RequestMapping("/api/entities/routine")
public class RoutineController {

    @Autowired
    private RoutineService routineService;

    @GetMapping("/")
    public ResponseEntity<?> getAllRollerShutter() {
        try {
            return ResponseEntity.ok(routineService.getAllRoutines());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Get all Routines\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PostMapping("/create/actionTime")
    public ResponseEntity<String> createRoutinesTime(@RequestBody Routine routine) {
        try {
            if (routineService.isPresentByName(routine.getName())) {
                return ResponseEntity.badRequest().body("Error: Name is already taken!");
            }

            String result = routineService.createRoutine(routine.getName(), routine.getActionTime(), routine.getRollerShutters());
            return ResponseEntity.ok("\""+result+"\"");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot create\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }

    }

    @PostMapping("/create/lightSensor")
    public ResponseEntity<String> createRoutineLight(@RequestBody Routine routine) {
        try {
            if (routineService.isPresentByName(routine.getName())) {
                return ResponseEntity.badRequest().body("Error: Name is already taken!");
            }

            String result = routineService.createRoutine(routine.getName(), routine.getLightSensor(), routine.getRollerShutters());
            return ResponseEntity.ok("\""+result+"\"");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot create\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }

    }

    @DeleteMapping(("/delete/{id}"))
    public ResponseEntity<String> deleteRoutine(@PathVariable Long id){
        try {
            if (!routineService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }
            
            routineService.deleteRoutine(id);
            return ResponseEntity.ok("\"Routine deleted successfully!\"");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Delete\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/name/{id}")
    public ResponseEntity<String> patchNameRoutine(@PathVariable Long id, @RequestBody Routine routine) {
        try {
            if (!routineService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newRoutine = routineService.patchNameRoutine(id, routine.getName()).toJson();
            return ResponseEntity.ok(newRoutine);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify name\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/actionTime/{id}")
    public ResponseEntity<String> patchActionTimeRoutine(@PathVariable Long id, @RequestBody Routine routine) {
        try {
            if (!routineService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newRoutine = routineService.patchActionTimeRoutine(id, routine.getActionTime()).toJson();
            return ResponseEntity.ok(newRoutine);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify action time\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/lightSensor/{id}")
    public ResponseEntity<String> patchLightSensorRoutine(@PathVariable Long id, @RequestBody Routine routine) {
        try {
            if (!routineService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newRoutine = routineService.patchLightSensorRoutine(id, routine.getLightSensor()).toJson();
            return ResponseEntity.ok(newRoutine);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify light sensor\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/rollerShutters/{id}")
    public ResponseEntity<String> patchRollerShutterRoutine(@PathVariable Long id, @RequestBody Routine routine) {
        try {
            if (!routineService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            String newRoutine = routineService.patchRollerShuttersRoutine(id, routine.getRollerShutters()).toJson();
            return ResponseEntity.ok(newRoutine);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify roller shutters\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }
}