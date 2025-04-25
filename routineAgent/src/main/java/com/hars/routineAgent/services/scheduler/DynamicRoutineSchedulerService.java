package com.hars.routineAgent.services.scheduler;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.hars.routineAgent.persistence.entities.routine.Routine;
import com.hars.routineAgent.persistence.repository.routine.RoutineRepository;
import com.hars.routineAgent.services.backendAPI.ExternalApiClient;

import jakarta.annotation.PreDestroy;

@Service
public class DynamicRoutineSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(DynamicRoutineSchedulerService.class);

    private final TaskScheduler taskScheduler;
    private final RoutineRepository routineRepository;
    private final ExternalApiClient externalApiClient;
    private final Clock clock;

    private final Map<Long, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    @Autowired
    public DynamicRoutineSchedulerService(TaskScheduler taskScheduler,
                                          RoutineRepository routineRepository,
                                          ExternalApiClient externalApiClient,
                                          Clock clock) {
        this.taskScheduler = taskScheduler;
        this.routineRepository = routineRepository;
        this.externalApiClient = externalApiClient;
        this.clock = Clock.systemDefaultZone();
    }

    @Scheduled(cron = "0 */5 * * * ?")
    public void scheduleDailyRoutines() {
        log.info("Inizio schedulazione giornaliera delle routine...");

        cancelAllTasks();

        List<Routine> routines = routineRepository.findAll();
        log.info("Trovate {} routine nel database.", routines.size());

        Instant now = Instant.now(clock);
        LocalDate today = LocalDate.now(clock);

        for (Routine routine : routines) {
            LocalTime actionTime = routine.getActionTime();
            if (actionTime == null) {
                log.warn("Routine ID {} ({}) non ha un actionTime impostato. Sarà ignorata.", routine.getId(), routine.getName());
                continue;
            }

            LocalDateTime scheduledDateTime = today.atTime(actionTime);
            Instant scheduledInstant = scheduledDateTime.atZone(clock.getZone()).toInstant();

            if (scheduledInstant.isAfter(now)) {
                scheduleApiCall(routine, scheduledInstant);
            } else {
                log.debug("L'orario {} per la routine ID {} ({}) è già passato oggi. Non verrà schedulata per oggi.",
                         actionTime, routine.getId(), routine.getName());
            }
        }
        log.info("Schedulazione giornaliera completata. Task attivi: {}", scheduledTasks.size());
    }

    private void scheduleApiCall(Routine routine, Instant executionInstant) {
        Runnable task = () -> {
            try {
                 log.info("Esecuzione task per Routine ID: {}, Nome: {}", routine.getId(), routine.getName());
                externalApiClient.callApi(routine.getName(), routine.getId());
            } catch (Exception e) {
                log.error("Errore durante l'esecuzione del task per Routine ID: {}", routine.getId(), e);
            } finally {
                // Rimuovi dalla mappa una volta eseguito (o fallito)
                scheduledTasks.remove(routine.getId());
                 log.debug("Task per Routine ID: {} rimosso dalla mappa.", routine.getId());
            }
        };

        try {
            ScheduledFuture<?> scheduledFuture = taskScheduler.schedule(task, executionInstant);
            scheduledTasks.put(routine.getId(), scheduledFuture);
            log.info("Routine ID: {} ({}) schedulata per le {}", routine.getId(), routine.getName(), LocalDateTime.ofInstant(executionInstant, clock.getZone()));
        } catch (Exception e) {
             log.error("Errore durante la schedulazione della Routine ID: {}", routine.getId(), e);
        }
    }

    public void cancelTask(Long routineId) {
        ScheduledFuture<?> future = scheduledTasks.remove(routineId);
        if (future != null) {
            boolean cancelled = future.cancel(false);
             log.info("Tentativo di cancellazione task per Routine ID: {}. Cancellato: {}", routineId, cancelled);
        } else {
             log.debug("Nessun task attivo trovato per Routine ID: {} da cancellare.", routineId);
        }
    }

    public void cancelAllTasks() {
        log.info("Cancellazione di tutti i {} task schedulati...", scheduledTasks.size());
        scheduledTasks.forEach((id, future) -> {
            if (future != null) {
                future.cancel(false);
            }
        });
        scheduledTasks.clear();
        log.info("Tutti i task sono stati cancellati.");
    }

     @PreDestroy
     public void onShutdown() {
        log.info("Applicazione in fase di shutdown, cancellazione task rimanenti.");
        cancelAllTasks();
    }
}