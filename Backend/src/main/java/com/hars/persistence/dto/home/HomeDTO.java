package com.hars.persistence.dto.home;

import java.util.List;

import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;

public class HomeDTO {
    private Long id;
    private List<RollerShutterDTO> rollerShutters;

    //Getters
    public Long getID() {
        return id;
    }

    public List<RollerShutterDTO> getRollerShutters() {
        return rollerShutters;
    }

    //Setters
    public void setID(Long id) {
        this.id = id;
    }

    public void setRollerShutters(List<RollerShutterDTO> rollerShutters) {
        this.rollerShutters = rollerShutters;
    }
}