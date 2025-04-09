package com.hars.persistence.entities.rollerShutter;

import java.util.List;

import com.hars.persistence.entities.routine.Routine;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "rollerShutter")
public class RollerShutter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rollerShutter_id")
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "percentageOpening")
    private int percentageOpening = 0;

    @ManyToMany(mappedBy = "rollerShutters")
    private List<Routine> routines;

    //builder
    public RollerShutter(){}

    public RollerShutter(String name) {
        this.name = name;
    }

    //getter
    public long getID(){
        return this.id;
    }

    public String getName(){
        return this.name;
    }

    public int getPercentageOpening(){
        return this.percentageOpening;
    }

    public List<Routine> getRoutines() {
        return this.routines;
    }

    //setter
    public void setId(Long id){
        this.id = id;
    }

    public void setName(String name){
        this.name = name;
    }
    
    public void setPercentageOpening(int percentage){
        this.percentageOpening = percentage;
    }

    public void setRoutines(List<Routine> routines) {
        this.routines = routines;
    }

    //helpers
    public String toJson(){
        return "\"Name\" : \"" + this.name + "\", " +
            "\"PercentageOpening\" : \"" + this.percentageOpening + "\"";
    }

    
    
}