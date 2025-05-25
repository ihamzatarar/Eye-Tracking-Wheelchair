# GazeWheel: Gaze-Tracking Wheelchair Control System

## Introduction

GazeWheel is an innovative web application that enables hands-free wheelchair control using gaze-tracking technology. Designed for users with limited mobility, it leverages modern web technologies to provide a safe, accessible, and customizable control interface for powered wheelchairs.

- **Target Users:** Individuals with motor impairments, caregivers, and researchers in accessibility tech.
- **Key Use Cases:** Independent mobility, assistive technology research, and accessible UI prototyping.

---

## Features (Technical Overview)

- **Gaze Tracking:** Uses [WebGazer.js](https://webgazer.cs.brown.edu/) for real-time eye tracking. Calibration ensures accuracy for each user.
- **Bluetooth Connectivity:** Utilizes the Web Bluetooth API to connect and send commands to compatible wheelchairs or devices (e.g., ESP32-based controllers).
- **Wheelchair Control:** Supports both gaze-based and manual control. Safety features include emergency stop and speed regulation.
- **Accessibility:** Fully keyboard navigable, screen reader friendly, and high-contrast UI.
- **Settings:** User preferences for speed, calibration, and device management.
- **Support:** Integrated help center (opens email to support), contact info, and documentation.

---

## Architecture Overview

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS
- **State Management:** React Context API (Bluetooth state)
- **Gaze Tracking:** WebGazer.js (loaded dynamically)
- **Bluetooth:** Web Bluetooth API (service/characteristic UUIDs configurable)
- **Routing:** React Router DOM

**Main Flows:**

1. **Calibration:** User calibrates gaze tracking for accuracy.
2. **Bluetooth Connection:** User connects to a wheelchair/device.
3. **Control:** User operates the wheelchair via gaze or manual controls.

---

## Folder & File Structure

```
src/
  components/         # UI components (Navbar, Footer, Layout, etc.)
  context/            # React Context providers (BluetoothContext)
  pages/              # Main app pages (Welcome, Calibration, Bluetooth, etc.)
  utils/              # Utility functions (webgazer setup, theme, etc.)
  index.css           # Global styles
  App.tsx             # Main app component and routing
  main.tsx            # App entry point
```

---

## Main Components & Pages

- **App.tsx:** Sets up routing and wraps the app in BluetoothProvider.
- **Layout.tsx:** Main layout with Navbar, Footer, and content outlet.
- **Navbar.tsx:** Responsive navigation bar with links to all main pages.
- **Footer.tsx:** Contact info, social/profile links, and support/help options.
- **BluetoothContext.tsx:** Manages Bluetooth device connection state and exposes connection methods.
- **webgazerSetup.ts:** Handles loading, initializing, and cleaning up WebGazer.js for gaze tracking.

### Pages

- **WelcomePage:** Introduction and overview.
- **CalibrationPage & CalibrationProcessPage:** Guides the user through gaze calibration, accuracy measurement, and error handling.
- **BluetoothPage:** Device discovery, connection, and command sending. Handles connection errors and device state.
- **GazeTrackingPage:** Main interface for gaze-based wheelchair control. Explains safety and usage.
- **WheelchairControlPage:** Direct control interface, processes gaze data and sends commands to the wheelchair.
- **SettingsPage:** User preferences and device settings.
- **NotFoundPage:** 404 error page.

---

## Gaze Tracking System

- **Calibration:**
  - User clicks on calibration points on the screen.
  - System collects gaze data and computes accuracy.
  - If accuracy is insufficient, user can recalibrate.
- **Gaze Mapping:**
  - Gaze coordinates are mapped to UI regions (forward, left, right, stop, etc.).
  - Dwell time (how long the user looks at a region) is used to trigger commands.
- **Error Handling:**
  - If gaze data is lost or inaccurate, the system prompts for recalibration.
  - Emergency stop is always available.

---

## Bluetooth System

- **Device Discovery:**
  - Uses `navigator.bluetooth.requestDevice` with service UUIDs.
  - Lists available devices and allows user to select and connect.
- **Connection:**
  - Connects to GATT server, retrieves service and characteristic.
  - Updates context state for use throughout the app.
- **Command Sending:**
  - Commands (e.g., 'F' for forward, 'L' for left) are sent as encoded strings.
  - Speed and stop commands are supported.
- **Error Handling:**
  - Handles connection errors, disconnections, and reconnection attempts.

---

## Wheelchair Control Logic

- **Gaze-Based Control:**
  - User's gaze direction is mapped to movement commands.
  - Dwell time triggers command (e.g., look left for 1s to turn left).
  - Looking at the center or away from controls stops the wheelchair.
- **Manual Override:**
  - Physical controls and emergency stop are always available.
- **Safety Features:**
  - Emergency stop via UI and hardware button.
  - Speed limits and brake timeouts.

---

## Accessibility Features

- **Keyboard Navigation:** All interactive elements are keyboard accessible.
- **Screen Reader Support:** ARIA labels and roles are used where appropriate.
- **Visual Accessibility:** High-contrast color scheme, large touch targets, and responsive design.

---

## Setup & Development

### Prerequisites

- Node.js (v16+ recommended)
- npm
- Supported browser (Chrome recommended for Web Bluetooth)

### Installation

```bash
git clone <repo-url>
cd <repo-directory>
npm install
```

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Linting & Formatting

```bash
npm run lint
```

---

## Extending the App

- **Adding New Commands/Devices:**
  - Update BluetoothPage and WheelchairControlPage with new command logic.
  - Update service/characteristic UUIDs as needed.
- **Customizing Calibration:**
  - Modify calibration logic in CalibrationProcessPage and webgazerSetup.ts.
- **Theming:**
  - Edit Tailwind config and index.css for custom themes.

---

## Troubleshooting & FAQ

- **Web Bluetooth not working?**
  - Make sure you are using Chrome and have enabled Bluetooth permissions.
- **Gaze tracking inaccurate?**
  - Recalibrate using the Calibration page. Ensure good lighting and camera position.
- **Device not connecting?**
  - Ensure the device is powered on and in range. Try disconnecting and reconnecting.
- **App crashes or freezes?**
  - Check the browser console for errors. Restart the app and try again.

---

## Contact & Support

- **Email:** ihamzatarar@gmail.com
- **Phone:** +92 325 5525557
- **Address:** Forman Christian College, Ferozepur Road, Lahore 54600
- **Portfolio:** https://ihamzatarar.github.io/portfolio/
- **GitHub:** https://github.com/ihamzatarar
- **LinkedIn:** https://www.linkedin.com/in/hamza-tarar/
- **Twitter:** https://x.com/ihamzatarar

---

## License

This project is for educational and accessibility research purposes.
