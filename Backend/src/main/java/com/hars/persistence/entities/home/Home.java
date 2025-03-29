package com.hars.persistence.entities.home;

import java.util.ArrayList;
import java.util.List;

import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "homes")
public class Home {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "home", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RollerShutter> rollerShutters = new ArrayList<>();

    @OneToOne
    private LightSensor lightSensor;

    //builder
    public Home() {}

    public Home(String name){
        this.name = name;
    }
    
    //getter
    public long getID(){
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public List<RollerShutter> getRollerShutters(){
        return this.rollerShutters;
    }

    public LightSensor getLightSensor() {
        return this.lightSensor;
    }
    
    //setter
    public void setId(Long id){
        this.id = id;
    }
    
    public void setName(String name){
        this.name = name;
    }

    public void setRollerShutters (List<RollerShutter> rollerShutters){
        this.rollerShutters = rollerShutters;
    }

    public String toJson(){
        return "\"Name\" : \"" + this.name + "\"";
    }

    public void setLightSensor(LightSensor lightSensor) {
        this.lightSensor = lightSensor;
    }

}