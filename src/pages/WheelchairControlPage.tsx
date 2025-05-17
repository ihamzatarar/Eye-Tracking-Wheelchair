import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GazeData {
  x: number;
  y: number;
  confidence: number;
}

interface CustomWebGazer {
  begin: () => void;
  end: () => void;
  setGazeListener: (callback: (data: GazeData | null) => void) => void;
  showPredictionPoints: (show: boolean) => void;
  showVideo: (show: boolean) => void;
}

declare global {
  interface Window {
    customWebGazer: CustomWebGazer;
  }
}

const WheelchairControlPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentDirection, setCurrentDirection] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const webgazerStarted = useRef(false);

  useEffect(() => {
    const initializeWebGazer = async () => {
      try {
        // Load webgazer script if not already loaded
        if (!window.customWebGazer) {
          const script = document.createElement('script');
          script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
          script.async = true;
          document.body.appendChild(script);
          
          await new Promise((resolve) => {
            script.onload = () => {
              // @ts-expect-error - webgazer is loaded globally by the script
              window.customWebGazer = window.webgazer;
              resolve(null);
            };
          });
        }

        // Initialize webgazer
        if (window.customWebGazer && !webgazerStarted.current) {
          window.customWebGazer.showPredictionPoints(true);
          window.customWebGazer.showVideo(false);
          
          const gazeListener = window.customWebGazer.setGazeListener((data: GazeData | null) => {
            if (data == null) return;

            // Convert gaze coordinates to percentage of screen
            const x = (data.x / window.innerWidth) * 100;
            const y = (data.y / window.innerHeight) * 100;
            
            // Determine direction based on gaze position
            if (y < 30) {
              setCurrentDirection('forward');
            } else if (y > 70) {
              setCurrentDirection('backward');
            } else if (x < 30) {
              setCurrentDirection('left');
            } else if (x > 70) {
              setCurrentDirection('right');
            } else {
              setCurrentDirection(null);
            }

            // Auto-disable calibration after some time
            if (isCalibrating && data.confidence > 0.5) {
              setTimeout(() => setIsCalibrating(false), 2000);
            }
          });

          window.customWebGazer.begin();
          webgazerStarted.current = true;
        }
      } catch (error) {
        console.error('Failed to initialize webgazer:', error);
      }
    };

    initializeWebGazer();

    return () => {
      if (window.customWebGazer && webgazerStarted.current) {
        window.customWebGazer.end();
        webgazerStarted.current = false;
      }
    };
  }, [isCalibrating]);

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col">
      {/* Back button - moved to right side */}
      <button
        onClick={() => navigate('/gaze-tracking')}
        className="absolute top-4 right-4 z-10 flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
      >
        <span>Back to Control</span>
        <ArrowLeftCircle size={24} className="transform rotate-180" />
      </button>

      {/* Calibration overlay */}
      {isCalibrating && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="text-center text-white p-6">
            <h3 className="text-xl font-bold mb-2">Calibrating Eye Tracking</h3>
            <p className="mb-4">Please look at different points on the screen to calibrate the eye tracker.</p>
            <p className="text-sm">This may take a few moments...</p>
          </div>
        </div>
      )}

      {/* Movement buttons grid */}
      <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-4 p-4">
        {/* Forward button */}
        <button
          className={`col-start-2 row-start-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-600 rounded-xl shadow-lg flex items-center justify-center transition-colors ${
            currentDirection === 'forward' ? 'bg-blue-600/40' : ''
          }`}
          onClick={() => console.log('Moving forward')}
        >
          <ArrowUp size={64} />
        </button>

        {/* Left button */}
        <button
          className={`col-start-1 row-start-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-600 rounded-xl shadow-lg flex items-center justify-center transition-colors ${
            currentDirection === 'left' ? 'bg-blue-600/40' : ''
          }`}
          onClick={() => console.log('Turning left')}
        >
          <ArrowLeft size={64} />
        </button>

        {/* Stop button (center) */}
        <button
          className={`col-start-2 row-start-2 bg-gray-600/20 hover:bg-gray-600/40 text-gray-600 rounded-xl shadow-lg flex items-center justify-center transition-colors ${
            currentDirection === null ? 'bg-gray-600/40' : ''
          }`}
          onClick={() => console.log('Stopping')}
        >
          <div className="w-16 h-16 rounded-full border-4 border-current" />
        </button>

        {/* Right button */}
        <button
          className={`col-start-3 row-start-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-600 rounded-xl shadow-lg flex items-center justify-center transition-colors ${
            currentDirection === 'right' ? 'bg-blue-600/40' : ''
          }`}
          onClick={() => console.log('Turning right')}
        >
          <ArrowRight size={64} />
        </button>

        {/* Backward button */}
        <button
          className={`col-start-2 row-start-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-600 rounded-xl shadow-lg flex items-center justify-center transition-colors ${
            currentDirection === 'backward' ? 'bg-blue-600/40' : ''
          }`}
          onClick={() => console.log('Moving backward')}
        >
          <ArrowDown size={64} />
        </button>
      </div>
    </div>
  );
};

export default WheelchairControlPage; 