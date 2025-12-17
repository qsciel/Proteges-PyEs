#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

#define SS_PIN     D4
#define RST_PIN    D3
#define BUZZER_PIN D2

// 🔧 WiFi config
const char* ssid = "INFINITUM2AF3_2.4";
const char* password = "tmqF6MuUxE";

// 🔧 Backend config
const char* API_URL = "http://192.168.1.10:5000/attendance";
const long USER_ID = 2765432101;
const char* CLASSROOM = "ENTRANCE";

MFRC522 rfid(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

void beep() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
}

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(BUZZER_PIN, OUTPUT);

  // RFID key
  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = 0xFF;
  }

  // WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.println("{\"status\":\"READY\"}");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  // UID → string HEX
  String studentId = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) studentId += "0";
    studentId += String(rfid.uid.uidByte[i], HEX);
  }
  studentId.toUpperCase();

  Serial.print("Scanned: ");
  Serial.println(studentId);

  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    http.begin(client, API_URL);
    http.addHeader("Content-Type", "application/json");

    String payload = "{";
    payload += "\"student_id\":\"" + studentId + "\",";
    payload += "\"user_id\":" + String(USER_ID) + ",";
    payload += "\"classroom\":\"" + String(CLASSROOM) + "\",";
    payload += "\"present\":true";
    payload += "}";

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Server response:");
      Serial.println(response);
      beep();
    } else {
      Serial.print("HTTP Error: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }

  delay(1000); // anti double-read
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
