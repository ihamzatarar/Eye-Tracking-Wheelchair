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

// HTML Page
const char htmlHomePage[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
        .arrows {
            font-size: 40px;
            color: #0c6bb5;
            background-color: #e2e2e2;
            padding: 20px;
            border-radius: 10px;
            user-select: none;
            cursor: pointer;
        }
        .arrows:active {
            background-color: #b5b5b5;
        }
        .stop {
            font-size: 40px;
            color: white;
            background-color: red;
            padding: 20px;
            border-radius: 10px;
            user-select: none;
            cursor: pointer;
        }
        .stop:active {
            background-color: darkred;
        }
        .slidecontainer {
            width: 100%;
            margin-top: 20px;
        }
        .slider {
            -webkit-appearance: none;
            width: 100%;
            height: 15px;
            border-radius: 5px;
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
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background: #0c6bb5;
            cursor: pointer;
        }
        .slider::-moz-range-thumb {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background: #0c6bb5;
            cursor: pointer;
        }
        .grid-container {
            display: grid;
            grid-template-columns: auto auto auto;
            padding: 10px;
            gap: 10px;
            justify-content: center;
        }
    </style>
</head>
<body style="text-align: center; font-family: Arial;">
    <h1>Wheelchair Control</h1>
    <div class="grid-container">
        <div></div>
        <div class="arrows" ontouchstart="sendCommand('MoveCar','1')" ontouchend="sendCommand('MoveCar','0')" 
             onmousedown="sendCommand('MoveCar','1')" onmouseup="sendCommand('MoveCar','0')">&#8679;</div>
        <div></div>
        <div class="arrows" ontouchstart="sendCommand('MoveCar','3')" ontouchend="sendCommand('MoveCar','0')"
             onmousedown="sendCommand('MoveCar','3')" onmouseup="sendCommand('MoveCar','0')">&#8678;</div>
        <div class="stop" ontouchstart="sendCommand('MoveCar','0')" ontouchend="sendCommand('MoveCar','0')"
             onmousedown="sendCommand('MoveCar','0')" onmouseup="sendCommand('MoveCar','0')">&#9632;</div>
        <div class="arrows" ontouchstart="sendCommand('MoveCar','4')" ontouchend="sendCommand('MoveCar','0')"
             onmousedown="sendCommand('MoveCar','4')" onmouseup="sendCommand('MoveCar','0')">&#8680;</div>
        <div></div>
        <div class="arrows" ontouchstart="sendCommand('MoveCar','2')" ontouchend="sendCommand('MoveCar','0')"
             onmousedown="sendCommand('MoveCar','2')" onmouseup="sendCommand('MoveCar','0')">&#8681;</div>
        <div></div>
    </div>
    <div class="slidecontainer">
        <p>Speed Control:</p>
        <input type="range" min="0" max="255" value="150" class="slider" id="speedSlider" 
               oninput="sendCommand('Speed', this.value)">
    </div>
    <script>
        var webSocket = new WebSocket('ws://' + window.location.hostname + '/CarInput');
        webSocket.onopen = function(event) {
            console.log('WebSocket connection established');
        };
        webSocket.onclose = function(event) {
            console.log('WebSocket connection closed');
        };
        webSocket.onerror = function(event) {
            console.log('WebSocket error: ', event);
        };
        function sendCommand(key, value) {
            var data = key + "," + value;
            webSocket.send(data);
        }
    </script>
</body>
</html>
)rawliteral";

// BLE UUIDs - must match the ones in your JavaScript
#define SERVICE_UUID "12345678-1234-5678-1234-56789abcdef0"
#define CHARACTERISTIC_UUID "abcdef01-1234-5678-1234-56789abcdef0"

// Movement and Motor Control Constants
#define UP 1
#define DOWN 2
#define LEFT 3
#define RIGHT 4
#define STOP 0
#define BRAKE 5             // New state for braking
#define ACTIVE_BRAKE 6      // For stronger braking
#define COMMAND_TIMEOUT 500 // 500ms timeout for commands

