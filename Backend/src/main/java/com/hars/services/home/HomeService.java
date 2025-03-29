package com.hars.services.home;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hars.persistence.dto.home.HomeDTO;
import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;
import com.hars.persistence.entities.home.Home;
import com.hars.persistence.repository.home.HomeRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class HomeService {

    @Autowired
    private HomeRepository homeRepository;

    public List<HomeDTO> getAllHomes() {
        try {
            return homeRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        } catch (Exception e) {
            throw e;
        }
    }

    public Home createHome(Home home){
        try {
            return homeRepository.save(home);
        } catch (Exception e) {
            throw e;
        }
        
    } 

    public void deleteHome(Long id){
        try {
            Home home = homeRepository.findById(id).get();
            homeRepository.delete(home);
        } catch (Exception e) {
            throw e;
        }
    }

    public Home putHome(Long id, Home newHome){
        try {
            Home home = homeRepository.findById(id).get();
            Long oldId = home.getID();
            home = newHome;
            home.setId(oldId);
            return homeRepository.save(home);
        } catch (Exception e) {
            throw e;
        }
    }


    //helpers
    private HomeDTO convertToDTO(Home home) {
        HomeDTO dto = new HomeDTO();
        dto.setId(home.getID());
        dto.setName(home.getName());
    
        if (home.getRollerShutters() != null) {
            dto.setRollerShutters(
                home.getRollerShutters().stream()
                    .map(rs -> {
                        RollerShutterDTO rsDto = new RollerShutterDTO();
                        rsDto.setName(rs.getName());
                        rsDto.setPercentageOpening(rs.getPercentageOpening());
                        return rsDto;
                    })
                    .collect(Collectors.toList())
            );
        }
    
        return dto;
    }

    public Home loadHomeByName(String name) {
    return homeRepository.findByName(name)
            .orElseThrow(() -> new EntityNotFoundException("Home not found with name: " + name));
    }

    public Boolean isPresentByName(String name){
        return homeRepository.findByName(name).isPresent();
    }

    public Boolean isPresentById(Long id){
        return homeRepository.findById(id).isPresent();
    }


}