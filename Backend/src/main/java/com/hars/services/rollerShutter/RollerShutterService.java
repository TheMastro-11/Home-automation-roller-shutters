package com.hars.services.rollerShutter;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hars.persistence.entities.home.Home;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.repository.rollerShutter.RollerShutterRepository;
import com.hars.services.home.HomeService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class RollerShutterService {

    @Autowired
    private RollerShutterRepository rollerShutterRepository;

    @Autowired
    private HomeService homeService;

    public RollerShutter loadHomeByName(String name) throws UsernameNotFoundException {
        // Use orElseThrow to handle the Optional
        RollerShutter roller_shutter = rollerShutterRepository.findByName(name)
                .orElseThrow(() -> new UsernameNotFoundException("Home not found with name: " + name));

        return roller_shutter;
    }

    public Boolean isPresent(RollerShutter rollerShutter){
        return rollerShutterRepository.findByName(rollerShutter.getName()).isPresent();
    }

    public String createRollerShutter(String name, String homeName) {
        // Input validation (as above)
        try {
            Home validHome = homeService.loadHomeByName(homeName);
            RollerShutter roller_shutter = new RollerShutter(name, validHome);
            rollerShutterRepository.save(roller_shutter);
            return "Roller shutter created successfully!";
        } catch (EntityNotFoundException e) {
            throw new IllegalArgumentException("Invalid home name: " + homeName);
        }   
    }

    public List<RollerShutter> getAllRollerShutters(){
        return rollerShutterRepository.findAll();
    }

    
}