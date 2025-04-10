package com.hars.persistence.entities.home;

import java.util.ArrayList;
import java.util.List;

import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.entities.users.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
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

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "homeU_id", referencedColumnName = "user_id")
    private User owner;

    @OneToMany(
        cascade = CascadeType.ALL, /*orphanRemoval = true,*/ fetch = FetchType.LAZY)
    @JoinColumn(
        name = "homeR_id", 
        nullable = true 
    )
    private List<RollerShutter> rollerShutters = new ArrayList<>();

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "homeL_id", referencedColumnName = "lightSensor_id")
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
        return "\"ID\" : \"" + this.id + "\" ," +
            "\"name\" : \"" + this.name + "\"";
    }

    public String toJson(User user){
        return "\"ID\" : \"" + this.id + "\" ," +
            "\"name\" : \"" + this.name + "\" ," + 
            "\"owner\" : {" + user.toJson() + "}";
    }

    public String toJson(LightSensor lightSensor){
        return "\"ID\" : \"" + this.id + "\" ," +
            "\"name\" : \"" + this.name + "\" ," + 
            "\"lightSensor\" : {" + lightSensor.toJson() + "}";
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