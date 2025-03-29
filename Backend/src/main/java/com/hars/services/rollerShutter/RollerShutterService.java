package com.hars.services.rollerShutter;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hars.persistence.dto.home.HomeDTO;
import com.hars.persistence.dto.rollerShutter.RollerShutterDTO;
import com.hars.persistence.entities.home.Home;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.repository.rollerShutter.RollerShutterRepository;
import com.hars.services.home.HomeService;

@Service
public class RollerShutterService {

    @Autowired
    private RollerShutterRepository rollerShutterRepository;

    @Autowired
    private HomeService homeService;

    public List<RollerShutterDTO> getAllRollerShutters(){
        try {
            return rollerShutterRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        } catch (Exception e) {
            throw e;
        }
    }
    
    public String createRollerShutter(String name, String homeName) {
        try {
            Home validHome = homeService.loadHomeByName(homeName);
            RollerShutter roller_shutter = new RollerShutter(name, validHome);
            rollerShutterRepository.save(roller_shutter);
            return "Roller shutter created successfully!";
        } catch (Exception e) {
            throw e;
        }
    }

    public void deleteRollerShutter(Long id){
        try {
            RollerShutter rollerShutter = rollerShutterRepository.findById(id).get();
            rollerShutterRepository.delete(rollerShutter);
        } catch (Exception e) {
            throw e;
        }
    }  

    public RollerShutter patchNameRollerShutter(Long id, String name){
        try {
            RollerShutter rollerShutter = rollerShutterRepository.findById(id).get();
            rollerShutter.setName(name);
            rollerShutter = rollerShutterRepository.save(rollerShutter);
            return rollerShutter;
        } catch (Exception e) {
            throw e;
        }
    }

    public RollerShutter patchOpeningRollerShutter(Long id, int increase_value){
        try {
            RollerShutter rollerShutter = rollerShutterRepository.findById(id).get();
            rollerShutter.setPercentageOpening(increase_value);
            rollerShutter = rollerShutterRepository.save(rollerShutter);
            return rollerShutter;
        } catch (Exception e) {
            throw e;
        }
    }

    public RollerShutter patchHomeRollerShutter(Long id, String home){
        try {
            Home validHome = homeService.loadHomeByName(home);
            RollerShutter rollerShutter = rollerShutterRepository.findById(id).get();
            rollerShutter.setHome(validHome);
            rollerShutter = rollerShutterRepository.save(rollerShutter);
            return rollerShutter;
        } catch (Exception e) {
            throw e;
        }
    }

    //Helpers
    private RollerShutterDTO convertToDTO(RollerShutter rollerShutter) {
        RollerShutterDTO dto = new RollerShutterDTO();
        dto.setId(rollerShutter.getID());
        dto.setName(rollerShutter.getName());
        dto.setPercentageOpening(rollerShutter.getPercentageOpening());
    
        if (rollerShutter.getHome() != null) {
            HomeDTO homeDto = new HomeDTO();
            Home relatedHome = rollerShutter.getHome();
            homeDto.setName(relatedHome.getName());
            dto.setHome(homeDto);
        }
    
        return dto;
    }

    public RollerShutter loadHomeByName(String name) throws UsernameNotFoundException {
        // Use orElseThrow to handle the Optional
        RollerShutter roller_shutter = rollerShutterRepository.findByName(name)
                .orElseThrow(() -> new UsernameNotFoundException("Home not found with name: " + name));

        return roller_shutter;
    }

    public Boolean isPresentByName(String name){
        return rollerShutterRepository.findByName(name).isPresent();
    }

    public Boolean isPresentById(Long id){
        return rollerShutterRepository.findById(id).isPresent();
    }
    
}