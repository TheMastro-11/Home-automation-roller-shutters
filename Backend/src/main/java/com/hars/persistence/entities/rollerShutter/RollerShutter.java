package com.hars.persistence.entities.rollerShutter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

    //helpers
    public String toJson(){
        return "\"ID\" : \"" + this.id + "\" ," +
            "\"Name\" : \"" + this.name + "\", " +
            "\"PercentageOpening\" : \"" + this.percentageOpening + "\"";
    }

    
    
}