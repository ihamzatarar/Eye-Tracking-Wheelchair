#include <Arduino.h>
#include <Arduino.h>
#ifdef ESP32
#include <WiFi.h>
#include <AsyncTCP.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#endif
#include <ESPAsyncWebServer.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#include "driver/ledc.h"

#include <iostream>
#include <sstream>

// BLE UUIDs - must match the ones in your JavaScript
#define SERVICE_UUID        "12345678-1234-5678-1234-56789abcdef0"
#define CHARACTERISTIC_UUID "abcdef01-1234-5678-1234-56789abcdef0"

// Ultrasonic sensor pins
#define TRIG_PIN 13
#define ECHO_PIN 12

// Braking and safety parameters (adjustable)
#define BRAKING_DURATION 120        // milliseconds to apply braking pulse
#define BRAKING_INTENSITY 60        // PWM intensity for braking (0-100%)
#define FORWARD_SAFETY_DISTANCE 30  // cm - stop if obstacle closer than this when moving forward
#define BACKWARD_SAFETY_DISTANCE 20 // cm - stop if obstacle closer than this when moving backward
#define EMERGENCY_STOP_DISTANCE 10  // cm - emergency stop regardless of direction
#define SENSOR_READ_INTERVAL 75     // milliseconds between distance measurements
#define MIN_BRAKING_INTERVAL 500    // minimum time between braking applications

// Movement states
enum WheelchairState {
  STOPPED,
  MOVING_FORWARD,
  MOVING_BACKWARD,
  MOVING_LEFT,
  MOVING_RIGHT,
  BRAKING_FROM_FORWARD,
  BRAKING_FROM_BACKWARD,
  EMERGENCY_STOP
};

// Global state variables
WheelchairState currentState = STOPPED;
WheelchairState lastMovementState = STOPPED;
unsigned long lastBrakingTime = 0;
unsigned long brakingStartTime = 0;
unsigned long lastSensorRead = 0;
float lastDistance = 999.0;
int currentSpeed = 150;
bool emergencyStopActive = false;

// Flag to track BLE connection status
bool deviceConnected = false;

struct MOTOR_PINS
{
  int pinEn;  
  int pinIN1;
  int pinIN2;    
};

std::vector<MOTOR_PINS> motorPins = {
  {22, 16, 17},  //RIGHT_MOTOR Pins (EnA, IN1, IN2)
  {23, 18, 19},  //LEFT_MOTOR  Pins (EnB, IN3, IN4)
};

// Function declarations
void moveCar(int direction);
void applyBraking(WheelchairState fromState);
void emergencyStop();
float getDistance();
bool isObstacleDetected(float distance, WheelchairState direction);
void checkObstacles();
bool isSafeToMove(int direction);
void updateMovementState(int direction);
void rotateMotorWithBraking(int motorNumber, int motorDirection, int intensity = -1);

#define UP 1
#define DOWN 2
#define LEFT 3
#define RIGHT 4
#define STOP 0

#define RIGHT_MOTOR 0
#define LEFT_MOTOR 1

#define FORWARD 1
#define BACKWARD -1

const int PWMFreq = 1000; /* 1 KHz */
const int PWMResolution = 8;
const int PWMSpeedChannel = 4;

const char* ssid     = "MyWheelchair";
const char* password = "87654321";

AsyncWebServer server(80);
AsyncWebSocket wsCarInput("/CarInput");

// BLE Server callbacks
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("BLE Client connected");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("BLE Client disconnected");
      // Start advertising again so client can reconnect
      pServer->getAdvertising()->start();
      // Safety - stop motors when BLE disconnects
      moveCar(STOP);
    }
};

// BLE Characteristic callbacks
class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string value = pCharacteristic->getValue();
      
      if (value.length() > 0) {
        Serial.print("BLE Command: ");
        Serial.println(value.c_str());
        
        char command = value[0];
        
        // Match command format and directly control motors
        switch(command) {
          case 'F':
            Serial.println("BLE Forward Command");
            moveCar(UP);
            break;
          case 'B':
            Serial.println("BLE Backward Command");
            moveCar(DOWN);
            break;
          case 'L':
            Serial.println("BLE Left Command");
            moveCar(LEFT);
            break;
          case 'R':
            Serial.println("BLE Right Command");
            moveCar(RIGHT);
            break;
          case 'S':
            Serial.println("BLE Stop Command");
            moveCar(STOP);
            break;
          case 'V':
            // Speed control (V followed by speed value)
            if (value.length() > 1) {
              int speed = atoi(value.substr(1).c_str());
              Serial.printf("BLE Setting speed to: %d\n", speed);
              currentSpeed = speed;
              ledcWrite(PWMSpeedChannel, speed);
            }
            break;
          default:
            Serial.printf("BLE Unknown command: %c\n", command);
            break;
        }
      }
    }
};

