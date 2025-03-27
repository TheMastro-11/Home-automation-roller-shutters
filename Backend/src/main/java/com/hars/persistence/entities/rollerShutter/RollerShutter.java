package com.hars.persistence.entities.rollerShutter;

import com.hars.persistence.entities.home.Home;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "rollerShutter")
public class RollerShutter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roller_shutter_id")
    private Long id;

    private String name;
    private int percentage_opening = 0;

    @ManyToOne
    @JoinColumn(name = "home_id")
    private Home home;

    //builder
    public RollerShutter(){}

    public RollerShutter(String name, Home home) {
        this.name = name;
        this.home = home;
    }

    //getter
    public long getID(){
        return this.id;
    }

    public String getName(){
        return this.name;
    }

    public int getPercentageOpening(){
        return this.percentage_opening;
    }
    public Home getHome(){
        return this.home;
    }

    //setter
    public void setName(String name){
        this.name = name;
    }
    
    public void setPercentageOpening(int percentage){
        this.percentage_opening = percentage;
    }
    
}