#define RIGHT_MOTOR 0
#define LEFT_MOTOR 1
#define FORWARD 1
#define BACKWARD -1

// Function prototypes - declare these at the start
void moveCar(int direction);
void rotateMotor(int motorNumber, int motorDirection);

// Global Variables
bool deviceConnected = false;
unsigned long lastCommandTime = 0;
bool isMoving = false;
int currentDirection = STOP;

// PWM Configuration
const int PWMFreq = 1000; /* 1 KHz */
const int PWMResolution = 8;
const int PWMSpeedChannel = 4;

// WiFi Configuration
const char *ssid = "MyWheelchair";
const char *password = "87654321";

// Motor Pin Structure
struct MOTOR_PINS
{
  int pinEn;
  int pinIN1;
  int pinIN2;
};

std::vector<MOTOR_PINS> motorPins = {
    {22, 16, 17}, // RIGHT_MOTOR Pins (EnA, IN1, IN2)
    {23, 18, 19}, // LEFT_MOTOR  Pins (EnB, IN3, IN4)
};

AsyncWebServer server(80);
AsyncWebSocket wsCarInput("/CarInput");

// Motor Control Functions - implement these first
void rotateMotor(int motorNumber, int motorDirection)
{
  switch (motorDirection)
  {
  case FORWARD:
    digitalWrite(motorPins[motorNumber].pinIN1, HIGH);
    digitalWrite(motorPins[motorNumber].pinIN2, LOW);
    break;

  case BACKWARD:
    digitalWrite(motorPins[motorNumber].pinIN1, LOW);
    digitalWrite(motorPins[motorNumber].pinIN2, HIGH);
    break;

  case BRAKE:
    // Active braking by shorting motor terminals
    digitalWrite(motorPins[motorNumber].pinIN1, HIGH);
    digitalWrite(motorPins[motorNumber].pinIN2, HIGH);
    break;

  case STOP:
  default:
    // Coast to stop
    digitalWrite(motorPins[motorNumber].pinIN1, LOW);
    digitalWrite(motorPins[motorNumber].pinIN2, LOW);
    break;
  }
}

void moveCar(int inputValue)
{
  Serial.printf("Got value as %d\n", inputValue);

  // Update command timing
  lastCommandTime = millis();

  switch (inputValue)
  {
  case UP:
    rotateMotor(RIGHT_MOTOR, FORWARD);
    rotateMotor(LEFT_MOTOR, FORWARD);
    isMoving = true;
    currentDirection = UP;
    break;

  case DOWN:
    rotateMotor(RIGHT_MOTOR, BACKWARD);
    rotateMotor(LEFT_MOTOR, BACKWARD);
    isMoving = true;
    currentDirection = DOWN;
    break;

  case LEFT:
    rotateMotor(RIGHT_MOTOR, FORWARD);
    rotateMotor(LEFT_MOTOR, BACKWARD);
    isMoving = true;
    currentDirection = LEFT;
    break;

  case RIGHT:
    rotateMotor(RIGHT_MOTOR, BACKWARD);
    rotateMotor(LEFT_MOTOR, FORWARD);
    isMoving = true;
    currentDirection = RIGHT;
    break;

  case BRAKE:
    rotateMotor(RIGHT_MOTOR, BRAKE);
    rotateMotor(LEFT_MOTOR, BRAKE);
    isMoving = false;
    currentDirection = STOP;
    break;

  case STOP:
  default:
    rotateMotor(RIGHT_MOTOR, STOP);
    rotateMotor(LEFT_MOTOR, STOP);
    isMoving = false;
    currentDirection = STOP;
    break;
  }
}

// BLE Server Callbacks
class MyServerCallbacks : public BLEServerCallbacks
{
  void onConnect(BLEServer *pServer)
  {
    deviceConnected = true;
    Serial.println("BLE Client connected");
  };