// Enhanced motor rotation function with braking support
void rotateMotorWithBraking(int motorNumber, int motorDirection, int intensity) {
  if (intensity == -1) {
    intensity = currentSpeed; // Use current speed if not specified
  }
  
  // Temporarily set PWM for braking if needed
  if (intensity != currentSpeed) {
    ledcWrite(PWMSpeedChannel, intensity);
  }
  
  if (motorDirection == FORWARD) {
    digitalWrite(motorPins[motorNumber].pinIN1, HIGH);
    digitalWrite(motorPins[motorNumber].pinIN2, LOW);    
  }
  else if (motorDirection == BACKWARD) {
    digitalWrite(motorPins[motorNumber].pinIN1, LOW);
    digitalWrite(motorPins[motorNumber].pinIN2, HIGH);     
  }
  else {
    digitalWrite(motorPins[motorNumber].pinIN1, LOW);
    digitalWrite(motorPins[motorNumber].pinIN2, LOW);       
  }
  
  // Restore normal speed if we changed it for braking
  if (intensity != currentSpeed) {
    delay(5); // Brief delay to ensure braking pulse is applied
    ledcWrite(PWMSpeedChannel, currentSpeed);
  }
}

void rotateMotor(int motorNumber, int motorDirection) {
  rotateMotorWithBraking(motorNumber, motorDirection, currentSpeed);
}

// Apply braking pulse based on previous movement direction
void applyBraking(WheelchairState fromState) {
  unsigned long now = millis();
  
  // Prevent rapid braking cycles
  if (now - lastBrakingTime < MIN_BRAKING_INTERVAL) {
    Serial.println("Braking cooldown active, skipping");
    return;
  }
  
  Serial.printf("Applying braking from state: %d\n", fromState);
  
  int brakingPWM = (currentSpeed * BRAKING_INTENSITY) / 100;
  brakingStartTime = now;
  lastBrakingTime = now;
  
  switch(fromState) {
    case MOVING_FORWARD:
      currentState = BRAKING_FROM_FORWARD;
      // Apply backward braking pulse
      rotateMotorWithBraking(RIGHT_MOTOR, BACKWARD, brakingPWM);
      rotateMotorWithBraking(LEFT_MOTOR, BACKWARD, brakingPWM);
      Serial.println("Applying forward braking (reverse pulse)");
      break;
      
    case MOVING_BACKWARD:
      currentState = BRAKING_FROM_BACKWARD;
      // Apply forward braking pulse
      rotateMotorWithBraking(RIGHT_MOTOR, FORWARD, brakingPWM);
      rotateMotorWithBraking(LEFT_MOTOR, FORWARD, brakingPWM);
      Serial.println("Applying backward braking (forward pulse)");
      break;
      
    default:
      // For turning movements, just stop immediately
      rotateMotor(RIGHT_MOTOR, STOP);
      rotateMotor(LEFT_MOTOR, STOP);
      currentState = STOPPED;
      break;
  }
}

