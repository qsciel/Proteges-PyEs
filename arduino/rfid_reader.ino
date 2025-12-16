/*
  RFID Reader for Proteges PyEs
  Reads Student ID from Sector 1, Block 4.
  Sends ID via Serial to App/PC.

  Components:
  - Arduino Nano
  - MFRC522 RFID Module
  - Buzzer (Pin 5) - Beep on scan
*/

#include <MFRC522.h>
#include <SPI.h>

#define RST_PIN 9
#define SS_PIN 10
#define BUZZER_PIN 5

MFRC522 mfrc522(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();
  pinMode(BUZZER_PIN, OUTPUT);

  // Prepare key
  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = 0xFF; // Default key
  }

  Serial.println(F("{\"status\": \"READY\"}"));
}

void loop() {
  // Look for new cards
  if (!mfrc522.PICC_IsNewCardPresent())
    return;
  if (!mfrc522.PICC_ReadCardSerial())
    return;

  // Read UID
  String studentId = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10)
      studentId += "0";
    studentId += String(mfrc522.uid.uidByte[i], HEX);
  }
  studentId.toUpperCase();

  // Print ID to Serial as JSON
  Serial.print("{\"student_id\": \"");
  Serial.print(studentId);
  Serial.println("\"}");

  // Beep
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);

  // Prevent re-read immediately
  delay(1000);

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}
