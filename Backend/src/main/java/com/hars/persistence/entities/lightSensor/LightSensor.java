package com.hars.persistence.entities.lightSensor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "lightSensors")
public class LightSensor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "lightValue")
    private int lightValue = 0;

    //builder
    public LightSensor() {}

    public LightSensor(String name) {
        this.name = name;
    }

    //getter
    public Long getID(){
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public int getLightValue() {
        return this.lightValue;
    }

    //setter
    public void setID(Long id){
       this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setLightValue(int lightValue) {
        this.lightValue = lightValue;
    }

    public String toJson(){
        return "\"Name\" : \"" + this.name + "\" ," +
            "\"LightValue\" : \"" + this.lightValue + "\"";
    }

}