// Emergency stop function
void emergencyStop() {
  Serial.println("EMERGENCY STOP ACTIVATED!");
  emergencyStopActive = true;
  currentState = EMERGENCY_STOP;
  
  // Immediate stop
  rotateMotor(RIGHT_MOTOR, STOP);
  rotateMotor(LEFT_MOTOR, STOP);
  
  // Brief braking pulse based on last movement
  if (lastMovementState == MOVING_FORWARD) {
    delay(10);
    int brakingPWM = (currentSpeed * BRAKING_INTENSITY) / 100;
    rotateMotorWithBraking(RIGHT_MOTOR, BACKWARD, brakingPWM);
    rotateMotorWithBraking(LEFT_MOTOR, BACKWARD, brakingPWM);
    delay(BRAKING_DURATION / 2); // Shorter emergency braking
    rotateMotor(RIGHT_MOTOR, STOP);
    rotateMotor(LEFT_MOTOR, STOP);
  } else if (lastMovementState == MOVING_BACKWARD) {
    delay(10);
    int brakingPWM = (currentSpeed * BRAKING_INTENSITY) / 100;
    rotateMotorWithBraking(RIGHT_MOTOR, FORWARD, brakingPWM);
    rotateMotorWithBraking(LEFT_MOTOR, FORWARD, brakingPWM);
    delay(BRAKING_DURATION / 2);
    rotateMotor(RIGHT_MOTOR, STOP);
    rotateMotor(LEFT_MOTOR, STOP);
  }
  
  currentState = STOPPED;
}

// Get distance from ultrasonic sensor
float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  
  if (duration == 0) {
    Serial.println("Ultrasonic sensor timeout");
    return 999.0; // Return large distance on timeout
  }
  
  float distance = (duration * 0.034) / 2;
  
  // Simple filtering - ignore readings that change too rapidly
  if (abs(distance - lastDistance) > 50 && lastDistance != 999.0) {
    Serial.printf("Filtering out erratic reading: %.1f (last: %.1f)\n", distance, lastDistance);
    return lastDistance;
  }
  
  lastDistance = distance;
  return distance;
}

// Check if obstacle detected for given direction
bool isObstacleDetected(float distance, WheelchairState direction) {
  if (distance >= 999.0) return false; // Sensor error, assume clear
  
  // Emergency stop distance - stop regardless of direction
  if (distance <= EMERGENCY_STOP_DISTANCE) {
    return true;
  }
  
  // Direction-specific safety distances
  switch(direction) {
    case MOVING_FORWARD:
      return distance <= FORWARD_SAFETY_DISTANCE;
    case MOVING_BACKWARD:
      return distance <= BACKWARD_SAFETY_DISTANCE;
    default:
      return false; // For turning, we're more lenient
  }
}

// Check for obstacles and take action
void checkObstacles() {
  unsigned long now = millis();
  
  // Don't check too frequently
  if (now - lastSensorRead < SENSOR_READ_INTERVAL) {
    return;
  }
  
  lastSensorRead = now;
  float distance = getDistance();
  
  Serial.printf("Distance: %.1f cm, State: %d\n", distance, currentState);
  
  // Check for emergency stop condition
  if (distance <= EMERGENCY_STOP_DISTANCE && currentState != STOPPED && currentState != EMERGENCY_STOP) {
    Serial.printf("Emergency stop triggered! Distance: %.1f cm\n", distance);
    emergencyStop();
    return;
  }
  
  // Check direction-specific obstacles
  if ((currentState == MOVING_FORWARD && distance <= FORWARD_SAFETY_DISTANCE) ||
      (currentState == MOVING_BACKWARD && distance <= BACKWARD_SAFETY_DISTANCE)) {
    
    Serial.printf("Obstacle detected! Distance: %.1f cm, stopping\n", distance);
    moveCar(STOP);
  }
  
  // Clear emergency stop if obstacle is cleared and we're stopped
  if (emergencyStopActive && distance > FORWARD_SAFETY_DISTANCE && currentState == STOPPED) {
    Serial.println("Obstacle cleared, emergency stop deactivated");
    emergencyStopActive = false;
  }
}

// Check if it's safe to move in given direction
bool isSafeToMove(int direction) {
  if (emergencyStopActive) {
    Serial.println("Emergency stop active, movement blocked");
    return false;
  }
  
  float distance = getDistance();
  
  switch(direction) {
    case UP: // Forward
      if (distance <= FORWARD_SAFETY_DISTANCE) {
        Serial.printf("Forward movement blocked, distance: %.1f cm\n", distance);
        return false;
      }
      break;
    case DOWN: // Backward  
      if (distance <= BACKWARD_SAFETY_DISTANCE) {
        Serial.printf("Backward movement blocked, distance: %.1f cm\n", distance);
        return false;
      }
      break;
    case LEFT:
    case RIGHT:
      // More lenient for turning, but still check emergency distance
      if (distance <= EMERGENCY_STOP_DISTANCE) {
        Serial.printf("Turn movement blocked, too close: %.1f cm\n", distance);
        return false;
      }
      break;
  }
  
  return true;
}

