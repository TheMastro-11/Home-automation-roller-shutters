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

    public Home loadHomeByName(String name) {
    return homeRepository.findByName(name)
            .orElseThrow(() -> new EntityNotFoundException("Home not found with name: " + name));
    }

    public Boolean isPresent(Home home){
        return homeRepository.findByName(home.getName()).isPresent();
    }

    public List<HomeDTO> getAllHomes() {
        return homeRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public void createHome(Home home){
        homeRepository.save(home);
    }

    private HomeDTO convertToDTO(Home home) {
    HomeDTO dto = new HomeDTO();
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


}