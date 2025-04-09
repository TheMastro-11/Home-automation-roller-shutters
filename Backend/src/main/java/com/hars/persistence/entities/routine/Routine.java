package com.hars.persistence.entities.routine;

import java.time.LocalTime;
import java.util.List;

import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "routine")
public class Routine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "routine_id")
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "actionTime")
    private LocalTime actionTime; 

    @ManyToOne
    @JoinColumn(name = "lightSensor_id")
    private LightSensor lightSensor;

    @ManyToMany(cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(
        name = "rollerShutter_routine",
        joinColumns = @JoinColumn(name = "rolleShutterR_id"),
        inverseJoinColumns = @JoinColumn(name = "routineR_id")
    )
    private List<RollerShutter> rollerShutters;  

    //builder
    public Routine() {}

    public Routine(String name, LocalTime actionTime, List<RollerShutter> rollerShutters) {
        this.name = name;
        this.actionTime = actionTime;
        this.rollerShutters = rollerShutters;
    }

    public Routine(String name, LightSensor lightSensor, List<RollerShutter> rollerShutters) {
        this.name = name;
        this.lightSensor = lightSensor;
        this.rollerShutters = rollerShutters;
    }

    //getter
    public Long getID() {
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public LocalTime getActionTime() {
        return this.actionTime;
    }

    public LightSensor getLightSensor() {
        return this.lightSensor;
    }

    public List<RollerShutter> getRollerShutters() {
        return this.rollerShutters;
    }

    //setter
    public void setID(Long id) {
        this.id  = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setActionTime(LocalTime actionTime) {
        this.actionTime = actionTime;
    }

    public void setLightSensor(LightSensor lightSensor) {
        this.lightSensor = lightSensor;
    } 
    
    public void setRollerShutters(List<RollerShutter> rollerShutters) {
        this.rollerShutters = rollerShutters;
    }
    
    //helpers
    public String toJson(){
        return "\"ID\" : \"" + this.id + "\" ," +
            "\"Name\" : \"" + this.name + "\"";
    }
}