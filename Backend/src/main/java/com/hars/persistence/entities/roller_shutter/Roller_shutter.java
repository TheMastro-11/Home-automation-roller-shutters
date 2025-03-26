package com.hars.persistence.entities.roller_shutter;

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
@Table(name = "roller_shutter")
public class Roller_shutter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roller_shutter_id")
    private Long id;

    private String name;
    private int percentage_open = 0;

    @ManyToOne
    @JoinColumn(name = "home_id")
    private Home home;

    public Roller_shutter(){}

    public Roller_shutter(String name, Home home) {
        this.name = name;
        this.home = home;
    }

    public String getName(){
        return this.name;
    }

    public Home getHome(){
        return this.home;
    }
    
}