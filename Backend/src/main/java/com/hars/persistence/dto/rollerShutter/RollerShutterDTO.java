package com.hars.persistence.dto.rollerShutter;

public class RollerShutterDTO {
    private String name;
    private Integer percentageOpening;

    //Getters
    public String getName() {
        return this.name;
    }

    //Setters
    public void setName(String name){
        this.name = name;
    }

    public void setPercentageOpening(int percentageOpening){
        this.percentageOpening = percentageOpening;
    }

}