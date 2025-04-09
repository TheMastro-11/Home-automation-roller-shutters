package com.hars.persistence.repository.lightSensor;
 
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hars.persistence.entities.lightSensor.LightSensor;

@Repository
public interface LightSensorRepository extends JpaRepository<LightSensor, Long> {
    Optional<LightSensor> findByName(String name);
}