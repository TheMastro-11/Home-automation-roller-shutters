package com.hars.persistence.dto.home;

import java.util.List;

import com.hars.persistence.dto.lightSensor.LightSensorDTO;
import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;
import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.entities.users.User;


public class HomeDTO {
    public record nameInput (String name) {};
    public record userInput (User user) {}
    public record rollerShutterInput (List<RollerShutter> rollerShutters) {}
    public record lightSensorInput (LightSensor lightSensor) {};
    
    private Long id;
    private String name;
    private User owner;
    private List<RollerShutterDTO> rollerShutters;
    private LightSensorDTO lightSensor;

    //Getters
    public Long getId(){
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public User getOwner() {
        return this.owner;
    }

    public List<RollerShutterDTO> getRollerShutters() {
        return this.rollerShutters;
    }
    
    public LightSensorDTO getLightSensor() {
        return this.lightSensor;
    }

    //Setters
    public void setId(Long id){
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public void setRollerShutters(List<RollerShutterDTO> rollerShutters) {
        this.rollerShutters = rollerShutters;
    }

    public void setLightSensor(LightSensorDTO lightSensor) {
        this.lightSensor = lightSensor;
    }
}