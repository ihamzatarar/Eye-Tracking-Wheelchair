import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftCircle, Bluetooth, Settings2, Trash2, Maximize, Minimize } from 'lucide-react';
import { useBluetooth } from '../context/BluetoothContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../components/ui/alert-dialog";

interface GazeData {
  x: number;
  y: number;
  confidence: number;
}

interface CustomWebGazer {
  begin: () => void;
  end: () => void;
  setGazeListener: (callback: (data: GazeData | null, timestamp: number) => void) => void;
  showPredictionPoints: (show: boolean) => void;
  showVideo: (show: boolean) => void;
  setCamera: (cameraId: string) => void;
  clearData: () => void;
}

declare global {
  interface Window {
    customWebGazer: CustomWebGazer;
  }
}

const WheelchairControlPage: React.FC = () => {
  const { isConnected, bleDevice, bleCharacteristic, setConnectionState } = useBluetooth();
  const [currentDirection, setCurrentDirection] = useState<string | null>(null);
  const [isBraking, setIsBraking] = useState(false);
  const [hasBackCamera, setHasBackCamera] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(50);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const webgazerStarted = useRef(false);
  const webgazerScript = useRef<HTMLScriptElement | null>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const backgroundStreamRef = useRef<MediaStream | null>(null);
  const gazeStartTime = useRef<number | null>(null);
  const currentButton = useRef<HTMLElement | null>(null);
  const isConnectedRef = useRef(isConnected);
  const bleCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const lastCommandTime = useRef<number>(Date.now());
  const brakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const BRAKE_TIMEOUT = 500;
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceDetectionLost, setFaceDetectionLost] = useState(false);
  
  // Gaze smoothing variables
  const gazeHistory = useRef<Array<{x: number, y: number, timestamp: number}>>([]);
  const GAZE_HISTORY_SIZE = 5;
  const GAZE_THRESHOLD = 50; // pixels threshold for considering movement significant
  const faceDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidDirection = useRef<string | null>(null);
  const movementActive = useRef(false);

  // Update refs when context values change
  useEffect(() => {
    isConnectedRef.current = isConnected;
    bleCharacteristicRef.current = bleCharacteristic;
  }, [isConnected, bleCharacteristic]);

  // Load saved speed on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('wheelchairSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.defaultSpeed) {
        setCurrentSpeed(settings.defaultSpeed);
      }
    }
  }, []);

  // Check if back camera is configured
  useEffect(() => {
    const backCameraId = localStorage.getItem('backCameraId');
    setHasBackCamera(!!backCameraId && backCameraId !== '');
  }, []);

  // Initialize background camera if available
  useEffect(() => {
    const initializeBackgroundCamera = async () => {
      const frontCameraId = localStorage.getItem('frontCameraId');
      const backCameraId = localStorage.getItem('backCameraId');
      
      // Only use background camera if:
      // 1. A back camera is specifically selected
      // 2. It's different from the front camera
      // 3. We have a video element to display it
      if (backCameraId && backCameraId !== '' && backCameraId !== frontCameraId && backgroundVideoRef.current) {
        try {
          // Stop any existing stream
          if (backgroundStreamRef.current) {
            backgroundStreamRef.current.getTracks().forEach(track => track.stop());
            backgroundStreamRef.current = null;
          }

          // Add a small delay to ensure WebGazer has started and claimed the front camera
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Get the stream from the back camera
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: backCameraId }
            }
          });

          // Check if we successfully got a stream
          if (stream && stream.getVideoTracks().length > 0) {
            backgroundStreamRef.current = stream;
            backgroundVideoRef.current.srcObject = stream;
            console.log('Background camera initialized successfully');
          }
        } catch (error) {
          console.error('Failed to initialize background camera:', error);
          // If back camera fails, ensure we show white background
          setHasBackCamera(false);
        }
      } else {
        // No valid back camera configuration
        setHasBackCamera(false);
      }
    };

    // Delay initialization to avoid conflicts with WebGazer
    const timeoutId = setTimeout(initializeBackgroundCamera, 500);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (backgroundStreamRef.current) {
        backgroundStreamRef.current.getTracks().forEach(track => track.stop());
        backgroundStreamRef.current = null;
      }
    };
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error attempting to exit fullscreen:', err);
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Send command to ESP32
  const sendCommand = async (command: string) => {
    if (!isConnected || !bleCharacteristicRef.current) {
      console.log('Cannot send command - not connected');
      return;
    }
    
    try {
      console.log('Sending BLE command:', command);
      const data = new TextEncoder().encode(command);
      await bleCharacteristicRef.current.writeValue(data);
      console.log('Command sent successfully:', command);
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  // Handle speed change
  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0];
    setCurrentSpeed(newSpeed);
    sendCommand(`V${newSpeed}`);
  };

  // Handle clear calibration
  const handleClearCalibration = () => {
    if (window.customWebGazer && typeof window.customWebGazer.clearData === 'function') {
      window.customWebGazer.clearData();
      console.log('Calibration data cleared');
    }
    localStorage.removeItem('calibrationData');
  };

  // Function to apply brakes
  const applyBrakes = async () => {
    if (!isConnected || !bleCharacteristicRef.current) return;

    console.log('Applying brakes');
    setIsBraking(true);
    
    try {
      // Send brake command
      const brakeEncoder = new TextEncoder();
      await bleCharacteristicRef.current.writeValue(brakeEncoder.encode('S'));
      
      // Brief delay before full stop
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send stop command
      await bleCharacteristicRef.current.writeValue(brakeEncoder.encode('S'));
      
      setIsBraking(false);
      setCurrentDirection(null);
    } catch (error) {
      console.error('Error applying brakes:', error);
      setIsBraking(false);
    }
  };

  // Process gaze commands
  const processGazeCommand = (direction: string | null, timestamp: number) => {
    if (!isConnected || !bleCharacteristicRef.current) {
      console.log('Cannot process command - not connected');
      return;
    }

    // If we have a direction
    if (direction) {
      lastCommandTime.current = timestamp;

      // If direction changed while moving
      if (movementActive.current && lastValidDirection.current !== direction) {
        console.log('Direction changed while moving - stopping first');
        sendCommand('S');
        movementActive.current = false;
        lastValidDirection.current = null;
        gazeStartTime.current = timestamp;
        currentButton.current = { id: direction } as HTMLElement;
        return;
      }

      // Set current button if not already set
      if (currentButton.current?.id !== direction) {
        currentButton.current = { id: direction } as HTMLElement;
        gazeStartTime.current = timestamp;
      }

      if (!gazeStartTime.current) {
        gazeStartTime.current = timestamp;
      }

      const gazeDuration = timestamp - gazeStartTime.current;
      
      // Start movement after dwell time
      if (gazeDuration >= 1000 && !movementActive.current) {
        const commands: { [key: string]: string } = {
          'forward': 'F',
          'backward': 'B',
          'left': 'L',
          'right': 'R',
          'stop': 'S'
        };

        const command = commands[direction] || 'S';
        console.log('Starting movement:', direction);
        sendCommand(command);
        movementActive.current = true;
        lastValidDirection.current = direction;
        gazeStartTime.current = timestamp;
      }
    } else {
      // No direction - stop if we were moving
      if (movementActive.current) {
        console.log('Gaze left button - STOPPING');
        movementActive.current = false;
        lastValidDirection.current = null;
        currentButton.current = null;
        gazeStartTime.current = null;
        // Send multiple stop commands
        sendCommand('S');
        setTimeout(() => sendCommand('S'), 50);
        setCurrentDirection(null);
      } else if (currentButton.current) {
        // Reset selection if not moving yet
        currentButton.current = null;
        gazeStartTime.current = null;
      }
    }
  };

  // Initialize webgazer with gaze tracking
  useEffect(() => {
    const initializeWebGazer = async () => {
      try {
        if (!window.customWebGazer) {
          const script = document.createElement('script');
          script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
          script.async = true;
          webgazerScript.current = script;
          document.body.appendChild(script);
          
          await new Promise((resolve) => {
            script.onload = () => {
              // @ts-expect-error - webgazer is loaded globally by the script
              window.customWebGazer = window.webgazer;
              resolve(null);
            };
          });
        }

        if (window.customWebGazer && !webgazerStarted.current) {
          // Use front camera for eye tracking if specified
          const frontCameraId = localStorage.getItem('frontCameraId');
          // Note: setCamera might not be available in the official WebGazer API
          // We'll keep this for compatibility but it may not work
          if (frontCameraId && typeof window.customWebGazer.setCamera === 'function') {
            try {
              window.customWebGazer.setCamera(frontCameraId);
            } catch (error) {
              console.warn('setCamera not available or failed:', error);
            }
          }
          
          window.customWebGazer.showPredictionPoints(true);
          window.customWebGazer.showVideo(true);
          
          window.customWebGazer.setGazeListener((data: GazeData | null, timestamp: number) => {
            // Check for face detection
            if (!data) {
              // No face detected - STOP immediately if moving
              if (movementActive.current && isConnectedRef.current) {
                console.log('Face lost - EMERGENCY STOP');
                sendCommand('S');
                sendCommand('S');
                movementActive.current = false;
                lastValidDirection.current = null;
                currentButton.current = null;
                gazeStartTime.current = null;
                setCurrentDirection(null);
              }
              
              if (!faceDetectionTimeoutRef.current) {
                faceDetectionTimeoutRef.current = setTimeout(() => {
                  setFaceDetectionLost(true);
                }, 500);
              }
              return;
            } else {
              if (faceDetectionTimeoutRef.current) {
                clearTimeout(faceDetectionTimeoutRef.current);
                faceDetectionTimeoutRef.current = null;
              }
              setFaceDetectionLost(false);
            }

            if (!isConnectedRef.current) return;

            // Add to gaze history
            gazeHistory.current.push({ x: data.x, y: data.y, timestamp });
            if (gazeHistory.current.length > GAZE_HISTORY_SIZE) {
              gazeHistory.current.shift();
            }

            // Need minimum points for processing
            if (gazeHistory.current.length < 3) return;

            // Calculate smoothed position
            const smoothedX = gazeHistory.current.reduce((sum, p) => sum + p.x, 0) / gazeHistory.current.length;
            const smoothedY = gazeHistory.current.reduce((sum, p) => sum + p.y, 0) / gazeHistory.current.length;

            // Check buttons with different thresholds based on movement state
            const buttonIds = ['forward', 'backward', 'left', 'right', 'stop'];
            let detectedDirection: string | null = null;
            
            // Use tighter bounds when moving (to detect when gaze leaves)
            // Use looser bounds when not moving (to reduce jitter on activation)
            const exitPadding = movementActive.current ? -30 : 0; // Negative padding = smaller detection area
            const enterPadding = movementActive.current ? 0 : 40; // Increased padding for better edge detection
            
            for (const id of buttonIds) {
              const btn = document.getElementById(id);
              if (btn) {
                const rect = btn.getBoundingClientRect();
                
                // If we're moving and this is our current button, use exit padding
                if (movementActive.current && lastValidDirection.current === id) {
                  if (
                    smoothedX >= rect.left - exitPadding &&
                    smoothedX <= rect.right + exitPadding &&
                    smoothedY >= rect.top - exitPadding &&
                    smoothedY <= rect.bottom + exitPadding
                  ) {
                    detectedDirection = id;
                    break;
                  }
                } else {
                  // Not moving or different button - use enter padding
                  if (
                    smoothedX >= rect.left - enterPadding &&
                    smoothedX <= rect.right + enterPadding &&
                    smoothedY >= rect.top - enterPadding &&
                    smoothedY <= rect.bottom + enterPadding
                  ) {
                    detectedDirection = id;
                    break;
                  }
                }
              }
            }

            // Additional check: if moving and raw gaze is way off, stop immediately
            if (movementActive.current && lastValidDirection.current) {
              const activeBtn = document.getElementById(lastValidDirection.current);
              if (activeBtn) {
                const rect = activeBtn.getBoundingClientRect();
                const safetyMargin = 50; // Large margin for safety
                
                if (
                  data.x < rect.left - safetyMargin ||
                  data.x > rect.right + safetyMargin ||
                  data.y < rect.top - safetyMargin ||
                  data.y > rect.bottom + safetyMargin
                ) {
                  console.log('Raw gaze far from button - safety stop');
                  detectedDirection = null;
                }
              }
            }

            setCurrentDirection(detectedDirection);
            processGazeCommand(detectedDirection, timestamp);
          });

          window.customWebGazer.begin();
          webgazerStarted.current = true;
        }
      } catch (error) {
        console.error('Failed to initialize webgazer:', error);
      }
    };

    initializeWebGazer();
  }, [isConnected]);

  // Cleanup function
  const cleanup = () => {
    try {
      // Clean up background camera stream
      if (backgroundStreamRef.current) {
        backgroundStreamRef.current.getTracks().forEach(track => track.stop());
        backgroundStreamRef.current = null;
      }

      if (window.customWebGazer && typeof window.customWebGazer.end === 'function' && webgazerStarted.current) {
        window.customWebGazer.end();
        webgazerStarted.current = false;
      }
      
      if (webgazerScript.current && webgazerScript.current.parentNode) {
        webgazerScript.current.parentNode.removeChild(webgazerScript.current);
        webgazerScript.current = null;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  // Handle back button
  const handleBack = () => {
    cleanup();
    // Force a hard reload to the gaze-tracking page
    window.location.replace('/gaze-tracking');
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  // Add cleanup for brake timeout and face detection timeout
  useEffect(() => {
    return () => {
      if (brakeTimeoutRef.current) {
        clearTimeout(brakeTimeoutRef.current);
      }
      if (faceDetectionTimeoutRef.current) {
        clearTimeout(faceDetectionTimeoutRef.current);
      }
    };
  }, []);

  const scanForDevices = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["12345678-1234-5678-1234-56789abcdef0"]
      });
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');
      const service = await server.getPrimaryService("12345678-1234-5678-1234-56789abcdef0");
      const characteristic = await service.getCharacteristic("abcdef01-1234-5678-1234-56789abcdef0");
      setConnectionState(device, characteristic);
    } catch (error) {
      setError('Failed to scan/connect. Make sure Bluetooth is enabled and permissions are granted.');
    } finally {
      setIsScanning(false);
    }
  };

  const disconnectDevice = async () => {
    if (bleDevice?.gatt?.connected) {
      try {
        if (bleCharacteristic) {
          const data = new TextEncoder().encode('S');
          await bleCharacteristic.writeValue(data);
        }
        await bleDevice.gatt?.disconnect();
      } catch {
        // Optionally log error
      }
    }
    setConnectionState(null, null);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Background - either video or white based on camera availability */}
      {hasBackCamera ? (
        <video
          ref={backgroundVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ backgroundColor: 'white' }} // Fallback to white when video fails
        />
      ) : (
        <div className="absolute inset-0 w-full h-full z-0 bg-white" />
      )}

      {/* Dark overlay for better button visibility - only when using video background */}
      {hasBackCamera && (
        <div className="absolute inset-0 bg-black/30 z-5" />
      )}

      {/* Main content container */}
      <div className="relative w-full h-full z-10">
        {/* Top Right Control Panel */}
        <div className="absolute top-6 right-6 z-20 flex flex-col items-end space-y-3">
          {/* All Controls in One Row */}
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${
              isConnected ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
            }`}>
              <Bluetooth size={18} />
            </div>

            {/* Connect/Disconnect Button */}
            {!isConnected ? (
              <Button
                onClick={scanForDevices}
                variant="outline"
                size="icon"
                className="h-10 w-10"
                disabled={isScanning}
                aria-label={isScanning ? "Scanning..." : "Connect"}
              >
                <Bluetooth size={18} />
              </Button>
            ) : (
              <Button
                onClick={disconnectDevice}
                variant="destructive"
                size="icon"
                className="h-10 w-10"
                aria-label="Disconnect"
              >
                <Bluetooth size={18} className="text-white" />
              </Button>
            )}

            {/* Fullscreen Button */}
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="icon"
              className="h-10 w-10"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </Button>

            {/* Speed Control Button */}
            <Button
              onClick={() => setShowSpeedControl(!showSpeedControl)}
              variant="outline"
              size="icon"
              className="h-10 w-10"
              aria-label="Speed Settings"
            >
              <Settings2 size={18} />
            </Button>

            {/* Clear Calibration Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  aria-label="Clear Calibration"
                >
                  <Trash2 size={18} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Calibration Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all eye tracking calibration data. You'll need to recalibrate after this action.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCalibration}>Clear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Back Button */}
            <Button
              onClick={handleBack}
              variant="default"
              size="icon"
              className="h-10 w-10"
              aria-label="Back to Control"
            >
              <ArrowLeftCircle size={18} />
            </Button>
          </div>

          {error && (
            <div className="text-xs text-red-600">{error}</div>
          )}

          {/* Speed Control Panel (shown when button clicked) */}
          {showSpeedControl && (
            <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
              <div className="text-sm font-medium mb-2">Speed: {currentSpeed}%</div>
              <Slider
                min={0}
                max={200}
                step={5}
                value={[currentSpeed]}
                onValueChange={handleSpeedChange}
                className="w-48"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>200%</span>
              </div>
            </div>
          )}
        </div>

        {/* Brake status indicator */}
        {isBraking && (
          <div className="absolute top-16 left-0 right-0 p-2 text-center text-white font-medium z-30 bg-yellow-600">
            Braking...
          </div>
        )}

        {/* Face detection alert */}
        {faceDetectionLost && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 bg-red-600 text-white p-6 rounded-lg shadow-2xl max-w-md text-center">
            <div className="text-2xl font-bold mb-2">⚠️ Face Not Detected</div>
            <div className="text-lg">Please center your face in the camera view</div>
            <div className="text-sm mt-2 opacity-90">The red border on the video indicates tracking issues</div>
          </div>
        )}

        {/* Movement buttons - extended to edges for better accuracy */}
        <div className="absolute inset-0">
          {/* Forward button - extends to top edge */}
          <button
            id="forward"
            className={`absolute top-0 left-1/3 right-1/3 h-1/3 ${hasBackCamera ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-600' : 'bg-blue-600 hover:bg-blue-700 text-white'} shadow-lg flex items-center justify-center transition-colors ${hasBackCamera ? 'backdrop-blur-sm' : ''} ${
              currentDirection === 'forward' ? (hasBackCamera ? 'bg-blue-600/40' : 'bg-blue-700') : ''
            }`}
            style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)' }}
          >
            <ArrowUp size={80} className="mt-8" />
          </button>

          {/* Left button - extends to left edge */}
          <button
            id="left"
            className={`absolute left-0 top-1/3 bottom-1/3 w-1/3 ${hasBackCamera ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-600' : 'bg-blue-600 hover:bg-blue-700 text-white'} shadow-lg flex items-center justify-center transition-colors ${hasBackCamera ? 'backdrop-blur-sm' : ''} ${
              currentDirection === 'left' ? (hasBackCamera ? 'bg-blue-600/40' : 'bg-blue-700') : ''
            }`}
            style={{ clipPath: 'polygon(0 0, 100% 15%, 100% 85%, 0 100%)' }}
          >
            <ArrowLeft size={80} className="ml-8" />
          </button>

          {/* Stop button (center) - larger but not extending to edges */}
          <button
            id="stop"
            className={`absolute top-1/3 left-1/3 right-1/3 bottom-1/3 ${hasBackCamera ? 'bg-gray-600/30 hover:bg-gray-600/50 text-gray-600' : 'bg-gray-600 hover:bg-gray-700 text-white'} rounded-full shadow-lg flex items-center justify-center transition-colors ${hasBackCamera ? 'backdrop-blur-sm' : ''} ${
              currentDirection === null ? (hasBackCamera ? 'bg-gray-600/50' : 'bg-gray-700') : ''
            } z-10`}
          >
            <div className={`w-24 h-24 rounded-full border-8 ${hasBackCamera ? 'border-current' : 'border-white'}`} />
          </button>

          {/* Right button - extends to right edge */}
          <button
            id="right"
            className={`absolute right-0 top-1/3 bottom-1/3 w-1/3 ${hasBackCamera ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-600' : 'bg-blue-600 hover:bg-blue-700 text-white'} shadow-lg flex items-center justify-center transition-colors ${hasBackCamera ? 'backdrop-blur-sm' : ''} ${
              currentDirection === 'right' ? (hasBackCamera ? 'bg-blue-600/40' : 'bg-blue-700') : ''
            }`}
            style={{ clipPath: 'polygon(0 15%, 100% 0, 100% 100%, 0 85%)' }}
          >
            <ArrowRight size={80} className="mr-8" />
          </button>

          {/* Backward button - extends to bottom edge */}
          <button
            id="backward"
            className={`absolute bottom-0 left-1/3 right-1/3 h-1/3 ${hasBackCamera ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-600' : 'bg-blue-600 hover:bg-blue-700 text-white'} shadow-lg flex items-center justify-center transition-colors ${hasBackCamera ? 'backdrop-blur-sm' : ''} ${
              currentDirection === 'backward' ? (hasBackCamera ? 'bg-blue-600/40' : 'bg-blue-700') : ''
            }`}
            style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0 100%)' }}
          >
            <ArrowDown size={80} className="mb-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WheelchairControlPage;