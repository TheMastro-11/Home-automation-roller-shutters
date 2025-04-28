package com.hars.services.home;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hars.persistence.dto.home.HomeDTO;
import com.hars.persistence.dto.lightSensor.LightSensorDTO;
import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;
import com.hars.persistence.entities.home.Home;
import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.repository.home.HomeRepository;
import com.hars.services.lightSensor.LightSensorService;
import com.hars.services.rollerShutter.RollerShutterService;
import com.hars.services.users.UserService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class HomeService {

    @Autowired
    private HomeRepository homeRepository;

    @Autowired
    private UserService userService;

    @Autowired 
    private RollerShutterService rollerShutterService;

    @Autowired
    private LightSensorService lightSensorService;

    public List<HomeDTO> getAllHomes() {
        try {
            return homeRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        } catch (Exception e) {
            throw e;
        }
    }

    public Home createHome(HomeDTO.nameInput home){
        Home newHome = new Home();
        newHome.setName(home.name());
        try {
            return homeRepository.save(newHome);
        } catch (Exception e) {
            throw e;
        }
        
    } 

    public void deleteHome(Long id){
        try {
            Home home = homeRepository.findById(id).get();
            homeRepository.delete(home);
        } catch (Exception e) {
            throw e;
        }
    }

    public Home patchNameHome(Long id, String name){
        try {
            Home home = homeRepository.findById(id).get();
            home.setName(name);
            return homeRepository.save(home);
        } catch (Exception e) {
            throw e;
        }
    }

    public Home patchRollerShuttersHome(Long id, List<RollerShutter> rollerShutters){
        try {
            Home home = homeRepository.findById(id).get();
            List<RollerShutter> validRollerShutters = new ArrayList<>();
            for (int i = 0; i < rollerShutters.size(); i++) {
                validRollerShutters.add(rollerShutterService.loadRollerShutterByName(rollerShutters.get(i).getName()));
            }
            home.setRollerShutters(validRollerShutters);
            
            return homeRepository.save(home);
        } catch (Exception e) {
            throw new RuntimeException("RollerShutter not found", e);
        }
    }

    public Home patchLightSensorHome(Long id, LightSensor lightSensor){
        try {
            Home home = homeRepository.findById(id).get();
            LightSensor validLightSensor = lightSensorService.loadLightSensorByName(lightSensor.getName());
            home.setLightSensor(validLightSensor);
            return homeRepository.save(home);
        } catch (Exception e) {
            throw new RuntimeException("Light Sensor not found", e);
        }
    }


    //helpers
    private HomeDTO convertToDTO(Home home) {
        HomeDTO dto = new HomeDTO();
        dto.setId(home.getID());
        dto.setName(home.getName());
    
        if (home.getRollerShutters() != null) {
            dto.setRollerShutters(
                home.getRollerShutters().stream()
                    .map(rs -> {
                        RollerShutterDTO rsDto = new RollerShutterDTO();
                        rsDto.setName(rs.getName());
                        rsDto.setPercentageOpening(rs.getPercentageOpening());
                        return rsDto;
                    })
                    .collect(Collectors.toList())
            );
        }

        if (home.getLightSensor() != null) {
            LightSensorDTO lightSensorDto = new LightSensorDTO();
            LightSensor lightSensor = home.getLightSensor();
            lightSensorDto.setName(lightSensor.getName());
            dto.setLightSensor(lightSensorDto);
        }
    
        return dto;
    }

    public Home loadHomeByName(String name) {
    return homeRepository.findByName(name)
            .orElseThrow(() -> new EntityNotFoundException("Home not found with name: " + name));
    }

    public Boolean isPresentByName(String name){
        return homeRepository.findByName(name).isPresent();
    }

    public Boolean isPresentById(Long id){
        return homeRepository.findById(id).isPresent();
    }


}