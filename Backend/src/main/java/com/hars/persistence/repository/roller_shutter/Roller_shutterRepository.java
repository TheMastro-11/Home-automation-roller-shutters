package com.hars.persistence.repository.roller_shutter;
 
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hars.persistence.entities.roller_shutter.Roller_shutter;

@Repository
public interface Roller_shutterRepository extends JpaRepository<Roller_shutter, Long> {
    Optional<Roller_shutter> findByName(String name);
}