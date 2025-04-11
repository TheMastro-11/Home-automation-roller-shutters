package com.hars.config;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Security;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManagerFactory;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openssl.PEMKeyPair; // Import esplicito per l'header
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions; // Import esplicito per l'annotazione header
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.IntegrationComponentScan;
import org.springframework.integration.annotation.MessagingGateway;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.channel.PublishSubscribeChannel;
import org.springframework.integration.config.EnableIntegration;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.handler.annotation.Header;

@Configuration
@EnableIntegration 
@IntegrationComponentScan(basePackages = "com.hars")
public class MqttConfig {

    @Value("${aws.iot.endpoint}")
    private String awsIotEndpoint;

    @Value("${aws.iot.clientId}")
    private String awsIotClientId;

    @Value("${aws.iot.privateKeyPem}")
    private String privateKeyPem;

    @Value("${aws.iot.certificatePem}")
    private String certificatePem;

    @Value("${aws.iot.caCertificatePem}")
    private String caCertificatePem;

    @Value("${mqtt.topics.publish}")
    private String defaultPublishTopic;

    @Value("${mqtt.topics.subscribe}")
    private String defaultSubscribeTopic;

    @Value("${mqtt.channels.outbound}")
    private String outboundChannelName;

    @Value("${mqtt.channels.inbound}")
    private String inboundChannelName;

    @Bean
    public MqttPahoClientFactory mqttClientFactory() throws Exception {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{awsIotEndpoint});
        options.setSocketFactory(createSslSocketFactory());
        options.setCleanSession(true);
        options.setAutomaticReconnect(true);
        factory.setConnectionOptions(options);
        return factory;
    }

    private SSLSocketFactory createSslSocketFactory() throws Exception {
        Security.addProvider(new BouncyCastleProvider());

        X509Certificate caCert;
        try (InputStream caCertIs = new ByteArrayInputStream(caCertificatePem.getBytes(StandardCharsets.UTF_8))) {
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            caCert = (X509Certificate) cf.generateCertificate(caCertIs);
        }

        KeyStore caKs = KeyStore.getInstance(KeyStore.getDefaultType());
        caKs.load(null, null);
        caKs.setCertificateEntry("ca-certificate", caCert);
        TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        tmf.init(caKs);

        X509Certificate clientCert;
        try (InputStream clientCertIs = new ByteArrayInputStream(certificatePem.getBytes(StandardCharsets.UTF_8))) {
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            clientCert = (X509Certificate) cf.generateCertificate(clientCertIs);
        }

        PrivateKey privateKey;
        try (StringReader keyReader = new StringReader(privateKeyPem);
             PEMParser pemParser = new PEMParser(keyReader)) {
            Object object = pemParser.readObject();
            JcaPEMKeyConverter converter = new JcaPEMKeyConverter().setProvider("BC");
            if (object instanceof PEMKeyPair) {
                privateKey = converter.getKeyPair((PEMKeyPair) object).getPrivate();
            } else {
                throw new IllegalArgumentException("Formato chiave privata non supportato o stringa PEM non valida.");
            }
        }

        KeyStore clientKs = KeyStore.getInstance(KeyStore.getDefaultType());
        clientKs.load(null, null);
        clientKs.setCertificateEntry("certificate", clientCert);
        clientKs.setKeyEntry("private-key", privateKey, "".toCharArray(), new java.security.cert.Certificate[]{clientCert});

        KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        kmf.init(clientKs, "".toCharArray());

        SSLContext context = SSLContext.getInstance("TLSv1.2");
        context.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);

        return context.getSocketFactory();
    }

    @Bean(name = "mqttOutboundChannel")
    public MessageChannel mqttOutboundChannel() {
        return new DirectChannel();
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MessageHandler mqttOutbound(MqttPahoClientFactory clientFactory) {
        String outboundClientId = awsIotClientId + "_pub";
        MqttPahoMessageHandler messageHandler = new MqttPahoMessageHandler(outboundClientId, clientFactory);
        messageHandler.setAsync(true);
        messageHandler.setDefaultTopic(defaultPublishTopic);
        messageHandler.setDefaultQos(1);
        return messageHandler;
    }

    @MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
    public interface MqttGateway {
        void sendToMqtt(String payload);
        void sendToMqtt(String payload, @Header(MqttHeaders.TOPIC) String topic);
        void sendToMqtt(String payload, @Header(MqttHeaders.TOPIC) String topic, @Header(MqttHeaders.QOS) int qos);
    }

    @Bean(name = "mqttInboundChannel")
    public MessageChannel mqttInboundChannel() {
        //return new DirectChannel();
        return new PublishSubscribeChannel();
    }

    @Bean
    public MqttPahoMessageDrivenChannelAdapter mqttInbound(MqttPahoClientFactory clientFactory) {
        String inboundClientId = awsIotClientId + "_sub";
        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(inboundClientId, clientFactory, defaultSubscribeTopic);
        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInboundChannel());
        return adapter;
    }
}