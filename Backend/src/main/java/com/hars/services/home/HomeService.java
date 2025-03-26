package com.hars.services.home;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public List<Home> getAllHomes(){
        return homeRepository.findAll();
    }

    public void createHome(Home home){
        homeRepository.save(home);
    }


}