  void onDisconnect(BLEServer *pServer)
  {
    deviceConnected = false;
    Serial.println("BLE Client disconnected");
    pServer->getAdvertising()->start();
    moveCar(BRAKE); // Apply brake first
    delay(100);     // Brief brake application
    moveCar(STOP);  // Then go to stop state
  }
};

// BLE Characteristic Callbacks
class MyCallbacks : public BLECharacteristicCallbacks
{
  void onWrite(BLECharacteristic *pCharacteristic)
  {
    std::string value = pCharacteristic->getValue();

    if (value.length() > 0)
    {
      Serial.print("BLE Command: ");
      Serial.println(value.c_str());

      char command = value[0];

      switch (command)
      {
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
        moveCar(BRAKE); // Apply brake first
        delay(100);     // Brief brake application
        moveCar(STOP);  // Then go to stop state
        break;
      case 'V':
        if (value.length() > 1)
        {
          int speed = atoi(value.substr(1).c_str());
          Serial.printf("BLE Setting speed to: %d\n", speed);
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

// Web Server Request Handlers
void handleRoot(AsyncWebServerRequest *request)
{
  request->send_P(200, "text/html", htmlHomePage);
}

void handleNotFound(AsyncWebServerRequest *request)
{
  request->send(404, "text/plain", "File Not Found");
}

// WebSocket Event Handler
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
    moveCar(BRAKE); // Apply brake first
    delay(100);     // Brief brake application
    moveCar(STOP);  // Then go to stop state
    break;
  case WS_EVT_DATA:
    AwsFrameInfo *info;
    info = (AwsFrameInfo *)arg;
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
        if (valueInt == 0)
        {
          moveCar(BRAKE); // Apply brake first
          delay(100);     // Brief brake application
          moveCar(STOP);  // Then go to stop state
        }
        else
        {
          moveCar(valueInt);
        }
      }
      else if (key == "Speed")
      {
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

// Setup Functions
void setUpPinModes()
{
  // Set up PWM
  ledcSetup(PWMSpeedChannel, PWMFreq, PWMResolution);

  for (int i = 0; i < motorPins.size(); i++)
  {
    pinMode(motorPins[i].pinEn, OUTPUT);
    pinMode(motorPins[i].pinIN1, OUTPUT);
    pinMode(motorPins[i].pinIN2, OUTPUT);

    /* Attach the PWM Channel to the motor enb Pin */
    ledcAttachPin(motorPins[i].pinEn, PWMSpeedChannel);
  }
  moveCar(STOP);
}

void setupBLE()
{
  BLEDevice::init("ESP32Wheelchair");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  BLECharacteristic *pCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_WRITE |
          BLECharacteristic::PROPERTY_NOTIFY);

  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());

  pService->start();

  pServer->getAdvertising()->start();
  Serial.println("BLE Advertising started");
}

void setup(void)
{
  setUpPinModes();
  Serial.begin(115200);

  // Initialize motor speed to a default value
  ledcWrite(PWMSpeedChannel, 150);
  Serial.println("Motor speed initialized to 150");

  WiFi.softAP(ssid, password);
  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);

  server.on("/", HTTP_GET, handleRoot);
  server.onNotFound(handleNotFound);

  wsCarInput.onEvent(onCarInputWebSocketEvent);
  server.addHandler(&wsCarInput);

  server.begin();
  Serial.println("HTTP server started");

  setupBLE();
  Serial.println("BLE server started");
}

void loop()
{
  wsCarInput.cleanupClients();

  // Check for command timeout
  if (isMoving && (millis() - lastCommandTime > COMMAND_TIMEOUT))
  {
    // No command received for COMMAND_TIMEOUT ms, apply brakes
    moveCar(BRAKE);
    // After braking, go to STOP state
    delay(100); // Brief brake application
    moveCar(STOP);
  }
}