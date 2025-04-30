package com.hars.services.mqtt;

import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessagingException;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hars.persistence.entities.lightSensor.LightSensor;
import com.hars.persistence.entities.rollerShutter.RollerShutter;
import com.hars.persistence.repository.lightSensor.LightSensorRepository;
import com.hars.persistence.repository.rollerShutter.RollerShutterRepository;
import com.hars.services.lightSensor.LightSensorService;
import com.hars.services.rollerShutter.RollerShutterService;
import com.hars.services.routine.RoutineService;

@Component
public class MqttMessageListener {

    private static final Logger logger = LoggerFactory.getLogger(MqttMessageListener.class);
    private static final Pattern SHADOW_TOPIC_PATTERN = Pattern.compile("^\\$aws/things/([^/]+)/shadow/(.+)$");

    private final LightSensorService lightSensorService;
    private final RollerShutterService rollerShutterService;
    private final RoutineService routineService;
    private final LightSensorRepository lightSensorRepository;
    private final RollerShutterRepository rollerShutterRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public MqttMessageListener(LightSensorService lightSensorService,
                               RollerShutterService rollerShutterService,
                               RoutineService routineService,
                               LightSensorRepository lightSensorRepository,
                               RollerShutterRepository rollerShutterRepository,
                               ObjectMapper objectMapper) {
        this.lightSensorService = lightSensorService;
        this.rollerShutterService = rollerShutterService;
        this.routineService = routineService;
        this.lightSensorRepository = lightSensorRepository;
        this.rollerShutterRepository = rollerShutterRepository;
        this.objectMapper = objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }


    @ServiceActivator(inputChannel = "mqttInboundChannel")
    public void handleMessage(Message<String> message) throws MessagingException {
        String topic = message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC, String.class);
        String payload = message.getPayload();

        if (topic == null) {
            logger.warn("Messaggio ricevuto senza topic MQTT.");
            return;
        }

        logger.info("Messaggio MQTT Ricevuto su Topic: {}", topic);
        logger.debug("Raw Payload : {}", payload);