// Update movement state and handle transitions
void updateMovementState(int direction) {
  WheelchairState newState;
  
  switch(direction) {
    case UP:
      newState = MOVING_FORWARD;
      break;
    case DOWN:
      newState = MOVING_BACKWARD;
      break;
    case LEFT:
      newState = MOVING_LEFT;
      break;
    case RIGHT:
      newState = MOVING_RIGHT;
      break;
    default:
      newState = STOPPED;
      break;
  }
  
  // Store last movement state for braking reference
  if (currentState == MOVING_FORWARD || currentState == MOVING_BACKWARD || 
      currentState == MOVING_LEFT || currentState == MOVING_RIGHT) {
    lastMovementState = currentState;
  }
  
  currentState = newState;
}

// Enhanced moveCar function with braking and safety
void moveCar(int inputValue) {
  Serial.printf("Got movement command: %d, Current state: %d\n", inputValue, currentState);
  
  // Handle braking completion
  if ((currentState == BRAKING_FROM_FORWARD || currentState == BRAKING_FROM_BACKWARD) &&
      (millis() - brakingStartTime >= BRAKING_DURATION)) {
    Serial.println("Braking completed, fully stopping");
    rotateMotor(RIGHT_MOTOR, STOP);
    rotateMotor(LEFT_MOTOR, STOP);
    currentState = STOPPED;
  }
  
  // If we're currently braking, don't allow new movements until braking is complete
  if (currentState == BRAKING_FROM_FORWARD || currentState == BRAKING_FROM_BACKWARD) {
    if (inputValue != STOP) {
      Serial.println("Braking in progress, ignoring movement command");
      return;
    }
  }
  
  // Handle stop command - apply braking if we were moving
  if (inputValue == STOP) {
    if (currentState == MOVING_FORWARD || currentState == MOVING_BACKWARD) {
      applyBraking(currentState);
      return; // Braking will handle the final stop
    } else if (currentState == MOVING_LEFT || currentState == MOVING_RIGHT) {
      // For turning, just stop immediately
      rotateMotor(RIGHT_MOTOR, STOP);
      rotateMotor(LEFT_MOTOR, STOP);
      currentState = STOPPED;
      return;
    } else {
      // Already stopped or stopping
      rotateMotor(RIGHT_MOTOR, STOP);
      rotateMotor(LEFT_MOTOR, STOP);
      currentState = STOPPED;
      return;
    }
  }
  
  // Check safety before allowing movement
  if (!isSafeToMove(inputValue)) {
    Serial.println("Movement blocked for safety");
    return;
  }
  
  // Update state
  updateMovementState(inputValue);
  
  // Execute movement
  switch(inputValue) {
    case UP:
      rotateMotor(RIGHT_MOTOR, FORWARD);
      rotateMotor(LEFT_MOTOR, FORWARD);                  
      break;
  
    case DOWN:
      rotateMotor(RIGHT_MOTOR, BACKWARD);
      rotateMotor(LEFT_MOTOR, BACKWARD);  
      break;
  
    case LEFT:
      rotateMotor(RIGHT_MOTOR, FORWARD);
      rotateMotor(LEFT_MOTOR, BACKWARD);  
      break;
  
    case RIGHT:
      rotateMotor(RIGHT_MOTOR, BACKWARD);
      rotateMotor(LEFT_MOTOR, FORWARD); 
      break;
 
    default:
      rotateMotor(RIGHT_MOTOR, STOP);
      rotateMotor(LEFT_MOTOR, STOP);
      currentState = STOPPED;
      break;
  }
}

