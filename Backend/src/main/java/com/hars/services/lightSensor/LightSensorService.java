package com.hars.services.lightSensor;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hars.persistence.dto.home.HomeDTO;
import com.hars.persistence.dto.lightSensor.LightSensorDTO;
import com.hars.persistence.entities.home.Home;
import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.repository.lightSensor.LightSensorRepository;
import com.hars.services.home.HomeService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class LightSensorService {

    @Autowired
    private LightSensorRepository lightSensorRepository;

    @Autowired
    private HomeService homeService;

    public List<LightSensorDTO> getAllLightSensors() {
        try {
            return lightSensorRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        } catch (Exception e) {
            throw e;
        }
    }

    public LightSensor createLightSensor(String name, String homeName){
        try {
            Home validHome = homeService.loadHomeByName(homeName);
            LightSensor lightSensor = new LightSensor(name, validHome);
            return lightSensorRepository.save(lightSensor);
        } catch (Exception e) {
            throw e;
        }
        
    } 

    public void deleteLightSensor(Long id){
        try {
            LightSensor lightSensor = lightSensorRepository.findById(id).get();
            lightSensorRepository.delete(lightSensor);
        } catch (Exception e) {
            throw e;
        }
    }

    public LightSensor patchNameLightSensor(Long id, String name){
        try {
            LightSensor lightSensor = lightSensorRepository.findById(id).get();
            lightSensor.setName(name);
            lightSensor = lightSensorRepository.save(lightSensor);
            return lightSensor;
        } catch (Exception e) {
            throw e;
        }
    }

    public LightSensor patchValueLightSensor(Long id, int increase_value){
        try {
            LightSensor lightSensor = lightSensorRepository.findById(id).get();
            int oldValue = lightSensor.getLightValue();
            lightSensor.setLightValue(increase_value + oldValue);
            lightSensor = lightSensorRepository.save(lightSensor);
            return lightSensor;
        } catch (Exception e) {
            throw e;
        }
    }

    public LightSensor patchHomeLightSensor(Long id, String home){
        try {
            Home validHome = homeService.loadHomeByName(home);
            LightSensor lightSensor = lightSensorRepository.findById(id).get();
            lightSensor.setHome(validHome);
            lightSensor = lightSensorRepository.save(lightSensor);
            return lightSensor;
        } catch (Exception e) {
            throw e;
        }
    }


    //helpers
    private LightSensorDTO convertToDTO(LightSensor lightSensor) {
        LightSensorDTO dto = new LightSensorDTO();
        dto.setId(lightSensor.getID());
        dto.setName(lightSensor.getName());
        dto.setLightValue(lightSensor.getLightValue());
    
        if (lightSensor.getHome() != null) {
            HomeDTO homeDto = new HomeDTO();
            Home relatedHome = lightSensor.getHome();
            homeDto.setName(relatedHome.getName());
            dto.setHome(homeDto);
        }
    
        return dto;
    }

    public LightSensor loadLighSensorByName(String name) {
    return lightSensorRepository.findByName(name)
            .orElseThrow(() -> new EntityNotFoundException("LightSensor not found with name: " + name));
    }

    public Boolean isPresentByName(String name){
        return lightSensorRepository.findByName(name).isPresent();
    }

    public Boolean isPresentById(Long id){
        return lightSensorRepository.findById(id).isPresent();
    }


}