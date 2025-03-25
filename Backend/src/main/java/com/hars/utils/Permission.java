package com.hars.utils;

public enum Permission {
    READ("read"), WRITE("write"), READ_WRITE("read_write");

    private final String permission;

    Permission(String permission){
        this.permission = permission;
    }

    public String getPermission(){
        return this.permission;
    }
}