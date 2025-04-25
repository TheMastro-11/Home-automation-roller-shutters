package com.hars.routineAgent.persistence.entities.routine;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "routine")
public class Routine {
    @Id
    @Column(name = "routine_id")
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "actionTime")
    private LocalTime actionTime; 

    //builder
    public Routine() {}

    public Routine(Long id, String name, LocalTime actionTime) {
        this.id = id;
        this.name = name;
        this.actionTime = actionTime;
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
}
