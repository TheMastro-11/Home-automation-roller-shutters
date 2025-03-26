package com.hars.persistence.entities.roller_shutter;

import com.hars.persistence.entities.home.Home;
import com.hars.services.home.HomeService;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "roller_shutter")
public class Roller_shutter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int percentage_open;

    private HomeService homeService;

    @ManyToOne
    @JoinColumn(name = "author_id") // Foreign key column in the "books" table
    private Home home;

    public Roller_shutter(String name, int percentage_open, String homeName) {
        this.name = name;
        this.percentage_open = percentage_open;
        try {
            Home validHome = homeService.loadHomeByName(homeName);
            this.home = validHome;
        } catch (Exception e) {
        }
    }
    
}