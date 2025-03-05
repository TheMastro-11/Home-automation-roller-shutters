package com.hars.backend;

import java.io.FileInputStream;
import java.security.KeyStore;
import java.util.Map;

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

    public static String main() {

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

        //QOS
        int qualityOfService = 0;

        try {
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
                    System.out.println("Message received on topic: " + topic);
                    System.out.println("Message content: " + new String(message.getPayload()));
                }

                @Override
                public void deliveryComplete(IMqttDeliveryToken token) {
                    System.out.println("Delivery complete: " + token.isComplete());
                }
            });

            // Connect to the broker
            System.out.println("Connecting to broker: " + broker);
            client.connect(connOpts);
            System.out.println("Connected");

            // Disconnect
            client.disconnect();
            System.out.println("Disconnected");


        } catch (Exception e) {
            e.printStackTrace();
        }


        return "ok";
    }

    private void sendControl(String mode, int step, MqttClient client, int qualityOfService) throws MqttException{
        String modeS = "{\"mode\":\"" + mode + "\"}";
        String stepS = "{\"step\":" + step + "}";
        String content = "{" + modeS + "}," + stepS + "}";
        
        String topic = "$aws/things/roller_shutter/shadow/sendControl";

        MqttMessage message = new MqttMessage(content.getBytes());
        client.publish(topic, message);
        message.setQos(qualityOfService);

        System.out.println("Publishing message: " + content);

    }
}