/*
  RFID Reader for Proteges PyEs
  Reads Student ID from Sector 1, Block 4.
  Sends ID via Serial to App/PC.
  
  Components:
  - Arduino Nano
  - MFRC522 RFID Module
  - Buzzer (Pin 5) - Beep on scan
*/

#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN         9
#define SS_PIN          10
#define BUZZER_PIN      5

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
  
  Serial.println(F("Ready to scan..."));
}

void loop() {
  // Look for new cards
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  byte block = 4;
  byte buffer[18]; // Need 18 bytes for read buffer
  byte size = sizeof(buffer);
  
  // Authenticate
  MFRC522::StatusCode status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(mfrc522.uid));
  if (status != MFRC522::STATUS_OK) {
    // Auth failed
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return;
  }

  // Read Block
  status = mfrc522.MIFARE_Read(block, buffer, &size);
  if (status == MFRC522::STATUS_OK) {
    // Success: Parse Data
    String studentId = "";
    for (byte i = 0; i < 16; i++) {
      if (buffer[i] != 0) {
        studentId += (char)buffer[i];
      }
    }
    studentId.trim();
    
    // Print ID to Serial
    Serial.println(studentId);
    
    // Beep
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    
    // Prevent re-read immediately
    delay(1000);
  }
  
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}
