package com.hars.persistence.repository.routine;
 
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hars.persistence.entities.routine.Routine;

@Repository
public interface RoutineRepository extends JpaRepository<Routine, Long> {
    Optional<Routine> findByName(String name);

    List<Routine> findAllByLightSensorId(Long id);
}