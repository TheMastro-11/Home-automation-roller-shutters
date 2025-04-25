package com.hars.routineAgent.services.routine;

import java.time.LocalTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hars.routineAgent.persistence.entities.routine.Routine;
import com.hars.routineAgent.persistence.repository.routine.RoutineRepository;

@Service
public class RoutineAgentService {
    
    @Autowired
    private RoutineRepository routineRepository;

    public Routine createRoutine(Long id, String name, LocalTime actionTime) {
        try {
            Routine routine = new Routine(id, name, actionTime);
            return routineRepository.save(routine);
        } catch (Exception e) {
            throw e;
        }
    }

    public void deleteRoutine(Long id){
        try {
            routineRepository.deleteById(id);;
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
}
