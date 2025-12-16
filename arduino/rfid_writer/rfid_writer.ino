/*
  RFID Writer for Proteges PyEs
  Writes Student ID to Sector 1, Block 4 of MIFARE 1K Card.

  Components:
  - Arduino Nano
  - MFRC522 RFID Module
  - RED LED (Pin 6) - Error
  - GREEN LED (Pin 7) - Success
*/

#include <MFRC522.h>
#include <SPI.h>

#define RST_PIN 9
#define SS_PIN 10

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

  Serial.println(F("GRAD_WRITER_READY"));

  mfrc522.PCD_Reset(); // Soft Reset
  mfrc522.PCD_Init();  // Init

  // Show Reader Version (Diagnostics)
  byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print(F("Reader Version: 0x"));
  Serial.print(v, HEX);
  if (v == 0x92)
    Serial.println(F(" = v2.0"));
  else if (v == 0x91)
    Serial.println(F(" = v1.0"));
  else if (v == 0x88)
    Serial.println(F(" = clone/counterfeit"));
  else
    Serial.println(F(" = unknown"));

  // Set Antenna Gain to Max
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
}

void loop() {
  // 1. Check for Serial Data
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() == 0)
      return;

    if (input.length() > 16) {
      Serial.println(F("Error: ID too long."));
      return;
    }

    memset(dataBlock, 0, 16);
    input.getBytes(dataBlock, 16);

    Serial.print(F("Waiting for card..."));

    // Wait for card
    while (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
      delay(50);
    }

    Serial.print(F("Card UID: "));
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
      Serial.print(mfrc522.uid.uidByte[i], HEX);
    }
    Serial.println();

    // Check Card Type (Classic 1K?)
    MFRC522::PICC_Type piccType = mfrc522.PICC_GetType(mfrc522.uid.sak);
    Serial.print(F("PICC Type: "));
    Serial.println(mfrc522.PICC_GetTypeName(piccType));

    // Target Block 8
    byte blockIdx = 8;
    MFRC522::StatusCode status;
    bool success = false;

    // ATTEMPT LOOP
    for (byte attempt = 1; attempt <= 3; attempt++) {
      Serial.print(F("\n--- Attempt "));
      Serial.print(attempt);
      Serial.println(F(" ---"));

      // 1. Reset Field
      mfrc522.PCD_AntennaOff();
      delay(10);
      mfrc522.PCD_AntennaOn();
      delay(10);

      // 2. Re-detect
      if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
        Serial.println(F("   Status: Card not found after reset."));
        continue;
      }

      // 3. Auth
      status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A,
                                        blockIdx, &key, &(mfrc522.uid));
      if (status != MFRC522::STATUS_OK) {
        Serial.print(F("   Auth Error: "));
        Serial.println(mfrc522.GetStatusCodeName(status));
        continue;
      }
      Serial.println(F("   Auth: OK"));

      // 4. READ TEST
      byte buffer[18];
      byte size = sizeof(buffer);
      status = mfrc522.MIFARE_Read(blockIdx, buffer, &size);
      if (status == MFRC522::STATUS_OK) {
        Serial.print(F("   Read Block 8: OK. Data: "));
        for (byte i = 0; i < 16; i++) {
          Serial.print(buffer[i], HEX);
          Serial.print(" ");
        }
        Serial.println();
      } else {
        Serial.print(F("   Read Error: "));
        Serial.println(mfrc522.GetStatusCodeName(status));
        // If Read fails, Write will definitely fail
        continue;
      }

      // 5. WRITE TEST
      Serial.println(F("   Attempting Write..."));
      status = mfrc522.MIFARE_Write(blockIdx, dataBlock, 16);
      if (status == MFRC522::STATUS_OK) {
        Serial.println(F("   Write Success!"));
        success = true;
        break;
      } else {
        Serial.print(F("   Write Error: "));
        Serial.println(mfrc522.GetStatusCodeName(status));
      }
    }

    if (!success) {
      Serial.println(F("Final Failure."));
      digitalWrite(6, HIGH);
      delay(1000);
      digitalWrite(6, LOW);
    } else {
      Serial.println(F("Success: Data written."));
      digitalWrite(7, HIGH);
      delay(1000);
      digitalWrite(7, LOW);
    }

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  }
}
