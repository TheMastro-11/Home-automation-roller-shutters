package com.hars.persistence.entities.routine;

import jakarta.persistence.Embeddable;

@Embeddable
public record LightValueRecord (int value, Boolean method){
    
}
