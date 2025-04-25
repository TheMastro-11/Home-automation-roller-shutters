package com.hars.routineAgent.services.backendAPI;

import java.util.Collections;
import java.util.Map;

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
                .baseUrl("http://localhost:8080")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE) 
                .build();
    }

    public void callApi(String routineName, Long routineId) {
        log.info("Tentativo chiamata API esterna per Routine ID: {}, Nome: {}", routineId, routineName);

        Map<String, String> requestBody = Collections.singletonMap("name", routineName);

        webClient.post()
                .uri("/api/routine/trigger")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Void.class)
                .doOnSuccess(aVoid -> log.info("Chiamata API per Routine ID: {} ({}) completata con successo.", routineId, routineName))
                .doOnError(error -> log.error("Errore durante la chiamata API per Routine ID: {} ({}). Errore: {}",
                                                routineId, routineName, error.getMessage()))
                .subscribe();

    }
}