        try {
            processShadowMessage(topic, payload);

        } catch (Exception e) {
            logger.error("Errore grave durante l'elaborazione del messaggio da topic [{}]: {}", topic, e.getMessage(), e);
        }
    }

    private void processShadowMessage(String topic, String payload) {
        Matcher matcher = SHADOW_TOPIC_PATTERN.matcher(topic);
        if (matcher.matches()) {
            String thingName = matcher.group(1);
            String shadowSuffix = matcher.group(2);

            logger.debug("Messaggio identificato come AWS IoT Shadow per Thing '{}', suffisso '{}'", thingName, shadowSuffix);

            try {

                ShadowPayload shadowData = objectMapper.readValue(payload, ShadowPayload.class);

                if ("update/accepted".equals(shadowSuffix) || "get/accepted".equals(shadowSuffix)) {

                    handleShadowStateUpdate(thingName, shadowData);
                } else if ("update/delta".equals(shadowSuffix)) {
                    handleShadowDelta(thingName, shadowData);
                } else if (shadowSuffix.endsWith("/rejected")) {
                     logger.warn("Operazione Shadow rifiutata per Thing '{}'. Topic: {}, Payload: {}", thingName, topic, payload);
                } else {
                    logger.debug("Suffisso topic Shadow ('{}') non gestito attivamente dal backend.", shadowSuffix);
                }

            } catch (JsonProcessingException e) {
                logger.error("Errore parsing JSON Shadow per Thing '{}', Topic {}: {}", thingName, topic, e.getMessage());
            } catch (Exception e) {
                logger.error("Errore imprevisto elaborazione messaggio Shadow per Thing '{}', Topic {}: {}", thingName, topic, e.getMessage(), e);
            }
        } else {
             logger.trace("Topic non riconosciuto come AWS IoT Shadow standard: {}", topic);
        }
    }



    private void handleShadowStateUpdate(String originalThingName, ShadowPayload shadowData) {
         logger.info("Ricevuto stato Shadow confermato per Thing '{}'. Versione: {}", originalThingName, shadowData.getVersion());

        if (shadowData.getState() == null || shadowData.getState().getReported() == null) {
            logger.debug("Nessuno stato 'reported' trovato nel payload per Thing '{}'", originalThingName);
            return;
        }

        Map<String, Object> reportedState = shadowData.getState().getReported();
        logger.debug("Stato Reported per Thing '{}': {}", originalThingName, reportedState);


        for (Map.Entry<String, Object> entry : reportedState.entrySet()) {
            String payloadKey = entry.getKey();
            Object rawValue = entry.getValue();

            logger.debug("Elaborazione chiave/nome '{}' con valore '{}' da Thing '{}'", payloadKey, rawValue, originalThingName);


            Optional<LightSensor> lightSensorOpt = lightSensorRepository.findByName(payloadKey);
            if (lightSensorOpt.isPresent()) {
                LightSensor sensor = lightSensorOpt.get();

                Optional<Double> lightValueOpt = getDoubleValue(reportedState, payloadKey);
                if(lightValueOpt.isPresent()) {
                    int lightValueInt = lightValueOpt.get().intValue();

                    logger.info("Chiave/Nome '{}' (ID: {}): Rilevato valore LightSensor = {}", payloadKey, sensor.getID(), lightValueInt);
                    try {
                        lightSensorService.patchValueLightSensor(sensor.getID(), lightValueInt);
                        routineService.lightSensorValueCheck(sensor.getID());
                        logger.debug("Stato LightSensor per Nome '{}' (ID: {}) aggiornato nel DB.", payloadKey, sensor.getID());
                    } catch (Exception e) {
                        logger.error("Errore durante l'aggiornamento DB per LightSensor (ID: {}, Nome: {}): {}", sensor.getID(), payloadKey, e.getMessage(), e);
                    }
                } else {
                     logger.warn("Impossibile convertire il valore '{}' per la chiave/nome LightSensor '{}' in un numero.", rawValue, payloadKey);
                }
                continue;
            }


            Optional<RollerShutter> rollerShutterOpt = rollerShutterRepository.findByName(payloadKey);
            if (rollerShutterOpt.isPresent()) {
                RollerShutter shutter = rollerShutterOpt.get();

                Optional<Integer> positionOpt = getIntegerValue(reportedState, payloadKey);
                 if(positionOpt.isPresent()) {
                    int position = positionOpt.get();

                    logger.info("Chiave/Nome '{}' (ID: {}): Rilevata posizione RollerShutter = {}", payloadKey, shutter.getID(), position);
                    try {
                        rollerShutterService.patchOpeningRollerShutter(shutter.getID(), position);
                        logger.debug("Stato RollerShutter per Nome '{}' (ID: {}) aggiornato nel DB.", payloadKey, shutter.getID());
                    } catch (Exception e) {
                        logger.error("Errore durante l'aggiornamento DB per RollerShutter (ID: {}, Nome: {}): {}", shutter.getID(), payloadKey, e.getMessage(), e);
                    }
                } else {
                     logger.warn("Impossibile convertire il valore '{}' per la chiave/nome RollerShutter '{}' in un intero.", rawValue, payloadKey);
                }
                continue;
            }


            logger.warn("La chiave '{}' nel payload reported da Thing '{}' non corrisponde a nessun LightSensor o RollerShutter tramite il campo 'name'.", payloadKey, originalThingName);
        }
    }


    private void handleShadowDelta(String thingName, ShadowPayload shadowData) {
        if (shadowData.getState() != null && shadowData.getState().getDelta() != null) {
            Map<String, Object> deltaState = shadowData.getState().getDelta();
            logger.info("Ricevuto Delta Shadow per Thing '{}'. Stato Delta: {}. Versione: {}",
                        thingName, deltaState, shadowData.getVersion());

            for (Map.Entry<String, Object> entry : deltaState.entrySet()) {
                String payloadKey = entry.getKey();
                Object rawValue = entry.getValue();
                Optional<RollerShutter> rollerShutterOpt = rollerShutterRepository.findByName(payloadKey);
                if (rollerShutterOpt.isPresent()) {
                    // ... (logica per aggiornare RollerShutter basata sul delta) ...
                } else {
                     Optional<LightSensor> lightSensorOpt = lightSensorRepository.findByName(payloadKey);
                     if (lightSensorOpt.isPresent()) {
                        // ... (logica per aggiornare LightSensor basata sul delta, se applicabile) ...
                     } else {
                         logger.warn("La chiave delta '{}' non corrisponde a nessun device noto.", payloadKey);
                     }
                }
            }

        } else {
           logger.warn("Ricevuto messaggio Delta senza un oggetto 'state' o 'delta' per Thing '{}'", thingName);
       }
    }


    private Optional<Double> getDoubleValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return Optional.of(((Number) value).doubleValue());
        } else if (value instanceof String) {
            try {
                return Optional.of(Double.parseDouble((String) value));
            } catch (NumberFormatException e) {
                logger.warn("Impossibile convertire la stringa '{}' in Double per la chiave '{}'", value, key);
                return Optional.empty();
            }
        }
        if (value != null) {
             logger.warn("Valore inatteso per la chiave '{}': tipo={}, valore={}", key, value.getClass().getSimpleName(), value);
        }
        return Optional.empty();
    }

    private Optional<Integer> getIntegerValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return Optional.of(((Number) value).intValue());
        } else if (value instanceof String) {
                try {
                return Optional.of(Integer.parseInt((String) value));
            } catch (NumberFormatException e) {
                    logger.warn("Impossibile convertire la stringa '{}' in Integer per la chiave '{}'", value, key);
                return Optional.empty();
            }
        }
            if (value != null) {
                logger.warn("Valore inatteso per la chiave '{}': tipo={}, valore={}", key, value.getClass().getSimpleName(), value);
        }
        return Optional.empty();
    }



    public static class ShadowPayload {
        private State state;
        private Metadata metadata;
        private Long version;
        private Long timestamp;
        private String clientToken;
        public State getState() { return state; }
        public void setState(State state) { this.state = state; }
        public Metadata getMetadata() { return metadata; }
        public void setMetadata(Metadata metadata) { this.metadata = metadata; }
        public Long getVersion() { return version; }
        public void setVersion(Long version) { this.version = version; }
        public Long getTimestamp() { return timestamp; }
        public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
        public String getClientToken() { return clientToken; }
        public void setClientToken(String clientToken) { this.clientToken = clientToken; }
         @Override public String toString() { return "ShadowPayload{" + "state=" + state + ", metadata=" + metadata + ", version=" + version + ", timestamp=" + timestamp + '}'; }
    }

    public static class State {
        private Map<String, Object> reported;
        private Map<String, Object> desired;
        private Map<String, Object> delta;
        public Map<String, Object> getReported() { return reported; }
        public void setReported(Map<String, Object> reported) { this.reported = reported; }
        public Map<String, Object> getDesired() { return desired; }
        public void setDesired(Map<String, Object> desired) { this.desired = desired; }
        public Map<String, Object> getDelta() { return delta; }
        public void setDelta(Map<String, Object> delta) { this.delta = delta; }
        @Override public String toString() { return "State{" + "reported=" + reported + ", desired=" + desired + ", delta=" + delta + '}'; }
    }

    public static class Metadata {
        private Map<String, MetadataDetail> reported;
        private Map<String, MetadataDetail> desired;
        public Map<String, MetadataDetail> getReported() { return reported; }
        public void setReported(Map<String, MetadataDetail> reported) { this.reported = reported; }
        public Map<String, MetadataDetail> getDesired() { return desired; }
        public void setDesired(Map<String, MetadataDetail> desired) { this.desired = desired; }
         @Override public String toString() { return "Metadata{" + "reported=" + reported + ", desired=" + desired + '}'; }
    }

    public static class MetadataDetail {
        private Long timestamp;
        public Long getTimestamp() { return timestamp; }
        public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
        @Override public String toString() { return "MetadataDetail{" + "timestamp=" + timestamp + '}'; }
    }
}