package com.hars.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hars.persistence.entities.Ownership;
import com.hars.persistence.entities.home.Home;
import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.entities.routine.Routine;
import com.hars.persistence.repository.OwnershipRepository;

@Service
public class OwnershipService {
    @Autowired
    private OwnershipRepository ownershipRepository;

    public List<Long> getIds(String username, String type) {
        switch (type) {
            case "rollerShutter":
                return ownershipRepository.findByUsername(username).get().getRollerShutters();
            case "lightSensor":
                return ownershipRepository.findByUsername(username).get().getLightSensors();
            case "home": 
                return ownershipRepository.findByUsername(username).get().getHomes();
            case "routine":
                return ownershipRepository.findByUsername(username).get().getRoutines();
        }

        throw new RuntimeException("wrong type");
    }

    //rollerShutters
    public void addOwnerShip (String username, RollerShutter rollerShutter) {
        Ownership ownership =  ownershipRepository.findByUsername(username).get();
        
        ownership.setRollerShutters(rollerShutter);
        ownershipRepository.save(ownership);
    }
    
    //lightSensors
    public void addOwnerShip (String username, LightSensor lightSensor) {
        Ownership ownership =  ownershipRepository.findByUsername(username).get();
        
        ownership.setLightSensors(lightSensor);
        ownershipRepository.save(ownership);
    }

    //homes
    public void addOwnerShip (String username, Home home) {
        Ownership ownership =  ownershipRepository.findByUsername(username).get();
        
        ownership.setHomes(home);
        ownershipRepository.save(ownership);
    }

    //routine
    public void addOwnerShip (String username, Routine routine) {
        Ownership ownership =  ownershipRepository.findByUsername(username).get();
        
        ownership.setRoutines(routine);
        ownershipRepository.save(ownership);
    }
}
