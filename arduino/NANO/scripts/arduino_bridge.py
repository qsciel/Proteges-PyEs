import serial
import serial.tools.list_ports
import requests
import json
import time
import sys

# Configuration
API_URL = "http://localhost:5000/"
USER_ID = 2765432101  # Hardcoded as requested
CLASSROOM = "ENTRANCE" # Default classroom
BAUD_RATE = 9600

def find_arduino():
    """Auto-detect Arduino port"""
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        # Check against common names for Arduino and clones (like CH340)
        desc = p.description.lower()
        if "arduino" in desc or "usb serial" in desc or "ch340" in desc or "com" in desc:
            return p.device
    return None

def main():
    port = find_arduino()
    
    if len(sys.argv) > 1:
        port = sys.argv[1]
    
    if not port:
        print("No Arduino found via auto-detection.")
        print("Available ports:")
        ports = list(serial.tools.list_ports.comports())
        for p in ports:
            print(f"  - {p.device} ({p.description})")
        print("Please specify port manually: ./scripts/run_bridge.sh /dev/ttyUSB0")
        return

    print(f"Connecting to {port}...")
    
    try:
        ser = serial.Serial(port, BAUD_RATE, timeout=1)
        time.sleep(2) # Wait for Arduino reset
        print("Connected. Waiting for cards...")
        
        while True:
            if ser.in_waiting > 0:
                try:
                    line = ser.readline().decode('utf-8').strip()
                    if not line:
                        continue
                    
                    print(f"Received: {line}")
                    
                    # Try to parse JSON
                    try:
                        data = json.loads(line)
                        
                        if "student_id" in data:
                            student_id = data["student_id"]
                            print(f"Scanned Card UID: {student_id}")
                            
                            payload = {
                                "student_id": student_id,
                                "user_id": USER_ID,
                                "classroom": CLASSROOM,
                                "present": True
                            }
                            
                            try:
                                r = requests.post("http://localhost:5000/attendance", json=payload)
                                if r.status_code == 200:
                                    resp_json = r.json()
                                    scan_type = resp_json.get("type", "REGISTRADO")
                                    classroom = resp_json.get("classroom", "")
                                    print(f"✅ {scan_type} {'a' if scan_type == 'ENTRADA' else 'de'} {classroom}")
                                else:
                                    print(f"❌ Failed to register: {r.status_code} {r.text}")
                            except requests.RequestException as e:
                                print(f"❌ Connection Error: {e}")
                                
                        elif "status" in data:
                             print(f"Arduino Status: {data['status']}")
                             
                    except json.JSONDecodeError:
                        print(f"Raw output (not JSON): {line}")
                        
                except UnicodeDecodeError:
                    pass
                    
            time.sleep(0.1)
            
    except serial.SerialException as e:
        print(f"Serial Error: {e}")
    except KeyboardInterrupt:
        print("\nExiting...")
        if 'ser' in locals() and ser.is_open:
            ser.close()

if __name__ == "__main__":
    main()
