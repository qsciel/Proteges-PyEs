import serial
import serial.tools.list_ports
import time
import sys

# Configuration
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
    print("--- Proteges PyEs RFID Writer Tool ---")
    port = find_arduino()
    
    if len(sys.argv) > 1:
        port = sys.argv[1]
    
    if not port:
        print("No Arduino found via auto-detection.")
        print("Available ports:")
        ports = list(serial.tools.list_ports.comports())
        for p in ports:
            print(f"  - {p.device} ({p.description})")
            
        print("\nPlease specify the port explicitly:")
        print("Usage: ./scripts/run_bridge.sh scripts/writer_tool.py /dev/ttyUSB0")
        return

    print(f"Connecting to {port}...")
    
    try:
        ser = serial.Serial(port, BAUD_RATE, timeout=2)
        time.sleep(2) # Wait for Arduino reset
        
        # Clear buffer
        ser.reset_input_buffer()
        
        print(f"Connected to {port}!")
        print("Waiting for 'GRAD_WRITER_READY' from Arduino...")
        
        # Checking for Ready signal is optional but good for verification
        # We'll just proceed to loop
        
        while True:
            student_id = input("\nEnter Student ID to write (or 'q' to quit): ").strip()
            if student_id.lower() == 'q':
                break
                
            if len(student_id) == 0:
                continue
            
            if len(student_id) > 15: # 16 bytes max
                 print("Error: ID must be 15 characters or less.")
                 continue

            max_retries = 3
            attempt = 1
            
            while attempt <= max_retries:
                print(f"\n[Attempt {attempt}/{max_retries}] Sending ID '{student_id}'... Place card NOW.")
                ser.reset_input_buffer() # Clear old messages
                ser.write(f"{student_id}\n".encode('utf-8'))
                
                # Check response
                start_time = time.time()
                success = False
                waiting = True
                
                while waiting:
                    if ser.in_waiting > 0:
                        line = ser.readline().decode('utf-8', errors='replace').strip()
                        if line:
                            print(f"[Arduino]: {line}")
                            
                            if "Success" in line:
                                print("✅ Write Successful!")
                                success = True
                                waiting = False
                            elif "Final Failure" in line or "Write failed" in line.lower() or "error" in line.lower():
                                # We wait for "Final Failure" from our Arduino sketch or specific error
                                # The current sketch prints "Final Failure." on exhaustion.
                                if "Final Failure" in line:
                                     print("❌ Cycle Failed.")
                                     waiting = False
                                
                    # Timeout for this attempt
                    if time.time() - start_time > 15:
                        print("TIMEOUT: No response from Arduino.")
                        waiting = False
                        
                    time.sleep(0.1)
                
                if success:
                    break
                
                attempt += 1
                if attempt <= max_retries:
                    print("Retrying in 2 seconds...")
                    time.sleep(2)
            
            if not success:
                print("\n❌ Failed after all attempts. Please check card placement or try another card.")
            
    except serial.SerialException as e:
        print(f"Serial Error: {e}")
    except KeyboardInterrupt:
        print("\nExiting...")
        if 'ser' in locals() and ser.is_open:
            ser.close()

if __name__ == "__main__":
    main()
