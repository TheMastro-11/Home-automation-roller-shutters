package com.hars.services.mqtt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.handler.annotation.Header; // Per leggere header specifici
import org.springframework.integration.mqtt.support.MqttHeaders; // Per costanti header MQTT
import org.springframework.stereotype.Component;

@Component // Rende questa classe un bean Spring
public class MqttMessageListener {

    private static final Logger logger = LoggerFactory.getLogger(MqttMessageListener.class);

    /**
     * Gestisce i messaggi in arrivo dal canale di input MQTT.
     * Il nome del canale ("mqttInboundChannel") deve corrispondere a quello
     * definito come outputChannel nell'adapter inbound in MqttConfig.
     *
     * @param message Il messaggio completo ricevuto da Spring Integration
     * @throws MessagingException Possibili eccezioni durante la gestione
     */
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

        // Qui puoi aggiungere la tua logica applicativa per processare il messaggio.
        // Esempio: salvare su DB, inoltrare ad altri sistemi, ecc.
        try {
            processReceivedMessage(topic, payload);
        } catch (Exception e) {
            logger.error("Errore durante l'elaborazione del messaggio dal topic [{}]: {}", topic, e.getMessage(), e);
            // Decidi come gestire l'errore (es. inviare a un dead-letter-queue, loggare, ecc.)
            // Lanciare l'eccezione potrebbe causare tentativi di riconsegna a seconda della config.
        }
    }

    /**
     * Metodo di esempio per l'elaborazione specifica del messaggio.
     *
     * @param topic Il topic da cui proviene il messaggio.
     * @param payload Il contenuto del messaggio.
     */
    private void processReceivedMessage(String topic, String payload) {
        logger.debug("Inizio elaborazione messaggio da topic: {}", topic);
        // Implementa qui la tua logica...
        // Esempio: if (topic.equals("alerts/critical")) { handleCriticalAlert(payload); }
        logger.debug("Fine elaborazione messaggio da topic: {}", topic);
    }

    // --- Metodo Alternativo (più semplice se ti serve solo il payload) ---
    /*
    @ServiceActivator(inputChannel = "mqttInboundChannel")
    public void handlePayloadOnly(String payload, @Header(MqttHeaders.RECEIVED_TOPIC) String topic) {
         logger.info("-----------------------------------------");
         logger.info("Messaggio MQTT Ricevuto (Payload Only):");
         logger.info("Topic   : {}", topic);
         logger.info("Payload : {}", payload);
         logger.info("-----------------------------------------");
         processReceivedMessage(topic, payload);
    }
    */
}
