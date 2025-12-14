/*
  RFID Writer for Proteges PyEs
  Writes Student ID to Sector 1, Block 4 of MIFARE 1K Card.
  
  Components:
  - Arduino Nano
  - MFRC522 RFID Module
  - RED LED (Pin 6) - Error
  - GREEN LED (Pin 7) - Success
*/

#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN         9
#define SS_PIN          10

MFRC522 mfrc522(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

// Data to write (16 bytes max per block)
// Format: "ID_CONTROL_ESCOLAR" (e.g., "20230001")
byte dataBlock[16];

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();
  
  pinMode(6, OUTPUT); // RED LED
  pinMode(7, OUTPUT); // GREEN LED

  // Prepare key (default FFFFFFFFFFFF)
  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = 0xFF;
  }
  
  Serial.println(F("Ready to write. Send ID via Serial..."));
}

void loop() {
  // 1. Check for Serial Data (ID to write)
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    if (input.length() > 16) {
      Serial.println(F("Error: ID too long (max 16 chars)"));
      digitalWrite(6, HIGH); delay(1000); digitalWrite(6, LOW);
      return;
    }

    // Prepare buffer
    memset(dataBlock, 0, 16); // Clear buffer
    input.getBytes(dataBlock, 16);
    
    Serial.print(F("Waiting for card to write: "));
    Serial.println(input);
    
    // Wait for card
    while (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
      delay(50);
    }

    // Authenticate Sector 1 (Block 4)
    byte block = 4;
    MFRC522::StatusCode status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(mfrc522.uid));
    if (status != MFRC522::STATUS_OK) {
      Serial.print(F("Auth failed: "));
      Serial.println(mfrc522.GetStatusCodeName(status));
      digitalWrite(6, HIGH); delay(1000); digitalWrite(6, LOW);
      return;
    }

    // Write Data
    status = mfrc522.MIFARE_Write(block, dataBlock, 16);
    if (status != MFRC522::STATUS_OK) {
      Serial.print(F("Write failed: "));
      Serial.println(mfrc522.GetStatusCodeName(status));
      digitalWrite(6, HIGH); delay(1000); digitalWrite(6, LOW);
    } else {
      Serial.println(F("Success: Data written."));
      digitalWrite(7, HIGH); delay(1000); digitalWrite(7, LOW);
    }
    
    // Halt
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  }
}
