#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <MQTT.h>
#include <ArduinoJson.h>
#include <time.h>
#include <Stepper.h>

#include "configuration.h" 

/************* PIN DEFINITIONS *************/
#define LIGHTSENSOR1 A0

const int stepsPerRevolution = 100;
Stepper stepperMotor(stepsPerRevolution, D1, D2, D5, D6);
const int motorSpeed = 80;

/************* MQTT *************/
const int MQTT_PORT = 8883;
const char MQTT_PUB_SHADOW_UPDATE[] = "$aws/things/" THINGNAME "/shadow/update";
const char MQTT_SUB_SHADOW_DELTA[]  = "$aws/things/" THINGNAME "/shadow/update/delta";

WiFiClientSecure net;
MQTTClient client(256);

BearSSL::X509List   cert(cacert);
BearSSL::X509List   client_crt(client_cert);
BearSSL::PrivateKey key(privkey);

/************* GLOBALS *************/
volatile bool pendingMove = false;
volatile int  stepsToMove = 0;
int currentHeight = 0;
time_t now;
static unsigned long lastPub = 0;


const unsigned long SENSOR_INTERVAL_MS = 1UL * 60UL * 1000UL;  // 10 minuti

/************* PROTOTYPES *************/
void publishDeviceStatus();
void messageReceived(String &topic, String &payload);

/************* WIFI *************/
void connectWiFi() {
  Serial.printf("Connecting to %s", ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print('.'); }
  Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());
}

/************* MQTT *************/
void connectMQTT() {
  Serial.printf("MQTT connecting to %s…\n", MQTT_HOST);

  net.setTrustAnchors(&cert);
  net.setClientRSACert(&client_crt, &key);

  client.begin(MQTT_HOST, MQTT_PORT, net);
  client.setKeepAlive(30);
  client.onMessage(messageReceived);

  while (!client.connect(THINGNAME)) {
    Serial.print('.');
    delay(250);
  }
  Serial.println(" MQTT connected");

  client.subscribe(MQTT_SUB_SHADOW_DELTA);
}

/************* PUBLISH *************/
void publishDeviceStatus() {
  StaticJsonDocument<256> doc;
  JsonObject state = doc.createNestedObject("state");
  JsonObject rep   = state.createNestedObject("reported");
  JsonObject des   = state.createNestedObject("desired");

  rep["shutter1"]      = currentHeight;
  rep["light_value"]   = analogRead(LIGHTSENSOR1);
  rep["timestamp_utc"] = time(nullptr);

  des["shutter1"] = nullptr;           // cancella desired

  char buf[256];
  size_t n = serializeJson(doc, buf);

  if (!client.publish(MQTT_PUB_SHADOW_UPDATE, buf, n, false, 0)) {
    Serial.printf("Shadow publish failed (err=%d)\n", client.lastError());
  }
}

/************* DELTA CALLBACK *************/
void messageReceived(String &topic, String &payload) {
  if (topic != MQTT_SUB_SHADOW_DELTA) return;
  StaticJsonDocument<192> doc;
  if (deserializeJson(doc, payload)) return;

  if (doc["state"].containsKey("shutter1")) {
    stepsToMove = doc["state"]["shutter1"].as<int>();
    pendingMove = true;
    Serial.printf("Shadow movement %d)\n", stepsToMove);
  }

}

/************* SETUP *************/
void setup() {
  Serial.begin(115200);
  delay(2000);

  pinMode(LIGHTSENSOR1, INPUT);
  stepperMotor.setSpeed(motorSpeed);

  connectWiFi();

  configTime(3 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  while ((now = time(nullptr)) < 1510592825) { delay(500); }

  connectMQTT();
  publishDeviceStatus();
}

/************* LOOP *************/
void loop() {
  client.loop();
  //Serial.printf("%d\n", analogRead(LIGHTSENSOR1));

  /* execute pending command */
  if (pendingMove) {
    noInterrupts();
    int localSteps = stepsToMove - currentHeight;
    pendingMove = false;
    interrupts();

    if (localSteps != 0) {
      if (abs(localSteps) >= 0 && abs(localSteps) <= 100) {
        int dir = (localSteps > 0) ? 1 : -1;
        for (int i = 0; i < abs(localSteps); i++) {
          stepperMotor.step(dir);
          client.loop();
        }
        currentHeight = currentHeight + localSteps;
      }
      publishDeviceStatus();
    }
  }

  /* periodic publishing */
  
  if (millis() - lastPub >= SENSOR_INTERVAL_MS) {
    lastPub = millis();
    publishDeviceStatus();
  }
  client.loop();

  /* reconnect if needed */
  if (!client.connected()) {
    Serial.println("MQTT disconnected — reconnecting…");
    connectMQTT();
  }
}
