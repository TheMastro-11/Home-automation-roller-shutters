package com.hars.persistence.repository.rollerShutter;
 
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hars.persistence.entities.rollerShutter.RollerShutter;

@Repository
public interface RollerShutterRepository extends JpaRepository<RollerShutter, Long> {
    Optional<RollerShutter> findByName(String name);
}