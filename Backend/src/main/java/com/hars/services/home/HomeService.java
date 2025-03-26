package com.hars.services.home;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hars.persistence.entities.home.Home;
import com.hars.persistence.repository.home.HomeRepository;

@Service
public class HomeService {

    @Autowired
    public HomeRepository homeRepository;

    public Home loadHomeByName(String name) throws UsernameNotFoundException {
        // Use orElseThrow to handle the Optional
        Home home = homeRepository.findByName(name)
                .orElseThrow(() -> new UsernameNotFoundException("Home not found with name: " + name));

        return home;
    }
}