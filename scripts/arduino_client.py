import serial
import requests
import time
import sys
from datetime import datetime

# Configuration
# ------------------------------------------------------------------
# Backend URL (Replace with your computer's IP if running remotely)
API_URL = "http://localhost:5000/attendance"  
# API_URL = "http://192.168.1.100:5000/attendance" # Example for remote

# Serial Configuration (Check Arduino IDE for correct Port)
SERIAL_PORT = 'COM3'  # Windows: COM3, COM4, etc. Linux/Mac: /dev/ttyUSB0
BAUD_RATE = 9600
# ------------------------------------------------------------------

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def connect_serial():
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        log(f"Connected to {SERIAL_PORT} at {BAUD_RATE} baud.")
        return ser
    except serial.SerialException as e:
        log(f"Error connecting to serial: {e}")
        return None

def register_attendance(student_id):
    try:
        payload = {
            "student_id": student_id,
            "scan_type": "entry" # Or 'exit', logic can be added later
        }
        response = requests.post(API_URL, json=payload, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            student_name = data.get('student_name', 'Unknown')
            log(f"SUCCESS: Attendance registered for {student_name} ({student_id})")
        else:
            log(f"FAILED: Server returned {response.status_code} - {response.text}")
            
    except requests.exceptions.RequestException as e:
        log(f"CONNECTION ERROR: Could not talk to backend at {API_URL}")
        log(f"Details: {e}")

def main():
    log("Starting RFID Attendance Client...")
    log(f"Target Backend: {API_URL}")
    
    ser = connect_serial()
    
    while True:
        if ser is None or not ser.is_open:
            log("Waiting for serial connection...")
            time.sleep(5)
            ser = connect_serial()
            continue

        try:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                if line:
                    log(f"Card Detected: {line}")
                    register_attendance(line)
                    
        except serial.SerialException:
            log("Serial connection lost.")
            if ser:
                ser.close()
            ser = None
        except Exception as e:
            log(f"Unexpected error: {e}")
            time.sleep(1)

        time.sleep(0.1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("\nStopping client...")
        sys.exit(0)
