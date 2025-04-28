package com.hars.routes.routine;

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

import com.hars.persistence.dto.routine.RoutineDTO;
import com.hars.persistence.entities.routine.Routine;
import com.hars.services.OwnershipService;
import com.hars.services.agentAPI.ExternalApiClient;
import com.hars.services.routine.RoutineService;

@RestController
@RequestMapping("/api/entities/routine")
public class RoutineController {

    @Autowired
    private RoutineService routineService;

    @Autowired
    private ExternalApiClient externalApiClient;

    @Autowired
    private OwnershipService ownershipService;

    @GetMapping("/")
    public ResponseEntity<?> getAllRollerShutter() {
        try {
            //ownership
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            List<Long> userRoutines = ownershipService.getIds(username, "routine"); 
            List<RoutineDTO> validRoutines = new ArrayList<>();
            for (RoutineDTO routine : routineService.getAllRoutines()) {
                if (userRoutines.contains(routine.getId())) {
                    validRoutines.add(routine);
                }
            }

            return ResponseEntity.ok(validRoutines);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Get all Routines\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PostMapping("/create/actionTime")
    public ResponseEntity<String> createRoutinesTime(@RequestBody RoutineDTO.actiontTimeCreateInput routine) {
        try {
            if (routineService.isPresentByName(routine.name())) {
                return ResponseEntity.badRequest().body("Error: Name is already taken!");
            }

            Routine newRoutine = routineService.createRoutine(routine.name(), routine.time(), routine.rollerShutters(), routine.rollerShutterValue());
            String newRoutineS = newRoutine.toJson(newRoutine.getActionTime());

            //agent Update
            externalApiClient.callApiCreate(newRoutine);

            //ownership
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            ownershipService.addOwnerShip(username, newRoutine);

            return ResponseEntity.ok("{" + "\"Response\" : \"Routine created successfully!\" , \"Entity\" : {" + newRoutineS + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot create\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }

    }

    @PostMapping("/create/lightSensor")
    public ResponseEntity<String> createRoutineLight(@RequestBody RoutineDTO.lightSensorCreateInput routine) {
        try {
            if (routineService.isPresentByName(routine.name())) {
                return ResponseEntity.badRequest().body("Error: Name is already taken!");
            }

            Routine newRoutine = routineService.createRoutine(routine.name(), routine.lightSensor(), routine.lightValueRecord(), routine.rollerShutters(), routine.rollerShutterValue());
            String newRoutineS = newRoutine.toJson(newRoutine.getLightSensor());

            //ownership
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            ownershipService.addOwnerShip(username, newRoutine);

            return ResponseEntity.ok("{" + "\"Response\" : \"Routine created successfully!\" , \"Entity\" : {" + newRoutineS + "}}");
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

            //get element for agentAPI
            Routine oldRoutine = routineService.loadRoutineByID(id);

            routineService.deleteRoutine(id);

            //agent Update
            if (oldRoutine.getActionTime() != null) {
                externalApiClient.callApiDelete(id);
            }            

            return ResponseEntity.ok("\"Routine deleted successfully!\"");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Delete\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/name/{id}")
    public ResponseEntity<String> patchNameRoutine(@PathVariable Long id, @RequestBody RoutineDTO.nameInput routine) {
        try {
            if (!routineService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }
            //get element for agentAPI
            Routine oldRoutine = routineService.loadRoutineByID(id);

            String newRoutine = routineService.patchNameRoutine(id, routine.name()).toJson();

            //agent Update
            if (oldRoutine.getActionTime() != null) {
                externalApiClient.callApiPatchName(id ,routine.name());
            }

            return ResponseEntity.ok("{ \"Entity\" : {" + newRoutine + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify name\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/actionTime/{id}")
    public ResponseEntity<String> patchActionTimeRoutine(@PathVariable Long id, @RequestBody RoutineDTO.actionTimeInput routine) {
        try {
            if (!routineService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            Routine newRoutine_ = routineService.patchActionTimeRoutine(id, routine.time());
            String newRoutine = newRoutine_.toJson(newRoutine_.getActionTime());

            //agent Update
            externalApiClient.callApiPatchActionTime(id, routine.time());
            
            return ResponseEntity.ok("{ \"Entity\" : {" + newRoutine + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify action time\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/lightSensor/{id}")
    public ResponseEntity<String> patchLightSensorRoutine(@PathVariable Long id, @RequestBody RoutineDTO.lightSensorInput routine) {
        try {
            if (!routineService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            Routine newRoutine_ = routineService.patchLightSensorRoutine(id, routine.lightSensor());
            String newRoutine = newRoutine_.toJson(newRoutine_.getLightSensor());
            
            return ResponseEntity.ok("{ \"Entity\" : {" + newRoutine + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify light sensor\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PatchMapping("/patch/rollerShutters/{id}")
    public ResponseEntity<String> patchRollerShutterRoutine(@PathVariable Long id, @RequestBody RoutineDTO.rollerShutterInput routine) {
        try {
            if (!routineService.isPresentById(id)) {
                return ResponseEntity.badRequest().body("\"Error\": \"ID does not exist!\"");
            }

            Routine newRoutine_ = routineService.patchRollerShuttersRoutine(id, routine.rollerShutters());
            String newRoutine = newRoutine_.toJson(newRoutine_.getRollerShutters());
            
            return ResponseEntity.ok("{ \"Entity\" : {" + newRoutine + "}}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Modify roller shutters\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
        }
    }

    @PostMapping("/activate/{id}")
    public ResponseEntity<?> activateRoutine(@PathVariable Long id) {
            try {
                routineService.activateRoutine(id);
                return ResponseEntity.ok("ok");
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("\"Error\" : \"Cannot Activate routine\" , \" StackTrace\" : \"" + e.getMessage() + "\"");
            }
    }
    
}