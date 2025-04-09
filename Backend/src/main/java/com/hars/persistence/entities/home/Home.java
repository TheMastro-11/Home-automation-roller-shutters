package com.hars.persistence.entities.home;

import java.util.ArrayList;
import java.util.List;

import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.entities.users.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "homes")
public class Home {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "home_id")
    private Long id;

    @Column(name = "name")
    private String name;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User owner;

    @OneToMany()
    @JoinColumn(name = "rollerShutter_id")
    private List<RollerShutter> rollerShutters = new ArrayList<>();

    @OneToOne() 
    @JoinColumn(name = "lightSensor_id")
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

    public User getOwner() {
        return this.owner;
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

    public void setOwner(User user) {
        this.owner = user;
    }

    public void setRollerShutters (List<RollerShutter> rollerShutters){
        this.rollerShutters = rollerShutters;
    }

    public void setLightSensor(LightSensor lightSensor) {
        this.lightSensor = lightSensor;
    }

    //helpers
    public String toJson(){
        return "\"Name\" : \"" + this.name + "\"";
    }

}