// Original HTML page (unchanged)
const char* htmlHomePage PROGMEM = R"HTMLHOMEPAGE(
<!DOCTYPE html>
<html>
  <head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    h1, h2 {
      color: teal;
      text-align: center;
      margin-bottom: 10px;
    }
    
    .control-container {
      max-width: 450px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .arrows {
      font-size: 40px;
      color: white;
    }
    
    td.button {
      background-color: #2c3e50;
      border-radius: 25%;
      box-shadow: 5px 5px #888888;
      width: 80px;
      height: 80px;
      text-align: center;
      vertical-align: middle;
      cursor: pointer;
    }
    
    td.button:active {
      transform: translate(5px,5px);
      box-shadow: none; 
    }
    
    td.button:hover {
      background-color: #3498db;
    }
    
    .slidecontainer {
      width: 100%;
      margin-top: 10px;
    }
    
    .slider {
      -webkit-appearance: none;
      width: 100%;
      height: 20px;
      border-radius: 10px;
      background: #d3d3d3;
      outline: none;
      opacity: 0.7;
      -webkit-transition: .2s;
      transition: opacity .2s;
    }
    
    .slider:hover {
      opacity: 1;
    }
  
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 35px;
      height: 35px;
      border-radius: 50%;
      background: #3498db;
      cursor: pointer;
    }
    
    .slider::-moz-range-thumb {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      background: #3498db;
      cursor: pointer;
    }
    
    .status-indicator {
      text-align: center;
      padding: 10px;
      margin: 10px 0;
      border-radius: 5px;
      font-weight: bold;
    }
    
    .connected {
      background-color: #dff0d8;
      color: #3c763d;
    }
    
    .disconnected {
      background-color: #f2dede;
      color: #a94442;
    }
    
    .speed-display {
      text-align: center;
      font-size: 20px;
      margin: 10px 0;
    }
    
    .tab {
      overflow: hidden;
      border: 1px solid #ccc;
      background-color: #f1f1f1;
      border-radius: 5px 5px 0 0;
    }
    
    .tab button {
      background-color: inherit;
      float: left;
      border: none;
      outline: none;
      cursor: pointer;
      padding: 14px 16px;
      transition: 0.3s;
      font-size: 17px;
      width: 50%;
    }
    
    .tab button:hover {
      background-color: #ddd;
    }
    
    .tab button.active {
      background-color: #3498db;
      color: white;
    }
    
    .connection-info {
      margin-top: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    
    .noselect {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    </style>
  
  </head>
  <body class="noselect">
    <div class="control-container">
      <h1>Wheelchair Control</h1>
      
      <div class="tab">
        <button class="tablinks active" onclick="openControlMethod(event, 'WiFiControl')">WiFi Control</button>
        <button class="tablinks" onclick="openControlMethod(event, 'BLEInfo')">BLE Info</button>
      </div>
      
      <div id="WiFiControl" class="tabcontent" style="display:block">
        <div id="connection-status" class="status-indicator">Connecting...</div>
        
        <table id="mainTable" style="width:100%;margin:auto;table-layout:fixed" CELLSPACING=10>
          <tr>
            <td></td>
            <td class="button" ontouchstart='sendButtonInput("MoveCar","1")' ontouchend='sendButtonInput("MoveCar","0")' 
                onmousedown='sendButtonInput("MoveCar","1")' onmouseup='sendButtonInput("MoveCar","0")'
                onmouseleave='sendButtonInput("MoveCar","0")'>
              <span class="arrows">&#8679;</span>
            </td>
            <td></td>
          </tr>
          <tr>
            <td class="button" ontouchstart='sendButtonInput("MoveCar","3")' ontouchend='sendButtonInput("MoveCar","0")'
                onmousedown='sendButtonInput("MoveCar","3")' onmouseup='sendButtonInput("MoveCar","0")'
                onmouseleave='sendButtonInput("MoveCar","0")'>
              <span class="arrows">&#8678;</span>
            </td>
            <td class="button" ontouchstart='sendButtonInput("MoveCar","0")' onmousedown='sendButtonInput("MoveCar","0")'>
              <span class="arrows">⏹</span>
            </td>    
            <td class="button" ontouchstart='sendButtonInput("MoveCar","4")' ontouchend='sendButtonInput("MoveCar","0")'
                onmousedown='sendButtonInput("MoveCar","4")' onmouseup='sendButtonInput("MoveCar","0")'
                onmouseleave='sendButtonInput("MoveCar","0")'>
              <span class="arrows">&#8680;</span>
            </td>
          </tr>
          <tr>
            <td></td>
            <td class="button" ontouchstart='sendButtonInput("MoveCar","2")' ontouchend='sendButtonInput("MoveCar","0")'
                onmousedown='sendButtonInput("MoveCar","2")' onmouseup='sendButtonInput("MoveCar","0")'
                onmouseleave='sendButtonInput("MoveCar","0")'>
              <span class="arrows">&#8681;</span>
            </td>
            <td></td>
          </tr>
        </table>
        
        <div class="speed-display">
          <span>Speed: </span><span id="speedValue">150</span>
        </div>
        
        <div class="slidecontainer">
          <input type="range" min="0" max="255" value="150" class="slider" id="Speed" oninput='updateSpeed(this.value)'>
        </div>
      </div>
      
      <div id="BLEInfo" class="tabcontent" style="display:none">
        <h2>Bluetooth Control Information</h2>
        <p>To connect via Bluetooth:</p>
        <ol>
          <li>Open your BLE-enabled application</li>
          <li>Connect to device "ESP32Wheelchair"</li>
          <li>Use the following commands:
            <ul>
              <li><strong>F</strong> - Forward</li>
              <li><strong>B</strong> - Backward</li>
              <li><strong>L</strong> - Left</li>
              <li><strong>R</strong> - Right</li>
              <li><strong>S</strong> - Stop</li>
              <li><strong>V</strong>+number - Set speed (0-255)</li>
            </ul>
          </li>
        </ol>
        <p>Example: "V200" sets speed to 200</p>
      </div>
      
      <div class="connection-info">
        <p>WiFi SSID: MyWheelchair</p>
      </div>
    </div>
  
    <script>
      var webSocketCarInputUrl = "ws:\/\/" + window.location.hostname + "/CarInput";      
      var websocketCarInput;
      var reconnectInterval;
      var currentSpeed = 150;
      
      function initCarInputWebSocket() 
      {
        clearInterval(reconnectInterval);
        updateConnectionStatus("Connecting...", "pending");
        
        websocketCarInput = new WebSocket(webSocketCarInputUrl);
        
        websocketCarInput.onopen = function(event)
        {
          updateConnectionStatus("Connected", "connected");
          sendButtonInput("Speed", currentSpeed);
        };
        
        websocketCarInput.onclose = function(event){
          updateConnectionStatus("Disconnected - Reconnecting...", "disconnected");
          reconnectInterval = setTimeout(initCarInputWebSocket, 2000);
        };
        
        websocketCarInput.onerror = function(event){
          updateConnectionStatus("Connection Error", "disconnected");
        };
        
        websocketCarInput.onmessage = function(event){};        
      }
      
      function updateConnectionStatus(message, status) {
        var statusDiv = document.getElementById("connection-status");
        statusDiv.innerText = message;
        statusDiv.className = "status-indicator " + status;
      }
      
      function updateSpeed(value) {
        currentSpeed = value;
        document.getElementById("speedValue").innerText = value;
        sendButtonInput("Speed", value);
      }
      
      function sendButtonInput(key, value) 
      {
        if (websocketCarInput && websocketCarInput.readyState === WebSocket.OPEN) {
          var data = key + "," + value;
          websocketCarInput.send(data);
        }
      }
      
      function openControlMethod(evt, methodName) {
        var i, tabcontent, tablinks;
        
        // Hide all tab content
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
          tabcontent[i].style.display = "none";
        }
        
        // Remove active class from all tab buttons
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
          tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        
        // Show current tab and add active class to button
        document.getElementById(methodName).style.display = "block";
        evt.currentTarget.className += " active";
      }
    
      window.onload = function() {
        initCarInputWebSocket();
        
        // Prevent scrolling when touching the control buttons
        document.getElementById("mainTable").addEventListener("touchmove", function(event){
          event.preventDefault();
        });
        
        // Set initial speed value
        document.getElementById("Speed").value = currentSpeed;
        document.getElementById("speedValue").innerText = currentSpeed;
      };
    </script>
  </body>    
</html>
)HTMLHOMEPAGE";

