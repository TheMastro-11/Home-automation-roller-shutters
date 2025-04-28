package com.hars.persistence.entities;

import java.util.ArrayList;
import java.util.List;

import com.hars.persistence.entities.home.Home;
import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.entities.routine.Routine;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ownership")
public class Ownership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ownerShip_id")
    private Long id;

    @Column(name = "user_id")
    private String username;

    @Column(name = "rollerShutters_id")
    private List<Long> rollerShutters;

    @Column(name = "lightSensors_id")
    private List<Long> lightSensors;

    @Column(name = "homes_id")
    private List<Long> homes;

    @Column(name = "routines_id")
    private List<Long> routines;

    public Ownership() {
    }

    public Ownership(String username) {
        this.username = username;
        this.rollerShutters = new ArrayList<>();
        this.lightSensors = new ArrayList<>();
        this.homes = new ArrayList<>();
        this.routines = new ArrayList<>();
    }

    //getters
    public Long getId() {
        return this.id;
    }

    public String getUsername() {
        return this.username;
    }

    public List<Long> getRollerShutters() {
        return this.rollerShutters;
    }

    public List<Long> getLightSensors() {
        return this.lightSensors;
    }

    public List<Long> getHomes() {
        return this.homes;
    }

    public List<Long> getRoutines() {
        return this.routines;
    }

    //setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setRollerShutters(RollerShutter rollerShutter) {
        this.rollerShutters.add(rollerShutter.getID());
    }

    public void setLightSensors(LightSensor lightSensor) {
        this.lightSensors.add(lightSensor.getID());
    }

    public void setHomes(Home home) {
        this.homes.add(home.getID());
    }

    public void setRoutines(Routine routine) {
        this.routines.add(routine.getId());
    }
}
