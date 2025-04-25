package com.hars.persistence.dto.routine;

import java.time.LocalTime;
import java.util.List;

import com.hars.persistence.dto.lightSensor.LightSensorDTO;
import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;
import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;

public class RoutineDTO {
    public record actiontTimeCreateInput(String name, LocalTime time, List<RollerShutter> rollerShutters, int rollerShutterValue) {}
    public record lightSensorCreateInput(String name, LightSensor lightSensor, int lightSensorValue , List<RollerShutter> rollerShutters, int rollerShutterValue) {}
    public record nameInput(String name) {}
    public record actionTimeInput(LocalTime time) {}
    public record lightSensorInput(LightSensor lightSensor) {}
    public record rollerShutterInput(List<RollerShutter> rollerShutters) {}

    private Long id;
    private String name;

    private List<RollerShutterDTO> rollerShutters;
    private LightSensorDTO lightSensor;
    private LocalTime actionTime;

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

    public LocalTime getActionTime() {
        return this.actionTime;
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

    public void setActionTime(LocalTime actioTime) {
        this.actionTime = actioTime;
    }
}