void handleRoot(AsyncWebServerRequest *request) 
{
  request->send_P(200, "text/html", htmlHomePage);
}

void handleNotFound(AsyncWebServerRequest *request) 
{
    request->send(404, "text/plain", "File Not Found");
}

void onCarInputWebSocketEvent(AsyncWebSocket *server, 
                      AsyncWebSocketClient *client, 
                      AwsEventType type,
                      void *arg, 
                      uint8_t *data, 
                      size_t len) 
{                      
  switch (type) 
  {
    case WS_EVT_CONNECT:
      Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("WebSocket client #%u disconnected\n", client->id());
      moveCar(STOP);
      break;
    case WS_EVT_DATA:
      AwsFrameInfo *info;
      info = (AwsFrameInfo*)arg;
      if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) 
      {
        std::string myData = "";
        myData.assign((char *)data, len);
        std::istringstream ss(myData);
        std::string key, value;
        std::getline(ss, key, ',');
        std::getline(ss, value, ',');
        Serial.printf("Key [%s] Value[%s]\n", key.c_str(), value.c_str()); 
        int valueInt = atoi(value.c_str());     
        if (key == "MoveCar")
        {
          moveCar(valueInt);        
        }
        else if (key == "Speed")
        {
          currentSpeed = valueInt;
          ledcWrite(PWMSpeedChannel, valueInt);
        }
      }
      break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
      break;
    default:
      break;  
  }
}

