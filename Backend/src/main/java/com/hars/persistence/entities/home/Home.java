package com.hars.persistence.entities.home;

import java.util.ArrayList;
import java.util.List;

import com.hars.persistence.entities.roller_shutter.Roller_shutter;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "homes")
public class Home {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "home", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Roller_shutter> roller_shutter = new ArrayList<>();

    public void setName(String name){
        this.name = name;
    }

    public String getName() {
        return this.name;
    }

    public Home(String name){
        this.name = name;
    }

}