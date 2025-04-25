package com.hars.routineAgent.persistence.repository.scheduler;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hars.routineAgent.persistence.entities.scheduler.ScheduledTaskDefinition;

public interface ScheduledTaskRepository extends JpaRepository<ScheduledTaskDefinition, Long> {

    List<ScheduledTaskDefinition> findByExecutedFalseAndExecutionTimeAfter(LocalDateTime currentTime);
}