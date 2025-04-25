package com.hars.routineAgent.routes;

import java.time.LocalTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hars.routineAgent.persistence.entities.routine.Routine;
import com.hars.routineAgent.services.routine.RoutineAgentService;


@RestController
@RequestMapping("/api/agent/routine")
public class RoutineController {

    @Autowired
    private RoutineAgentService routineAgentService;

    @PostMapping("/create")
    public ResponseEntity<?> routineCreate(@RequestBody Routine routine) {
        try {
            routineAgentService.createRoutine(routine.getId(), routine.getName(), routine.getActionTime());
        } catch (Exception e) {
            throw e;
        }
        return ResponseEntity.ok("{" + "\"Response\" : \"Routines saved successfully!\" }");
    }

    @DeleteMapping(("/delete/{id}"))
    public ResponseEntity<String> routineDelete(@PathVariable Long id){
        try {
            routineAgentService.deleteRoutine(id);

            return ResponseEntity.ok("\"Routine deleted successfully!\"");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Delete\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/name/{id}")
    public ResponseEntity<?> routinePatchActionTime(@PathVariable Long id, @RequestBody String name) {
        try {
            routineAgentService.patchNameRoutine(id, name);
            
            return ResponseEntity.ok("Routine Modified successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify name\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/actionTime/{id}")
    public ResponseEntity<?> routinePatchActionTime(@PathVariable Long id, @RequestBody LocalTime actionTime) {
        try {
            routineAgentService.patchActionTimeRoutine(id, actionTime);
            
            return ResponseEntity.ok("");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify action time\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }
    
}
