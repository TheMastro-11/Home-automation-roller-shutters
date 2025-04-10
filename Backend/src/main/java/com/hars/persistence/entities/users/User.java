package com.hars.persistence.entities.users;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.hars.utils.Permission;
import com.hars.utils.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "username")
    private String username;

    @Column(name = "password")
    private String password;

    @Column(name = "role")
    private Role role = Role.USER;

    @Column(name = "permission")
    private List<Permission> permission = new ArrayList<>(Arrays.asList(Permission.READ));

    //Getters
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Return user roles/authorities
        return Collections.singletonList(new SimpleGrantedAuthority(this.getRole()));
    }

    public Long getId() {
        return id;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    public String getRole(){
        return this.role.getRole();
    }

    public List<String> getPermission(){
        List<String> tmp = new ArrayList<>();
        
        for (Permission perm : this.permission) {
            tmp.add(perm.getPermission());
        }
        
        return tmp;
    }

    //setter
    public void setId(Long id) {
        this.id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRole(Role role){
        this.role = role;
    }

    public void setPermission(List<Permission> permission){
        this.permission = permission;
    }

    //methods
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    //helpers
    public String toJson(){
        return "\"ID\" : \"" + this.id + "\" ," +
            "\"name\" : \"" + this.username + "\"";
    }
}