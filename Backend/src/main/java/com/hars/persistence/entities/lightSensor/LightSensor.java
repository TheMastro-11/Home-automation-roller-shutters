package com.hars.persistence.entities.lightSensor;

import com.hars.persistence.entities.home.Home;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "lightSensors")
public class LightSensor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private int lightValue = 0;

    @OneToOne
    @JoinColumn(name = "home_id")
    private Home home;

    //builder
    public LightSensor() {}

    public LightSensor(String name, Home home) {
        this.name = name;
        this.home = home;
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

    public Home getHome() {
        return this.home;
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

    public void setHome(Home home) {
        this.home = home;
    }

    public String toJson(){
        return "\"Name\" : \"" + this.name + "\" ," +
            "\"LightValue\" : \"" + this.lightValue + "\"";
    }

}