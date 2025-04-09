package com.hars.persistence.dto.lightSensor;
import com.hars.persistence.dto.home.HomeDTO;

public class LightSensorDTO {
    private Long id;
    private String name;
    private int lightValue;
    private HomeDTO home;

    //Getters
    public Long getId(){
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public int getLightValue(){
        return this.lightValue;
    }

    public HomeDTO getHome(){
        return this.home;
    }

    //Setters
    public void setId(Long id){
        this.id = id;
    }

    public void setName(String name){
        this.name = name;
    }

    public void setLightValue(int lightValue){
        this.lightValue = lightValue;
    }

    public void setHome(HomeDTO home){
        this.home = home;
    }

}