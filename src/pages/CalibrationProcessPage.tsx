import React, { useEffect, useCallback, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, HelpCircle, Trash2, ArrowLeftCircle, Zap, CheckCircle, Maximize, Minimize } from 'lucide-react';

interface WebGazerParams {
  applyKalmanFilter: boolean;
  storingPoints: boolean;
}

interface WebGazer {
  applyKalmanFilter: (apply: boolean) => void;
  params: WebGazerParams;
  getStoredPoints: () => [number[], number[]];
  clearData: () => void;
  end: () => void;
  begin: () => Promise<void>;
  setGazeListener: (listener: (data: any, timestamp: number) => void) => void;
  showPredictionPoints: (show: boolean) => void;
  showVideoPreview: (show: boolean) => void;
}

declare global {
  interface Window {
    webgazer?: WebGazer;
  }
}

const OptimizedCalibrationProcess: React.FC = () => {
  const [calibrationPoints, setCalibrationPoints] = useState<Record<string, number>>({});
  const [completedPoints, setCompletedPoints] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [kalmanEnabled, setKalmanEnabled] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isInitialized = useRef(false);
  const webgazerScript = useRef<HTMLScriptElement | null>(null);

  // Calibration point positions matching wheelchair controls
  const calibrationConfig = [
    { id: 'forward', icon: ArrowUp, label: 'Forward', position: 'top-0 left-1/3 right-1/3 h-1/3', clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)' },
    { id: 'left', icon: ArrowLeft, label: 'Left', position: 'left-0 top-1/3 bottom-1/3 w-1/3', clipPath: 'polygon(0 0, 100% 15%, 100% 85%, 0 100%)' },
    { id: 'stop', icon: Square, label: 'Stop', position: 'top-1/3 left-1/3 right-1/3 bottom-1/3', clipPath: '', isCenter: true },
    { id: 'right', icon: ArrowRight, label: 'Right', position: 'right-0 top-1/3 bottom-1/3 w-1/3', clipPath: 'polygon(0 15%, 100% 0, 100% 100%, 0 85%)' },
    { id: 'backward', icon: ArrowDown, label: 'Backward', position: 'bottom-0 left-1/3 right-1/3 h-1/3', clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0 100%)' },
  ];

  // Border calibration points (8 additional points - removed top-left)
  const borderCalibrationConfig = [
    { id: 'top-center', position: 'top-8 left-1/2 transform -translate-x-1/2' },
    { id: 'top-right', position: 'top-24 right-8' }, // Moved down to avoid overlap with control buttons
    { id: 'middle-left', position: 'top-1/2 left-8 transform -translate-y-1/2' },
    { id: 'middle-right', position: 'top-1/2 right-8 transform -translate-y-1/2' },
    { id: 'bottom-left', position: 'bottom-8 left-8' },
    { id: 'bottom-center', position: 'bottom-8 left-1/2 transform -translate-x-1/2' },
    { id: 'bottom-right', position: 'bottom-8 right-8' },
    { id: 'center', position: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' }
  ];

  const cleanupWebGazer = useCallback(() => {
    try {
      if (window.webgazer) {
        window.webgazer.end();
        window.webgazer.setGazeListener(() => {});
      }
      if (webgazerScript.current?.parentNode) {
        webgazerScript.current.parentNode.removeChild(webgazerScript.current);
      }
      window.webgazer = undefined;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, []);

  const calculatePrecision = useCallback((past50Array: [number[], number[]]) => {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const x50 = past50Array[0];
    const y50 = past50Array[1];
    const staringPointX = windowWidth / 2;
    const staringPointY = windowHeight / 2;

    const precisionPercentages = x50.map((x, i) => {
      const xDiff = staringPointX - x;
      const yDiff = staringPointY - y50[i];
      const distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
      const halfWindowHeight = windowHeight / 2;
      
      if (distance <= halfWindowHeight) {
        return 100 - (distance / halfWindowHeight * 100);
      }
      return 0;
    });

    return Math.round(precisionPercentages.reduce((a, b) => a + b, 0) / 50);
  }, []);

  const handleCalibrationClick = useCallback((pointId: string) => {
    setCalibrationPoints(prev => {
      const newPoints = { ...prev };
      const currentClicks = (newPoints[pointId] || 0) + 1;
      newPoints[pointId] = currentClicks;

      if (currentClicks === 3) {
        setCompletedPoints(p => p + 1);
      }

      return newPoints;
    });
  }, []);

  const startAccuracyMeasurement = useCallback(() => {
    if (!window.webgazer) return;

    let countdown = 5;
    const countdownElement = document.getElementById('countdown');
    
    window.webgazer.params.storingPoints = true;
    
    const interval = setInterval(() => {
      countdown--;
      if (countdownElement) {
        countdownElement.textContent = countdown.toString();
      }
      
      if (countdown === 0) {
        clearInterval(interval);
        window.webgazer.params.storingPoints = false;
        const past50 = window.webgazer.getStoredPoints();
        const precision = calculatePrecision(past50);
        setAccuracy(precision);
        setIsCalibrated(true);
        
        // Save calibration status
        localStorage.setItem('wheelchairCalibrationComplete', 'true');
        localStorage.setItem('wheelchairCalibrationAccuracy', precision.toString());
      }
    }, 1000);
  }, [calculatePrecision]);

  const initializeWebGazer = useCallback(async () => {
    if (!window.webgazer) {
      console.error('WebGazer not loaded');
      return;
    }

    try {
      window.webgazer.setGazeListener(() => {});
      await window.webgazer.begin();
      window.webgazer.showPredictionPoints(true);
      window.webgazer.showVideoPreview(true);
      window.webgazer.applyKalmanFilter(kalmanEnabled);
      setIsInitializing(false);
    } catch (error) {
      console.error('Failed to initialize WebGazer:', error);
      setIsInitializing(false);
    }
  }, [kalmanEnabled]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Check if already calibrated
    const calibrationComplete = localStorage.getItem('wheelchairCalibrationComplete');
    const savedAccuracy = localStorage.getItem('wheelchairCalibrationAccuracy');
    
    if (calibrationComplete === 'true' && savedAccuracy) {
      setIsCalibrated(true);
      setAccuracy(parseInt(savedAccuracy));
    }

    const loadWebGazer = () => {
      webgazerScript.current = document.createElement('script');
      webgazerScript.current.src = 'https://webgazer.cs.brown.edu/webgazer.js';
      webgazerScript.current.async = true;
      webgazerScript.current.onload = () => {
        initializeWebGazer();
      };
      document.body.appendChild(webgazerScript.current);
    };

    loadWebGazer();

    return () => {
      cleanupWebGazer();
      isInitialized.current = false;
    };
  }, [initializeWebGazer, cleanupWebGazer]);

  const handleClearData = useCallback(() => {
    if (window.webgazer) {
      window.webgazer.clearData();
    }
    localStorage.removeItem('wheelchairCalibrationComplete');
    localStorage.removeItem('wheelchairCalibrationAccuracy');
    setCalibrationPoints({});
    setCompletedPoints(0);
    setIsCalibrated(false);
    setAccuracy(null);
  }, []);

  const toggleKalmanFilter = useCallback(() => {
    if (window.webgazer) {
      const newState = !kalmanEnabled;
      window.webgazer.applyKalmanFilter(newState);
      setKalmanEnabled(newState);
    }
  }, [kalmanEnabled]);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleBack = () => {
    cleanupWebGazer();
    window.location.href = '/bluetooth';
  };

  const handleProceedToControl = () => {
    cleanupWebGazer();
    window.location.href = '/wheelchair-control';
  };

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing eye tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-white">
      {/* Top Right Control Panel */}
      <div className="absolute top-6 right-6 z-20 flex items-center space-x-2">
        {/* Calibration Status */}
        <div className={`h-10 px-3 flex items-center rounded-lg ${
          isCalibrated ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'
        }`}>
          {isCalibrated ? (
            <span className="flex items-center gap-1 text-sm font-medium">
              <CheckCircle size={16} />
              {accuracy}%
            </span>
          ) : (
            <span className="text-sm font-medium">Not Calibrated</span>
          )}
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>

        {/* Kalman Filter Toggle */}
        <button
          onClick={toggleKalmanFilter}
          className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors ${
            kalmanEnabled ? 'bg-blue-500 text-white hover:bg-blue-600' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
          title="Kalman Filter"
        >
          <Zap size={18} />
        </button>
        
        {/* Clear Data Button */}
        <button
          onClick={handleClearData}
          className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          title="Clear Data"
        >
          <Trash2 size={18} />
        </button>
        
        {/* Help Button */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          title="Help"
        >
          <HelpCircle size={18} />
        </button>
        
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="h-10 w-10 flex items-center justify-center rounded-lg bg-gray-700 text-white hover:bg-gray-800 transition-colors"
          title="Back"
        >
          <ArrowLeftCircle size={18} />
        </button>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="absolute top-20 right-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm z-20 shadow-lg">
          <p className="text-sm text-blue-800">
            <strong>Quick Guide:</strong> Click each button 5 times while looking at it. Green = Complete. The layout matches your wheelchair control interface.
          </p>
        </div>
      )}

      {/* Progress Bar - minimal, at top */}
      <div className="absolute top-6 left-6 right-96 z-10">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-600">Progress:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedPoints / 13) * 100}%` }}
            />
          </div>
                      <span className="text-sm font-medium text-gray-600">{completedPoints}/13</span>
        </div>
      </div>

      {/* Main Content */}
      {completedPoints < 13 ? (
        <div className="absolute inset-0">
          {/* Instructions - center top */}
          <div className="absolute top-20 left-0 right-0 text-center z-10">
            <h2 className="text-xl font-semibold text-gray-700">
              Click each button 3 times while looking at it
            </h2>
            <p className="text-sm text-gray-500 mt-1">Complete all 13 calibration points for best accuracy</p>
          </div>

          {/* Border Calibration Points */}
          {borderCalibrationConfig.map(({ id, position }) => {
            const clicks = calibrationPoints[id] || 0;
            const isComplete = clicks >= 3;
            
            return (
              <button
                key={id}
                onClick={() => !isComplete && handleCalibrationClick(id)}
                className={`absolute ${position} w-20 h-20 rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-110 border-4 border-white ${
                  isComplete 
                    ? 'bg-green-500 text-white cursor-default' 
                    : 'bg-purple-500 hover:bg-purple-600 text-white cursor-pointer animate-pulse'
                } z-50`}
                style={{ zIndex: 50 }}
                disabled={isComplete}
              >
                <span className="text-base font-bold">
                  {isComplete ? '✓' : `${clicks}/3`}
                </span>
              </button>
            );
          })}

          {/* Calibration Buttons - Full screen layout matching wheelchair control */}
          {calibrationConfig.map(({ id, icon: Icon, label, position, clipPath, isCenter }) => {
            const clicks = calibrationPoints[id] || 0;
            const isComplete = clicks >= 3;
            
            if (isCenter) {
              // Center button (Stop) - special circular styling
              return (
                <button
                  key={id}
                  onClick={() => !isComplete && handleCalibrationClick(id)}
                  className={`absolute ${position} rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-105 ${
                    isComplete 
                      ? 'bg-green-600 text-white cursor-default' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white cursor-pointer'
                  } z-10`}
                  disabled={isComplete}
                >
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full border-8 border-white flex items-center justify-center`}>
                      <span className="text-lg font-bold">
                        {isComplete ? '✓' : `${clicks}/3`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            }

            // Directional buttons
            return (
              <button
                key={id}
                onClick={() => !isComplete && handleCalibrationClick(id)}
                className={`absolute ${position} ${
                  isComplete 
                    ? 'bg-green-600 text-white cursor-default' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                } shadow-lg flex items-center justify-center transition-colors`}
                style={{ clipPath }}
                disabled={isComplete}
              >
                <div className="flex flex-col items-center">
                  <Icon size={80} className={
                    id === 'forward' ? 'mt-8' :
                    id === 'backward' ? 'mb-8' :
                    id === 'left' ? 'ml-8' :
                    id === 'right' ? 'mr-8' : ''
                  } />
                  <span className="text-xl font-bold mt-2">
                    {isComplete ? '✓' : `${clicks}/3`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : !isCalibrated ? (
        // Accuracy Measurement
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Measuring Accuracy
            </h2>
            <p className="text-gray-600 mb-8">
              Look at the center dot for 5 seconds
            </p>
            
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span id="countdown" className="text-white text-4xl font-bold">5</span>
              </div>
            </div>
            
            <button
              onClick={startAccuracyMeasurement}
              className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
            >
              Start Measurement
            </button>
          </div>
        </div>
      ) : (
        // Calibration Complete
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-green-100 rounded-lg p-8 shadow-lg max-w-md">
            <h2 className="text-3xl font-bold text-green-800 mb-4 text-center">
              Calibration Complete!
            </h2>
            <p className="text-xl text-green-700 mb-6 text-center">
              Accuracy: <span className="font-bold">{accuracy}%</span>
            </p>
            
            <div className="space-y-4">
              <p className="text-green-600 text-center">
                {accuracy && accuracy >= 70 
                  ? "Excellent! Ready for wheelchair control." 
                  : "Consider recalibrating for better accuracy."}
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleProceedToControl}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg"
                >
                  Start Using Wheelchair
                </button>
                
                <button
                  onClick={handleClearData}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
                >
                  Recalibrate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedCalibrationProcess;