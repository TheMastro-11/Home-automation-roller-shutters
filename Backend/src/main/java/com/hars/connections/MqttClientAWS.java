package com.hars.connections;

import java.io.FileInputStream;
import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertificateException;
import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttAsyncClient;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

public class MqttClientAWS {

    // Timeout for waiting for a message (in milliseconds)
    private static final int TIMEOUT = 10000; 

    private static MqttClient brokerConnection() throws KeyStoreException, IOException, NoSuchAlgorithmException, CertificateException, UnrecoverableKeyException, KeyManagementException, MqttException, InterruptedException {
        // Path to the YAML file (relative to the resources folder)
        String filePath = "config.yaml";
        // Read the YAML file
        Map<String, Object> yamlData = YamlReader.readYaml(filePath);

        // Retrieve values from the config
        String broker = YamlReader.getNestedStringValue(yamlData, "broker", "url");
        String keyStorePath = YamlReader.getNestedStringValue(yamlData, "keystore", "path");
        String keyStorePassword = YamlReader.getNestedStringValue(yamlData, "keystore", "password");
        String trustStorePath = YamlReader.getNestedStringValue(yamlData, "truststore", "path");
        String trustStorePassword = YamlReader.getNestedStringValue(yamlData, "truststore", "password");

        // Client ID
        String clientId = MqttAsyncClient.generateClientId();

        // Load KeyStore
        KeyStore keyStore = KeyStore.getInstance("JKS");
        try (FileInputStream keyStoreInput = new FileInputStream(keyStorePath)) {
            keyStore.load(keyStoreInput, keyStorePassword.toCharArray());
        }

        // Load TrustStore
        KeyStore trustStore = KeyStore.getInstance("JKS");
        try (FileInputStream trustStoreInput = new FileInputStream(trustStorePath)) {
            trustStore.load(trustStoreInput, trustStorePassword.toCharArray());
        }

        // Initialize KeyManagerFactory
        KeyManagerFactory keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        keyManagerFactory.init(keyStore, keyStorePassword.toCharArray());

        // Initialize TrustManagerFactory
        TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        trustManagerFactory.init(trustStore);

        // Initialize SSLContext
        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(keyManagerFactory.getKeyManagers(), trustManagerFactory.getTrustManagers(), null);

        // Set up MQTT client options
        MqttConnectOptions connOpts = new MqttConnectOptions();
        connOpts.setSocketFactory(sslContext.getSocketFactory());
        connOpts.setCleanSession(false);
        connOpts.setKeepAliveInterval(60); // Set keep-alive interval

        // Create MQTT client
        MqttClient client = new MqttClient(broker, clientId, new MemoryPersistence());

        // Connect to the broker
        System.out.println("Connecting to broker: " + broker);
        client.connect(connOpts);
        System.out.println("Connected"); 

        return client;
    }

    public static void sendControl(int mode, int step) throws MqttException{
        String modeS = "mode : " + mode + " , ";
        String stepS = "step : " + step + " }";
        String content = "{ control : {" + modeS + stepS + "}";
        
        String topic = "$aws/things/roller_shutter/shadow/sendControl";

        try {
            MqttClient client = brokerConnection();

            MqttMessage message = new MqttMessage(content.getBytes());
            client.publish(topic, message);

            System.out.println("Publishing message: " + content);

            client.disconnect();
            System.out.println("Disconnected"); 
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    public static ArrayList<String> getStatus() throws MqttException, InterruptedException{

        String topic = "$aws/things/roller_shutter/shadow/deviceStatus";

        // Wait for a message to arrive (blocking call with timeout)
        ArrayList<String> allMessages = new ArrayList<>();

        try {
            MqttClient client = brokerConnection();

            // Create a blocking queue to hold the received message
            BlockingQueue<String> messageQueue = new LinkedBlockingQueue<>();

            // Set callback to handle connection loss
            client.setCallback(new MqttCallback() {
                @Override
                public void connectionLost(Throwable cause) {
                    System.out.println("Connection lost: " + cause.getMessage());
                    // Attempt to reconnect
                    try {
                        client.reconnect();
                    } catch (MqttException e) {
                        e.printStackTrace();
                    }
                }

                @Override
                public void messageArrived(String topic, MqttMessage message) {
                    String receivedMessage = new String(message.getPayload());
                    System.out.println("Message received on topic: " + topic);
                    System.out.println("Message content: " + new String(message.getPayload()));
                    
                    // Add the received message to the queue
                    messageQueue.offer(receivedMessage);
                }

                @Override
                public void deliveryComplete(IMqttDeliveryToken token) {
                    System.out.println("Delivery complete: " + token.isComplete());
                }
            });

            client.subscribe(topic);

            // Keep the application running to receive messages
            System.out.println("Waiting for messages...");
            
            for (int i = 0; i < 1; i++) {
                allMessages.add(messageQueue.poll(TIMEOUT, TimeUnit.MILLISECONDS));
            }

            client.disconnect();
            System.out.println("Disconnected"); 
        } catch (Exception e) {
            e.printStackTrace();
        }

    
        
        // Return the received message (or null if no message arrived within the timeout)
        return allMessages;
    }
}