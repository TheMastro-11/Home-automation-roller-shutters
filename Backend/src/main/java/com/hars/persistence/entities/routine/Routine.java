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

    @Column
    private LightValueRecord lightSensorValue;

    @ManyToMany(cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(
        name = "rollerShutter_routine",
        joinColumns = @JoinColumn(name = "rollerShutterR_id"),
        inverseJoinColumns = @JoinColumn(name = "routineR_id")
    )
    private List<RollerShutter> rollerShutters;  

    @Column
    private int rollerShutterValue;

    //builder
    public Routine() {}

    public Routine(String name, LocalTime actionTime, List<RollerShutter> rollerShutters, int rollerShutterValue) {
        this.name = name;
        this.actionTime = actionTime;
        this.rollerShutters = rollerShutters;
        this.rollerShutterValue = rollerShutterValue;
    }

    public Routine(String name, LightSensor lightSensor, LightValueRecord lightValueRecord , List<RollerShutter> rollerShutters, int rollerShutterValue) {
        this.name = name;
        this.lightSensor = lightSensor;
        this.lightSensorValue = lightValueRecord;
        this.rollerShutters = rollerShutters;
        this.rollerShutterValue = rollerShutterValue;
    }

    //getter
    public Long getId() {
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

    public LightValueRecord getLightSensorValue() {
        return this.lightSensorValue;
    }

    public List<RollerShutter> getRollerShutters() {
        return this.rollerShutters;
    }

    public int getRollerShutterValue() {
        return this.rollerShutterValue;
    }


    //setter
    public void setId(Long id) {
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

    public void setLightSensorValue(LightValueRecord lightSensorValue) {
        this.lightSensorValue = lightSensorValue;
    }

    public void setRollerShutters(List<RollerShutter> rollerShutters) {
        this.rollerShutters = rollerShutters;
    }

    public void setRollerShutterValue(int rollerShutterValue) {
        this.rollerShutterValue = rollerShutterValue;
    }
    
    //helpers
    public String toJson(){
        return "\"ID\" : \"" + this.id + "\" ," +
            "\"name\" : \"" + this.name + "\"" ;
    }

    public String toJson(LocalTime actionTime){
        String rollerShuttersString = "{" + rollerShutters.get(0).toJson() + "}";
        for (int i = 1; i < rollerShutters.size(); i++) {
            rollerShuttersString = rollerShuttersString + "," +  "{" + rollerShutters.get(i).toJson() + "}";
        }
        return "\"ID\" : \"" + this.id + "\" ," +
            "\"name\" : \"" + this.name + "\" ," +
            "\"actionTime\" : \"" + actionTime + "\" ," +
            "\"rollerShutters\" : [" + rollerShuttersString + "]";
    }

    public String toJson(LightSensor lightSensor){
        String rollerShuttersString = "{" + rollerShutters.get(0).toJson() + "}";
        for (int i = 1; i < rollerShutters.size(); i++) {
            rollerShuttersString = rollerShuttersString + "," +  "{" + rollerShutters.get(i).toJson() + "}";
        }
        return "\"ID\" : \"" + this.id + "\" ," +
            "\"name\" : \"" + this.name + "\" ," +
            "\"lightSensor\" : {" + lightSensor.toJson() + "}," +
            "\"rollerShutters\" : [" + rollerShuttersString + "]";
    }

    public String toJson(List<RollerShutter> rollerShutters){
        String rollerShuttersString = "{" + rollerShutters.get(0).toJson() + "}";
        for (int i = 1; i < rollerShutters.size(); i++) {
            rollerShuttersString = rollerShuttersString + "," +  "{" + rollerShutters.get(i).toJson() + "}";
        }
        return "\"ID\" : \"" + this.id + "\" ," +
            "\"name\" : \"" + this.name + "\" ," + 
            "\"rollerShutters\" : [" + rollerShuttersString + "]";
    }
}