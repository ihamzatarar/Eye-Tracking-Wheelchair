import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftCircle, Bluetooth } from 'lucide-react';
import { useBluetooth } from '../context/BluetoothContext';
import { Button } from '@/components/ui/button';

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
}

declare global {
  interface Window {
    customWebGazer: CustomWebGazer;
  }
}

const WheelchairControlPage: React.FC = () => {
  const { isConnected, bleCharacteristic } = useBluetooth();
  const [currentDirection, setCurrentDirection] = useState<string | null>(null);
  const [isBraking, setIsBraking] = useState(false);
  const [hasBackCamera, setHasBackCamera] = useState(false);
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

  // Update refs when context values change
  useEffect(() => {
    isConnectedRef.current = isConnected;
    bleCharacteristicRef.current = bleCharacteristic;
  }, [isConnected, bleCharacteristic]);

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

    // Clear any existing brake timeout
    if (brakeTimeoutRef.current) {
      clearTimeout(brakeTimeoutRef.current);
      brakeTimeoutRef.current = null;
    }

    // Process direction
    if (direction) {
      lastCommandTime.current = timestamp;

      if (currentButton.current?.id !== direction) {
        console.log('Direction changed from', currentButton.current?.id, 'to', direction);
        currentButton.current = { id: direction } as HTMLElement;
        gazeStartTime.current = timestamp;
        return;
      }

      if (!gazeStartTime.current) {
        gazeStartTime.current = timestamp;
      }

      const gazeDuration = timestamp - gazeStartTime.current;
      
      if (gazeDuration >= 1000) {
        const commands: { [key: string]: string } = {
          'forward': 'F',
          'backward': 'B',
          'left': 'L',
          'right': 'R',
          'stop': 'S'
        };

        const command = commands[direction] || 'S';
        sendCommand(command);
        
        // Set brake timeout
        brakeTimeoutRef.current = setTimeout(() => {
          if (Date.now() - lastCommandTime.current >= BRAKE_TIMEOUT) {
            applyBrakes();
          }
        }, BRAKE_TIMEOUT);

        gazeStartTime.current = timestamp;
      }
    } else {
      if (currentButton.current) {
        console.log('Gaze moved away from button, applying brakes');
        currentButton.current = null;
        gazeStartTime.current = null;
        applyBrakes();
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
            if (!data || !isConnectedRef.current) return;

            // DOM hit-testing for movement buttons
            const buttonIds = ['forward', 'backward', 'left', 'right', 'stop'];
            let direction: string | null = null;

            for (const id of buttonIds) {
              const btn = document.getElementById(id);
              if (btn) {
                const rect = btn.getBoundingClientRect();
                if (
                  data.x >= rect.left &&
                  data.x <= rect.right &&
                  data.y >= rect.top &&
                  data.y <= rect.bottom
                ) {
                  direction = id;
                  break;
                }
              }
            }

            setCurrentDirection(direction);
            processGazeCommand(direction, timestamp);
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

  // Add cleanup for brake timeout
  useEffect(() => {
    return () => {
      if (brakeTimeoutRef.current) {
        clearTimeout(brakeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col">
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

      {/* Controls Bar - now top right, using shadcn/ui components */}
      <div className="fixed top-6 right-6 z-20 flex flex-col items-end space-y-6">
        {/* Bluetooth Connection Status */}
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow text-white font-semibold ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}
             style={{ minWidth: 180, justifyContent: 'center' }}>
          <Bluetooth size={20} />
          <span>{isConnected ? 'Connected' : 'Not Connected'}</span>
        </div>
        {/* Back Button */}
        <Button
          onClick={handleBack}
          variant="default"
          size="lg"
          className="flex items-center space-x-3"
          aria-label="Back to Control"
        >
          <ArrowLeftCircle size={32} />
          <span>Back</span>
        </Button>
      </div>

      {/* Brake status indicator */}
      {isBraking && (
        <div className="fixed top-16 left-0 right-0 p-2 text-center text-white font-medium z-30 bg-yellow-600">
          Braking...
        </div>
      )}

      {/* Movement buttons grid */}
      <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-4 p-4 mt-20 relative z-10">
        {/* Forward button */}
        <button
          id="forward"
          className={`col-start-2 row-start-1 ${hasBackCamera ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-600' : 'bg-blue-600 hover:bg-blue-700 text-white'} rounded-xl shadow-lg flex items-center justify-center transition-colors ${hasBackCamera ? 'backdrop-blur-sm' : ''} ${
            currentDirection === 'forward' ? (hasBackCamera ? 'bg-blue-600/40' : 'bg-blue-700') : ''
          }`}
        >
          <ArrowUp size={64} />
        </button>

        {/* Left button */}
        <button
          id="left"
          className={`col-start-1 row-start-2 ${hasBackCamera ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-600' : 'bg-blue-600 hover:bg-blue-700 text-white'} rounded-xl shadow-lg flex items-center justify-center transition-colors ${hasBackCamera ? 'backdrop-blur-sm' : ''} ${
            currentDirection === 'left' ? (hasBackCamera ? 'bg-blue-600/40' : 'bg-blue-700') : ''
          }`}
        >
          <ArrowLeft size={64} />
        </button>

        {/* Stop button (center) */}
        <button
          id="stop"
          className={`col-start-2 row-start-2 ${hasBackCamera ? 'bg-gray-600/20 hover:bg-gray-600/40 text-gray-600' : 'bg-gray-600 hover:bg-gray-700 text-white'} rounded-xl shadow-lg flex items-center justify-center transition-colors ${hasBackCamera ? 'backdrop-blur-sm' : ''} ${
            currentDirection === null ? (hasBackCamera ? 'bg-gray-600/40' : 'bg-gray-700') : ''
          }`}
        >
          <div className={`w-16 h-16 rounded-full border-4 ${hasBackCamera ? 'border-current' : 'border-white'}`} />
        </button>

        {/* Right button */}
        <button
          id="right"
          className={`col-start-3 row-start-2 ${hasBackCamera ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-600' : 'bg-blue-600 hover:bg-blue-700 text-white'} rounded-xl shadow-lg flex items-center justify-center transition-colors ${hasBackCamera ? 'backdrop-blur-sm' : ''} ${
            currentDirection === 'right' ? (hasBackCamera ? 'bg-blue-600/40' : 'bg-blue-700') : ''
          }`}
        >
          <ArrowRight size={64} />
        </button>

        {/* Backward button */}
        <button
          id="backward"
          className={`col-start-2 row-start-3 ${hasBackCamera ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-600' : 'bg-blue-600 hover:bg-blue-700 text-white'} rounded-xl shadow-lg flex items-center justify-center transition-colors ${hasBackCamera ? 'backdrop-blur-sm' : ''} ${
            currentDirection === 'backward' ? (hasBackCamera ? 'bg-blue-600/40' : 'bg-blue-700') : ''
          }`}
        >
          <ArrowDown size={64} />
        </button>
      </div>
    </div>
  );
};

export default WheelchairControlPage;