#include <Adafruit_PWMServoDriver.h>
#include "servo.h"

#define SERVO_FREQ 50

// Robot structure
struct Leg {
  Servo hip;   // Upper joint
  Servo knee;  // Lower joint
  int legId;
};

// Global variables
Leg legs[4];
unsigned long lastUpdate = 0;
const unsigned long UPDATE_INTERVAL = 20; // 50Hz update rate
String serialCommand = "";
bool commandReceived = false;

// Servo calibration data
float servoTrims[8] = {-10, -30, 0, 50, -10, -30, -10, -60};  // knee, hip
bool servoReverse[8] = {false, false, false, true, false, false, false, false};  // Leg 1 hip and Leg 3 hip reversed

void setup() {
  Serial.begin(9600);
  
  // Initialize PWM driver
  pwm.begin();
  pwm.setOscillatorFrequency(27000000);
  pwm.setPWMFreq(SERVO_FREQ);
  
  // Initialize legs
  initializeLegs();
  
  // Move to neutral position
  neutralPosition();
  delay(1000);
  
  Serial.println("RoboPuppy Ready!");
  Serial.println("Available commands:");
  Serial.println("  stand - Make robot stand");
  Serial.println("  sit - Make robot sit");
  Serial.println("  walk - Start walking");
  Serial.println("  neutral - Return to neutral position");
  Serial.println("  leg <0-3> <hip|knee> <angle> - Control individual joints");
  Serial.println("  help - Show this help message");
}

void initializeLegs() {
  for (int i = 0; i < 4; i++) {
    legs[i].legId = i;
    
    // Initialize knee servo (even pins: 0,2,4,6)
    legs[i].knee.pin = i * 2;
    legs[i].knee.trim = servoTrims[i * 2];
    legs[i].knee.reverse = servoReverse[i * 2];
    legs[i].knee.legId = i;
    legs[i].knee.isHip = false;
    
    // Initialize hip servo (odd pins: 1,3,5,7)
    legs[i].hip.pin = i * 2 + 1;
    legs[i].hip.trim = servoTrims[i * 2 + 1];
    legs[i].hip.reverse = servoReverse[i * 2 + 1];
    legs[i].hip.legId = i;
    legs[i].hip.isHip = true;
  }
}

void neutralPosition() {
  for (int i = 0; i < 4; i++) {
    legs[i].hip.setPosition(0);    // Straight up
    legs[i].knee.setPosition(0);   // Straight leg
  }
}

void loop() {
  // Update servos at regular intervals
  if (millis() - lastUpdate >= UPDATE_INTERVAL) {
    updateServos();
    lastUpdate = millis();
  }
  
  // Handle Serial commands
  handleSerialCommands();
}

void updateServos() {
  for (int i = 0; i < 4; i++) {
    legs[i].hip.moveServo(legs[i].hip.targetPos, 2.0);   // 2 degrees per update
    legs[i].knee.moveServo(legs[i].knee.targetPos, 2.0);
  }
}
void stand() {
  for (int i = 0; i < 4; i++) {
    legs[i].hip.setPosition(0);
    legs[i].knee.setPosition(45);  // Slight bend for stability
  }
}

void sit() {
  for (int i = 0; i < 4; i++) {
    legs[i].hip.setPosition(45);
    legs[i].knee.setPosition(30);
  }
}

void down() {
  legs[0].hip.setPosition(20);
  legs[1].hip.setPosition(20);  

  legs[2].hip.setPosition(20);
  legs[3].hip.setPosition(20);    
}


