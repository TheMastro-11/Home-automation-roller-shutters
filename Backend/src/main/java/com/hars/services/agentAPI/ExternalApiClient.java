package com.hars.services.agentAPI;

import java.time.LocalTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class ExternalApiClient {

    private static final Logger log = LoggerFactory.getLogger(ExternalApiClient.class);
    private final WebClient webClient;

    @Autowired
    public ExternalApiClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("http://routineAgent:8081")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE) 
                .build();
    }

    public void callApiCreate(com.hars.persistence.entities.routine.Routine routine) {
        Routine newRoutine = new Routine(routine.getId(), routine.getName(), routine.getActionTime());

        webClient.post()
                .uri("/api/agent/routine/create")
                .bodyValue(newRoutine)
                .retrieve()
                .bodyToMono(Void.class)
                .doOnSuccess(aVoid -> log.info("Chiamata API completata con successo."))
                .doOnError(error -> log.error("Errore durante la chiamata API per Routine, {}", error.getMessage()))
                .subscribe();

    }

    public void callApiDelete(Long id) {
        webClient.delete()
                .uri("/api/agent/routine/delete/" + id)
                .retrieve()
                .bodyToMono(Void.class)
                .doOnSuccess(aVoid -> log.info("Chiamata API completata con successo."))
                .doOnError(error -> log.error("Errore durante la chiamata API per Routine, {}", error.getMessage()))
                .subscribe();

    }

    public void callApiPatchName(Long id, String name) {
        webClient.patch()
                .uri("/api/agent/routine/patch/name/" + id)
                .bodyValue(name)
                .retrieve()
                .bodyToMono(Void.class)
                .doOnSuccess(aVoid -> log.info("Chiamata API completata con successo."))
                .doOnError(error -> log.error("Errore durante la chiamata API per Routine, {}", error.getMessage()))
                .subscribe();

    }

    public void callApiPatchActionTime(Long id, LocalTime actionTime) {

        webClient.patch()
                .uri("/api/agent/routine/patch/actionTime/" + id)
                .bodyValue(actionTime)
                .retrieve()
                .bodyToMono(Void.class)
                .doOnSuccess(aVoid -> log.info("Chiamata API completata con successo."))
                .doOnError(error -> log.error("Errore durante la chiamata API per Routine, {}", error.getMessage()))
                .subscribe();

    }
}

class Routine {
    private Long id;
    private String name;
    private LocalTime actionTime;

    Routine(Long id, String name, LocalTime actionTime) {
        this.id = id;
        this.name = name;
        this.actionTime = actionTime;
    }

    public Long getId() {
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public LocalTime getActionTime() {
        return this.actionTime;
    }
}