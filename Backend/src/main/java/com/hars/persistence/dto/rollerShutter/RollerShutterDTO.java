package com.hars.persistence.dto.rollerShutter;

public class RollerShutterDTO {
    private Long id;
    private String name;
    private Integer percentageOpening;

    //Getters
    public Long getID() {
        return id;
    }

    //Setters
    public void setID(Long id) {
        this.id = id;
    }

    public void setName(String name){
        this.name = name;
    }

    public void setPercentageOpening(int percentageOpening){
        this.percentageOpening = percentageOpening;
    }

}