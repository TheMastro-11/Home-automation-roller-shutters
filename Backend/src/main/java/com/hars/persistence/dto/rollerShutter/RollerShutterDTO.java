package com.hars.persistence.dto.rollerShutter;
import com.hars.persistence.dto.home.HomeDTO;

public class RollerShutterDTO {
    private Long id;
    private String name;
    private int percentageOpening;
    private HomeDTO home;

    //Getters
    public Long getId(){
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public int getPercentageOpening(){
        return this.percentageOpening;
    }

    public HomeDTO getHome(){
        return this.home;
    }

    //Setters
    public void setId(Long id){
        this.id = id;
    }

    public void setName(String name){
        this.name = name;
    }

    public void setPercentageOpening(int percentageOpening){
        this.percentageOpening = percentageOpening;
    }

    public void setHome(HomeDTO home){
        this.home = home;
    }

}