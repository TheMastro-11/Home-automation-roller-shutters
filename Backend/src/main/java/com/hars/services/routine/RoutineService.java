package com.hars.services.routine;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hars.persistence.dto.lightSensor.LightSensorDTO;
import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;
import com.hars.persistence.dto.routine.RoutineDTO;
import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.entities.routine.LightValueRecord;
import com.hars.persistence.entities.routine.Routine;
import com.hars.persistence.repository.routine.RoutineRepository;
import com.hars.services.lightSensor.LightSensorService;
import com.hars.services.rollerShutter.RollerShutterService;

@Service
public class RoutineService {

    @Autowired
    private RoutineRepository routineRepository;

    @Autowired
    private RollerShutterService rollerShutterService;

    @Autowired
    private LightSensorService lightSensorService;

    public List<RoutineDTO> getAllRoutines(){
        try {
            return routineRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        } catch (Exception e) {
            throw e;
        }
    }
    
    public Routine createRoutine(String name, LocalTime actionTime, List<RollerShutter> rollerShutters, int rollerShutterValue) {
        try {
            List<RollerShutter> validRollerShutter = new ArrayList<>();
            for (int i = 0; i < rollerShutters.size(); i++) {
                validRollerShutter.add(rollerShutterService.loadRollerShutterByName(rollerShutters.get(i).getName()));
            }
            Routine routine = new Routine(name, actionTime, validRollerShutter, rollerShutterValue);
            return routineRepository.save(routine);
        } catch (Exception e) {
            throw e;
        }
    }

    public Routine createRoutine(String name, LightSensor lightSensor, LightValueRecord lightValueRecord , List<RollerShutter> rollerShutters, int rollerShutterValue) {
        try {
            List<RollerShutter> validRollerShutter = new ArrayList<>();
            for (int i = 0; i < rollerShutters.size(); i++) {
                validRollerShutter.add(rollerShutterService.loadRollerShutterByName(rollerShutters.get(i).getName()));
            }
            LightSensor validLightSensor = lightSensorService.loadLightSensorByName(lightSensor.getName());
            Routine routine = new Routine(name, validLightSensor, lightValueRecord, validRollerShutter, rollerShutterValue);
            return routineRepository.save(routine);
        } catch (Exception e) {
            throw e;
        }
    }

    public void deleteRoutine(Long id){
        try {
            Routine routine = routineRepository.findById(id).get();
            routineRepository.delete(routine);
        } catch (Exception e) {
            throw e;
        }
    }  

    public Routine patchNameRoutine(Long id, String name){
        try {
            Routine routine = routineRepository.findById(id).get();
            routine.setName(name);
            routine = routineRepository.save(routine);
            return routine;
        } catch (Exception e) {
            throw e;
        }
    }

    public Routine patchActionTimeRoutine(Long id, LocalTime actionTime){
        try {
            Routine routine = routineRepository.findById(id).get();
            routine.setActionTime(actionTime);
            routine = routineRepository.save(routine);
            return routine;
        } catch (Exception e) {
            throw e;
        }
    }

    @Transactional
    public Routine patchLightSensorRoutine(Long id, LightSensor lightSensor){
        try {
            Routine routine = routineRepository.findById(id).get();
            LightSensor validLightSensor = lightSensorService.loadLightSensorByName(lightSensor.getName());
            routine.setLightSensor(validLightSensor);
            routine = routineRepository.save(routine);
            return routine;
        } catch (Exception e) {
            throw e;
        }
    }

    public Routine patchRollerShuttersRoutine(Long id, List<RollerShutter> rollerShutters){
        try {
            Routine routine = routineRepository.findById(id).get();
            List<RollerShutter> validRollerShutters = new ArrayList<>();
            for (int i = 0; i < rollerShutters.size(); i++){
                validRollerShutters.add(rollerShutterService.loadRollerShutterByName(rollerShutters.get(i).getName()));
            }
            routine.setRollerShutters(validRollerShutters);
            routine = routineRepository.save(routine);
            return routine;
        } catch (Exception e) {
            throw e;
        }
    }

    public void activateRoutine(Long id) {
        try {
            Routine routine = routineRepository.findById(id).get();
            for (RollerShutter rollerShutter : routine.getRollerShutters()) {
                rollerShutterService.patchOpeningRollerShutter(rollerShutter.getID(), routine.getRollerShutterValue());
            }
        } catch (Exception e) {

        }
    }

    public void lightSensorValueCheck(Long id) {
        LightSensor lightSensor = lightSensorService.loadLightSensorById(id);
        Optional<Routine> routine = routineRepository.findByLightSensorId(lightSensor.getID());
        if (routine.isPresent()) {
            Routine validRoutine = routine.get();
            if (validRoutine.getLightSensorValue().method()) {
                if ( lightSensor.getLightValue() >= validRoutine.getLightSensorValue().value()) {
                    this.activateRoutine(validRoutine.getId());
                }
            } else {
                if ( lightSensor.getLightValue() <= validRoutine.getLightSensorValue().value()) {
                    this.activateRoutine(validRoutine.getId());
                }
            }
        }
    }

    //Helpers
    private RoutineDTO convertToDTO(Routine routine) {
        RoutineDTO dto = new RoutineDTO();
        dto.setId(routine.getId());
        dto.setName(routine.getName());
        dto.setActionTime(routine.getActionTime());
        dto.setLightValue(routine.getLightSensorValue());
        dto.setRollerShutterValue(routine.getRollerShutterValue());
        
        if (routine.getRollerShutters() != null) {
            dto.setRollerShutters(
                routine.getRollerShutters().stream()
                    .map(rs -> {
                        RollerShutterDTO rsDto = new RollerShutterDTO();
                        rsDto.setName(rs.getName());
                        rsDto.setPercentageOpening(rs.getPercentageOpening());
                        return rsDto;
                    })
                    .collect(Collectors.toList())
            );
        }

        if (routine.getLightSensor() != null) {
            LightSensorDTO lightSensorDto = new LightSensorDTO();
            LightSensor lightSensor = routine.getLightSensor();
            lightSensorDto.setName(lightSensor.getName());
            dto.setLightSensor(lightSensorDto);
        }
    
        return dto;
    }

    public Routine loadRoutineByName(String name) throws UsernameNotFoundException {
        Routine routine = routineRepository.findByName(name)
                .orElseThrow(() -> new UsernameNotFoundException("Routine not found with name: " + name));

        return routine;
    }

    public Routine loadRoutineByID(Long id) {
        Optional <Routine> routine = routineRepository.findById(id);
        if (routineRepository.findById(id).isPresent()) {
            return routine.get();
        } else {
            return null;
        }
    }

    public Boolean isPresentByName(String name){
        return routineRepository.findByName(name).isPresent();
    }

    public Boolean isPresentById(Long id){
        return routineRepository.findById(id).isPresent();
    }

    public Boolean isLightSensorPresentById(Long id) {
        for (Routine routine : routineRepository.findAll()){
            if (routine.getLightSensor().getID().equals(id)){
                return true;
            }
        }
        return false;
    }
    
}