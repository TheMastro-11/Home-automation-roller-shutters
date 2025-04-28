package com.hars.services.mqtt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.hars.config.MqttConfig;

@Service
public class MqttPublisherService {

    private static final Logger logger = LoggerFactory.getLogger(MqttPublisherService.class);

    @Autowired
    private MqttConfig.MqttGateway mqttGateway;

    @Value("${mqtt.topics.publish}") 
    private String defaultTopic;

    public void publishToDefaultTopic(String payload) {
        try {
            logger.info("Invio messaggio al topic di default [{}]: {}", defaultTopic, payload);
            mqttGateway.sendToMqtt(payload);
            logger.debug("Messaggio inviato con successo al topic di default.");
        } catch (Exception e) {
            logger.error("Errore durante l'invio al topic di default [{}]: {}", defaultTopic, e.getMessage(), e);
        }
    }

    public void publish(String topic, String payload, int qos) {
        if (topic == null || topic.trim().isEmpty()) {
            topic = defaultTopic;
            logger.warn("Topic non specificato, utilizzo il topic di default: {}", topic);
        }
        int effectiveQos = (qos < 0 || qos > 2) ? 1 : qos;
        if (effectiveQos != qos) {
            logger.warn("QoS specificato ({}) non valido, utilizzo QoS {}", qos, effectiveQos);
        }

        try {
            logger.info("Invio messaggio al topic [{}] con QoS [{}]: {}", topic, effectiveQos, payload);

            mqttGateway.sendToMqtt(payload, topic, effectiveQos);
            logger.debug("Messaggio inviato con successo al topic [{}].", topic);
        } catch (Exception e) {
            logger.error("Errore durante l'invio al topic [{}] con QoS [{}]: {}", topic, effectiveQos, e.getMessage(), e);
        }
    }

    public void publish(String topic, String payload) {
        publish(topic, payload, 1);
    }
}
