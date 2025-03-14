package com.hars.utils;

public enum Role {
    ADMIN("admin"),  USER("user");

    private final String role;

    Role(String role){
        this.role = role;
    }

    public String getRole(){
        return this.role;
    }
}