void walk() {
  // Simple alternating gait
  static int phase = 0;
  
  switch (phase) {
    case 0: // Lift front legs
      legs[0].knee.setPosition(60);  // Front left
      legs[1].knee.setPosition(60);  // Front right
      legs[2].knee.setPosition(30);  // Back left
      legs[3].knee.setPosition(30);  // Back right
      break;
      
    case 1: // Move forward
      legs[0].hip.setPosition(20);
      legs[1].hip.setPosition(20);
      legs[2].hip.setPosition(-20);
      legs[3].hip.setPosition(-20);
      break;
      
    case 2: // Lower front legs
      legs[0].knee.setPosition(30);
      legs[1].knee.setPosition(30);
      legs[2].knee.setPosition(60);
      legs[3].knee.setPosition(60);
      break;
      
    case 3: // Move back
      legs[0].hip.setPosition(-20);
      legs[1].hip.setPosition(-20);
      legs[2].hip.setPosition(20);
      legs[3].hip.setPosition(20);
      break;
  }
  
  phase = (phase + 1) % 4;
}

void handleSerialCommands() {
  if (Serial.available()) {
    char c = Serial.read();
    
    if (c == '\n' || c == '\r') {
      if (serialCommand.length() > 0) {
        serialCommand.trim();
        processCommand(serialCommand);
        serialCommand = "";
      }
    } else {
      serialCommand += c;
    }
  }
}

void processCommand(String command) {
  command.toLowerCase();
  
  if (command == "stand") {
    stand();
    Serial.println("Standing...");
  } 
  else if (command == "sit") {
    sit();
    Serial.println("Sitting...");
  }
  else if (command == "down") {
    down();
    Serial.println("Laying down...");
  }  
  else if (command == "walk") {
    walk();
    Serial.println("Walking...");
  }
  else if (command == "neutral") {
    neutralPosition();
    Serial.println("Neutral position...");
  }
  else if (command == "help") {
    showHelp();
  }
  else if (command.startsWith("leg")) {
    parseLegCommand(command);
  }
  else {
    Serial.println("Unknown command: " + command);
    Serial.println("Type 'help' for available commands");
  }
}

void showHelp() {
  Serial.println("\n=== RoboPuppy Commands ===");
  Serial.println("stand     - Make robot stand up");
  Serial.println("sit       - Make robot sit down");
  Serial.println("walk      - Start walking gait");
  Serial.println("neutral   - Return to neutral position");
  Serial.println("leg <0-3> <hip|knee> <angle> - Control individual joints");
  Serial.println("help      - Show this help message");
  Serial.println("\nExamples:");
  Serial.println("  leg 0 hip 45    - Move leg 0 hip to 45 degrees");
  Serial.println("  leg 1 knee -30  - Move leg 1 knee to -30 degrees");
  Serial.println("\nLeg mapping:");
  Serial.println("  Leg 0: Front Left  (servo 0=knee, servo 1=hip)");
  Serial.println("  Leg 1: Front Right (servo 2=knee, servo 3=hip)");
  Serial.println("  Leg 2: Back Left   (servo 4=knee, servo 5=hip)");
  Serial.println("  Leg 3: Back Right  (servo 6=knee, servo 7=hip)");
}

void parseLegCommand(String command) {
  // Parse commands like "leg 0 hip 45"
  int firstSpace = command.indexOf(' ');
  int secondSpace = command.indexOf(' ', firstSpace + 1);
  int thirdSpace = command.indexOf(' ', secondSpace + 1);
  
  if (firstSpace > 0 && secondSpace > 0 && thirdSpace > 0) {
    int legId = command.substring(firstSpace + 1, secondSpace).toInt();
    String joint = command.substring(secondSpace + 1, thirdSpace);
    float angle = command.substring(thirdSpace + 1).toFloat();
    
    if (legId >= 0 && legId < 4) {
      if (joint == "hip") {
        legs[legId].hip.setPosition(angle);
        Serial.println("Leg " + String(legId) + " hip set to " + String(angle) + " degrees");
      } else if (joint == "knee") {
        legs[legId].knee.setPosition(angle);
        Serial.println("Leg " + String(legId) + " knee set to " + String(angle) + " degrees");
      } else {
        Serial.println("Invalid joint. Use 'hip' or 'knee'");
      }
    } else {
      Serial.println("Invalid leg ID. Use 0-3");
    }
  } else {
    Serial.println("Invalid command format. Use: leg <0-3> <hip|knee> <angle>");
  }
}

