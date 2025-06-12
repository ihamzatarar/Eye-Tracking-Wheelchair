import React, { useEffect, useCallback, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, HelpCircle, Trash2, ArrowLeftCircle, Zap, CheckCircle } from 'lucide-react';

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
  const isInitialized = useRef(false);
  const webgazerScript = useRef<HTMLScriptElement | null>(null);

  // Calibration point positions matching wheelchair controls
  const calibrationConfig = [
    { id: 'forward', icon: ArrowUp, label: 'Forward', position: 'col-start-2 row-start-1' },
    { id: 'left', icon: ArrowLeft, label: 'Left', position: 'col-start-1 row-start-2' },
    { id: 'stop', icon: Square, label: 'Stop', position: 'col-start-2 row-start-2' },
    { id: 'right', icon: ArrowRight, label: 'Right', position: 'col-start-3 row-start-2' },
    { id: 'backward', icon: ArrowDown, label: 'Backward', position: 'col-start-2 row-start-3' },
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

      if (currentClicks === 5) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing eye tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Compact Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-gray-800">Eye Tracking Calibration</h1>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isCalibrated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isCalibrated ? (
                <span className="flex items-center gap-1">
                  <CheckCircle size={12} />
                  {accuracy}%
                </span>
              ) : 'Not Calibrated'}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleKalmanFilter}
              className={`p-2 rounded-lg transition-colors ${
                kalmanEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              title="Kalman Filter"
            >
              <Zap size={16} />
            </button>
            
            <button
              onClick={handleClearData}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Clear Data"
            >
              <Trash2 size={16} />
            </button>
            
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              title="Help"
            >
              <HelpCircle size={16} />
            </button>
            
            <button
              onClick={handleBack}
              className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              title="Back"
            >
              <ArrowLeftCircle size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <p className="text-xs text-blue-800">
            <strong>Quick Guide:</strong> Click each button 5 times while looking at it. Green = Complete.
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white px-4 py-2 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-600">Progress:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedPoints / 5) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600">{completedPoints}/5</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        {completedPoints < 5 ? (
          <div className="w-full max-w-7xl">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">
                Click each button 5 times while looking at it
              </h2>
            </div>

            {/* Large Calibration Grid */}
            <div className="grid grid-cols-3 grid-rows-3 gap-8 mx-auto" style={{ width: 'fit-content' }}>
              {calibrationConfig.map(({ id, icon: Icon, label, position }) => {
                const clicks = calibrationPoints[id] || 0;
                const isComplete = clicks >= 5;
                
                return (
                  <button
                    key={id}
                    onClick={() => !isComplete && handleCalibrationClick(id)}
                    className={`${position} relative rounded-2xl shadow-xl flex flex-col items-center justify-center transition-all transform hover:scale-105 ${
                      isComplete 
                        ? 'bg-green-500 text-white cursor-default' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                    }`}
                    style={{ 
                      width: '420px', 
                      height: '240px',
                      opacity: 0.3 + (clicks * 0.14)
                    }}
                    disabled={isComplete}
                  >
                    <Icon size={80} className="mb-3" />
                    <span className="font-bold text-3xl">{label}</span>
                    <span className="text-xl mt-2">
                      {isComplete ? '✓ Complete' : `${clicks}/5`}
                    </span>
                    
                    {/* Click indicator dots */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full ${
                            i < clicks ? 'bg-white' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : !isCalibrated ? (
          // Accuracy Measurement
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Measuring Accuracy
            </h2>
            <p className="text-gray-600 mb-8">
              Look at the center dot for 5 seconds
            </p>
            
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center">
                <span id="countdown" className="text-white text-4xl font-bold">5</span>
              </div>
            </div>
            
            <button
              onClick={startAccuracyMeasurement}
              className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Measurement
            </button>
          </div>
        ) : (
          // Calibration Complete
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-green-100 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-green-800 mb-4">
                Calibration Complete!
              </h2>
              <p className="text-xl text-green-700 mb-6">
                Accuracy: <span className="font-bold">{accuracy}%</span>
              </p>
              
              <div className="space-y-4">
                <p className="text-green-600">
                  {accuracy && accuracy >= 70 
                    ? "Excellent! Ready for wheelchair control." 
                    : "Consider recalibrating for better accuracy."}
                </p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleProceedToControl}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Start Using Wheelchair
                  </button>
                  
                  <button
                    onClick={handleClearData}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Recalibrate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedCalibrationProcess;