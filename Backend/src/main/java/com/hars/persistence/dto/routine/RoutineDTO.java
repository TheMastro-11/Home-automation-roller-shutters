package com.hars.persistence.dto.routine;

import java.time.LocalTime;
import java.util.List;

import com.hars.persistence.dto.lightSensor.LightSensorDTO;
import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;
import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.entities.routine.LightValueRecord;

public class RoutineDTO {
    public record actiontTimeCreateInput(String name, LocalTime time, List<RollerShutter> rollerShutters, int rollerShutterValue) {}
    public record lightSensorCreateInput(String name, LightSensor lightSensor, LightValueRecord lightValueRecord , List<RollerShutter> rollerShutters, int rollerShutterValue) {}
    public record nameInput(String name) {}
    public record actionTimeInput(LocalTime time) {}
    public record lightSensorInput(LightSensor lightSensor) {}
    public record rollerShutterInput(List<RollerShutter> rollerShutters) {}

    private Long id;
    private String name;

    private List<RollerShutterDTO> rollerShutters;
    private LightSensorDTO lightSensor;
    private LightValueRecord lightValueRecord;
    private LocalTime actionTime;
    private int rollerShutterValue;

    //Getters
    public Long getId(){
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public LightSensorDTO getLightSensor() {
        return this.lightSensor;
    }

    public LightValueRecord getLightValue() {
        return this.lightValueRecord;
    }

    public LocalTime getActionTime() {
        return this.actionTime;
    }

    public List<RollerShutterDTO> getRollerShutters() {
        return this.rollerShutters;
    }

    public int getRollerShutterValue() {
        return this.rollerShutterValue;
    }


    //Setters
    public void setId(Long id){
        this.id = id;
    }

    public void setName(String name){
        this.name = name;
    }
    
    public void setLightSensor(LightSensorDTO lightSensor) {
        this.lightSensor = lightSensor;
    }

    public void setLightValue(LightValueRecord lightValueRecord) {
        this.lightValueRecord = lightValueRecord;
    }

    public void setActionTime(LocalTime actioTime) {
        this.actionTime = actioTime;
    }

    public void setRollerShutters(List<RollerShutterDTO> rollerShutters) {
        this.rollerShutters = rollerShutters;
    }

    public void setRollerShutterValue(int rollerShutterValue) {
        this.rollerShutterValue = rollerShutterValue;
    }
    
}