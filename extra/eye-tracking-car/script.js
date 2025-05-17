let bluetoothDevice, bleCharacteristic;

document.getElementById("connect").addEventListener("click", connectToBluetooth);
document.getElementById("speedSlider").addEventListener("input", updateSpeed);
document.getElementById("calibrate").addEventListener("click", calibrateWebGazer);
document.getElementById("clearCalibration").addEventListener("click", clearCalibration);

async function connectToBluetooth() {
    try {
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ["12345678-1234-5678-1234-56789abcdef0"],
        });
        const server = await bluetoothDevice.gatt.connect();
        const service = await server.getPrimaryService("12345678-1234-5678-1234-56789abcdef0");
        bleCharacteristic = await service.getCharacteristic("abcdef01-1234-5678-1234-56789abcdef0");
        updateStatus("Connected to ESP32 BLE");
    } catch (error) {
        console.error("Bluetooth Connection Failed", error);
    }
}

function updateSpeed(event) {
    const speed = event.target.value;
    document.getElementById("speedValue").textContent = speed;
    sendCommand(`V${speed}`);
}

function sendCommand(command) {
    if (bleCharacteristic) {
        let data = new TextEncoder().encode(command);
        document.getElementById('debug').textContent = `Debug: Sending "${command}"`;
        console.log(`Sending command: ${command}`);
        bleCharacteristic.writeValue(data)
            .then(() => {
                console.log(`Command sent successfully: ${command}`);
            })
            .catch(error => {
                console.error(`Error sending command: ${error}`);
                document.getElementById('debug').textContent = `Debug: Error sending "${command}": ${error}`;
            });
    } else {
        document.getElementById('debug').textContent = `Debug: Not connected, can't send "${command}"`;
        console.log(`Not connected, can't send: ${command}`);
    }
}

function processButtonGaze(buttonUnderGaze, timestamp) {
    const buttons = document.querySelectorAll(".button");
    if (buttonUnderGaze) {
        // Visual feedback for button under gaze
        highlightButton(buttonUnderGaze, buttons);
        
        // Update status to show which button is being looked at
        document.getElementById('status').textContent = `Status: Looking at ${buttonUnderGaze.id}`;
        
        if (currentButton === buttonUnderGaze) {
            if (!gazeStartTime) gazeStartTime = timestamp;
            const gazeDuration = timestamp - gazeStartTime;
            
            // Show progress
            if (gazeDuration > 200) {
                const progressPercent = Math.min(100, Math.round((gazeDuration / 1000) * 100));
                document.getElementById('status').textContent = `Status: Looking at ${buttonUnderGaze.id} (${progressPercent}%)`;
            }
            
            if (gazeDuration >= 1000) {
                executeGazeCommand(buttonUnderGaze);
            }
        } else {
            currentButton = buttonUnderGaze;
            gazeStartTime = timestamp;
        }
    } else {
        resetGazeState(buttons);
    }
}

function executeGazeCommand(buttonUnderGaze) {
    // Get the first letter of the ID and make it uppercase
    const command = buttonUnderGaze.id[0].toUpperCase();
    
    // Add visual feedback - make button "press" effect
    buttonUnderGaze.style.transform = "scale(0.95)";
    setTimeout(() => {
        buttonUnderGaze.style.transform = "";
    }, 200);
    
    document.getElementById('status').textContent = `Status: Activating ${buttonUnderGaze.id}`;
    console.log(`Activating command: ${command} from button ${buttonUnderGaze.id}`);
    
    // Send the command to the ESP32
    sendCommand(command);
    
    // Reset timer but keep tracking this button
    gazeStartTime = performance.now();
}

function calibrateWebGazer() {
    webgazer.clearData();
    webgazer.showPredictionPoints(true);
    alert("Look at each calibration point until it turns red.");
}

function clearCalibration() {
    webgazer.clearData();
    alert("Calibration data cleared!");
}

window.onload = function () {
    localStorage.clear();
    initializeWebGazer();
};

function initializeWebGazer() {
    let gazeStartTime = null;
    let currentButton = null;
    let eyesClosedStartTime = null;
    let isEyesClosed = false;

    webgazer.setGazeListener((data, timestamp) => {
        webgazer.params.showGazeDot = true;
        webgazer.params.gazeDotRadius = 1000;

        if (data === null || data.x === null || data.y === null) {
            handleEyesClosed(timestamp);
            return;
        }

        if (isEyesClosed) {
            resetEyesClosedStatus();
        }

        detectGazeOnButton(data.x, data.y, timestamp);
    })
    .begin();

    console.log("WebGazer initialized");
}

function handleEyesClosed(timestamp) {
    if (!eyesClosedStartTime) {
        eyesClosedStartTime = timestamp;
    } else if (timestamp - eyesClosedStartTime > 1000 && !isEyesClosed) {
        updateStatus("Eyes Closed - Stopping");
        isEyesClosed = true;
        sendCommand("S");
    }
}

function resetEyesClosedStatus() {
    updateStatus("Eyes Open");
    isEyesClosed = false;
    eyesClosedStartTime = null;
}

function detectGazeOnButton(x, y, timestamp) {
    const buttons = document.querySelectorAll(".button");
    let buttonUnderGaze = null;

    buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            buttonUnderGaze = button;
        }
    });

    processButtonGaze(buttonUnderGaze, timestamp);
}

function processButtonGaze(buttonUnderGaze, timestamp) {
    const buttons = document.querySelectorAll(".button");
    if (buttonUnderGaze) {
        if (currentButton === buttonUnderGaze) {
            if (!gazeStartTime) gazeStartTime = timestamp;
            if (timestamp - gazeStartTime >= 1000) {
                executeGazeCommand(buttonUnderGaze);
            }
        } else {
            currentButton = buttonUnderGaze;
            gazeStartTime = timestamp;
        }

        highlightButton(buttonUnderGaze, buttons);
    } else {
        resetGazeState(buttons);
    }
}

function executeGazeCommand(buttonUnderGaze) {
    const command = buttonUnderGaze.id[0].toUpperCase();
    updateStatus(`Activating "${buttonUnderGaze.textContent}"`);
    sendCommand(command);
    gazeStartTime = null;
}

function highlightButton(buttonUnderGaze, buttons) {
    buttons.forEach((btn) => btn.classList.remove("highlight"));
    buttonUnderGaze.classList.add("highlight");
}

function resetGazeState(buttons) {
    currentButton = null;
    gazeStartTime = null;
    buttons.forEach((btn) => btn.classList.remove("highlight"));
    updateStatus("Idle");
    sendCommand("S");
}

function updateStatus(message) {
    document.getElementById("status").textContent = `Status: ${message}`;
}
