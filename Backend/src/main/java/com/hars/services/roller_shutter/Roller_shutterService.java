package com.hars.services.roller_shutter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hars.persistence.entities.home.Home;
import com.hars.persistence.entities.roller_shutter.Roller_shutter;
import com.hars.persistence.repository.roller_shutter.Roller_shutterRepository;
import com.hars.services.home.HomeService;

@Service
public class Roller_shutterService {

    @Autowired
    public Roller_shutterRepository roller_shutterRepository;

    private HomeService homeService;

    public Roller_shutter loadHomeByName(String name) throws UsernameNotFoundException {
        // Use orElseThrow to handle the Optional
        Roller_shutter roller_shutter = roller_shutterRepository.findByName(name)
                .orElseThrow(() -> new UsernameNotFoundException("Home not found with name: " + name));

        return roller_shutter;
    }

    public String createRollerShutter (String name, int percentage_open, String homeName){
        try {
            Home validHome = homeService.loadHomeByName(homeName);
            Roller_shutter roller_shutter = new Roller_shutter(name, validHome);
        } catch (Exception e) {
        }

        return "ok";
    }
}