void setUpPinModes()
{
  //Set up PWM
  ledcSetup(PWMSpeedChannel, PWMFreq, PWMResolution);
      
  for (int i = 0; i < motorPins.size(); i++)
  {
    pinMode(motorPins[i].pinEn, OUTPUT);    
    pinMode(motorPins[i].pinIN1, OUTPUT);
    pinMode(motorPins[i].pinIN2, OUTPUT);  

    /* Attach the PWM Channel to the motor enb Pin */
    ledcAttachPin(motorPins[i].pinEn, PWMSpeedChannel);
  }
  
  // Set up ultrasonic sensor pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  Serial.println("Ultrasonic sensor initialized on pins 13 (trig) and 12 (echo)");
  
  moveCar(STOP);
}

// Setup BLE Server
void setupBLE() {
  BLEDevice::init("ESP32Wheelchair");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  BLECharacteristic *pCharacteristic = pService->createCharacteristic(
                                         CHARACTERISTIC_UUID,
                                         BLECharacteristic::PROPERTY_READ |
                                         BLECharacteristic::PROPERTY_WRITE |
                                         BLECharacteristic::PROPERTY_NOTIFY
                                       );
  
  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());
  
  pService->start();
  
  // Start advertising
  pServer->getAdvertising()->start();
  Serial.println("BLE Advertising started");
}

void setup(void) 
{
  Serial.begin(115200);
  setUpPinModes();

  // Initialize motor speed to a default value
  currentSpeed = 150;
  ledcWrite(PWMSpeedChannel, currentSpeed);
  Serial.println("Motor speed initialized to 150");
  
  // Test ultrasonic sensor
  Serial.println("Testing ultrasonic sensor...");
  float testDistance = getDistance();
  Serial.printf("Initial distance reading: %.1f cm\n", testDistance);

  WiFi.softAP(ssid, password);
  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);

  // Setup web server
  server.on("/", HTTP_GET, handleRoot);
  server.onNotFound(handleNotFound);
      
  wsCarInput.onEvent(onCarInputWebSocketEvent);
  server.addHandler(&wsCarInput);

  server.begin();
  Serial.println("HTTP server started");

  // Setup BLE server
  setupBLE();
  Serial.println("BLE server started");
  
  Serial.println("=== Enhanced Wheelchair Control System Ready ===");
  Serial.println("Features enabled:");
  Serial.println("- Active braking system");
  Serial.println("- Ultrasonic obstacle detection");
  Serial.println("- Emergency stop functionality");
  Serial.printf("- Safety distances: Forward=%dcm, Backward=%dcm\n", 
                FORWARD_SAFETY_DISTANCE, BACKWARD_SAFETY_DISTANCE);
}

void loop() 
{
  // Handle braking completion
  if ((currentState == BRAKING_FROM_FORWARD || currentState == BRAKING_FROM_BACKWARD) &&
      (millis() - brakingStartTime >= BRAKING_DURATION)) {
    Serial.println("Braking duration completed, stopping motors");
    rotateMotor(RIGHT_MOTOR, STOP);
    rotateMotor(LEFT_MOTOR, STOP);
    currentState = STOPPED;
  }
  
  // Check for obstacles
  checkObstacles();
  
  // Clean up WebSocket connections
  wsCarInput.cleanupClients();
  
  // BLE events are handled via callbacks, no polling needed
}