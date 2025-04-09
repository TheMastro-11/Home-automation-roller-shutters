package com.hars.persistence.dto.routine;

import java.util.List;

import com.hars.persistence.dto.lightSensor.LightSensorDTO;
import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;

public class RoutineDTO {
    private Long id;
    private String name;

    private List<RollerShutterDTO> rollerShutters;
    private LightSensorDTO lightSensor;

    //Getters
    public Long getId(){
        return this.id;
    }

    public String getName() {
        return this.name;
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

    public void setName(String name){
        this.name = name;
    }

    public void setRollerShutters(List<RollerShutterDTO> rollerShutters) {
        this.rollerShutters = rollerShutters;
    }
    
    public void setLightSensor(LightSensorDTO lightSensor) {
        this.lightSensor = lightSensor;
    }
}