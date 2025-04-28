package com.hars.persistence.repository.home;
 
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hars.persistence.entities.home.Home;


@Repository
public interface HomeRepository extends JpaRepository<Home, Long> {
    Optional<Home> findByName(String name);

    Optional<Home> findByLightSensorId(Long id);
}