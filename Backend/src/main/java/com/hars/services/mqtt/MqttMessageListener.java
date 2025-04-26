package com.hars.services.mqtt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessagingException;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.hars.services.routine.RoutineService;

@Component
public class MqttMessageListener {

    private static final Logger logger = LoggerFactory.getLogger(MqttMessageListener.class);

    private final RoutineService routineService;
    private final ObjectMapper objectMapper;

    @Autowired
    public MqttMessageListener(RoutineService routineService, ObjectMapper objectMapper) {
        this.routineService = routineService;
        this.objectMapper = objectMapper; 
    }


    @ServiceActivator(inputChannel = "mqttInboundChannel")
    public void handleMessage(Message<String> message) throws MessagingException {
        String topic = message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC, String.class);
        String payload = message.getPayload();
        Integer qos = message.getHeaders().get(MqttHeaders.RECEIVED_QOS, Integer.class);

        logger.info("-----------------------------------------");
        logger.info("Messaggio MQTT Ricevuto:");
        logger.info("Topic   : {}", topic);
        logger.info("QoS     : {}", qos != null ? qos : "N/A");
        logger.info("Payload : {}", payload);
        logger.info("-----------------------------------------");

        try {
            processReceivedMessage(topic, payload);
        } catch (Exception e) {
            logger.error("Errore durante l'elaborazione del messaggio dal topic [{}]: {}", topic, e.getMessage(), e);
        }
    }

    private void processReceivedMessage(String topic, String payload) {
        logger.debug("Inizio elaborazione messaggio da topic: {}", topic);

        switch (topic) {
            case "lightSensor":
                try {
                    LightSensorPayload sensorData = objectMapper.readValue(payload, LightSensorPayload.class);
                    logger.info("Payload deserializzato: {}", sensorData);

                    Long sensorIdFromPayload = sensorData.getSensorId();

                    if (sensorIdFromPayload == null) {
                        logger.warn("ID del sensore mancante nel payload per il topic {}: {}", topic, payload);
                        return;
                    }

                    if (routineService.isLightSensorPresentById(sensorIdFromPayload)) {
                        routineService.lightSensorValueCheck(sensorIdFromPayload);
                    } else {
                        logger.warn("Sensore con ID {} (dal payload) non trovato.", sensorIdFromPayload);
                    }

                } catch (JsonProcessingException e) {
                    logger.error("Errore durante il parsing del payload JSON per il topic {}: {}", topic, payload, e);
                } catch (Exception e) {
                    logger.error("Errore imprevisto durante l'elaborazione del messaggio per il topic {}: {}", topic, payload, e);
                }
                break;

            default:
                logger.warn("Nessuna logica di elaborazione definita per il topic: {}", topic);
                break;
        }

        logger.debug("Fine elaborazione messaggio da topic: {}", topic);
    }

    public static class LightSensorPayload {
        private Long sensorId;
        private Double value;
        private String timestamp;

        public LightSensorPayload() {}

        // Getters e Setters
        public Long getSensorId() { return sensorId; }
        public void setSensorId(Long sensorId) { this.sensorId = sensorId; }
        public Double getValue() { return value; }
        public void setValue(Double value) { this.value = value; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

        @Override
        public String toString() {
            return "LightSensorPayload{" +
                   "sensorId=" + sensorId +
                   ", value=" + value +
                   ", timestamp='" + timestamp + '\'' +
                   '}';
        }
    }
}