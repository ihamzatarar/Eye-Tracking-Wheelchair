import React, { useEffect, useCallback, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, HelpCircle, Trash2, ArrowLeftCircle, Zap } from 'lucide-react';

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

      const video = document.getElementById('webgazerVideoFeed');
      const container = document.getElementById('webgazerVideoContainer');
      if (video && container && !container.contains(video)) {
        container.appendChild(video);
        video.style.position = 'static'; // Remove absolute/fixed positioning
        video.style.width = '100%';
        video.style.height = '100%';
      }
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
    // Navigate back - you can replace this with your navigation logic
    window.location.href = '/bluetooth';
  };

  const handleProceedToControl = () => {
    cleanupWebGazer();
    // Navigate to wheelchair control - you can replace this with your navigation logic
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">Wheelchair Eye Tracking Calibration</h1>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isCalibrated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isCalibrated ? `Calibrated (${accuracy}% accuracy)` : 'Not Calibrated'}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleKalmanFilter}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                kalmanEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Zap size={16} />
              <span>Kalman Filter</span>
            </button>
            
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Clear Data</span>
            </button>
            
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
            >
              <HelpCircle size={16} />
              <span>Help</span>
            </button>
            
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <ArrowLeftCircle size={16} />
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to Calibrate:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Click on each wheelchair control button 5 times</li>
            <li>Each click helps the system learn where you're looking</li>
            <li>Buttons will turn green when complete</li>
            <li>After all 5 buttons are calibrated, we'll measure accuracy</li>
            <li>Keep your head still and at a comfortable distance from the screen</li>
          </ol>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-600">Progress:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedPoints / 5) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600">{completedPoints}/5 buttons</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {completedPoints < 5 ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Calibrate Your Wheelchair Controls
              </h2>
              <p className="text-gray-600">
                Click each button below 5 times while looking directly at it
              </p>
            </div>

            {/* Calibration Grid */}
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-3 grid-rows-3 gap-4" style={{ height: '60vh' }}>
                {calibrationConfig.map(({ id, icon: Icon, label, position }) => {
                  const clicks = calibrationPoints[id] || 0;
                  const isComplete = clicks >= 5;
                  
                  return (
                    <button
                      key={id}
                      onClick={() => !isComplete && handleCalibrationClick(id)}
                      className={`${position} relative rounded-xl shadow-lg flex flex-col items-center justify-center transition-all transform hover:scale-105 ${
                        isComplete 
                          ? 'bg-green-500 text-white cursor-default' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                      }`}
                      style={{ opacity: 0.2 + (clicks * 0.16) }}
                      disabled={isComplete}
                    >
                      <Icon size={48} className="mb-2" />
                      <span className="font-semibold text-lg">{label}</span>
                      <span className="text-sm mt-1">
                        {isComplete ? '✓ Complete' : `${clicks}/5 clicks`}
                      </span>
                      
                      {/* Click indicator */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
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
          </>
        ) : !isCalibrated ? (
          // Accuracy Measurement
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Measuring Accuracy
            </h2>
            <p className="text-gray-600 mb-8">
              Please look at the center dot and don't move your eyes for 5 seconds
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
                Your accuracy score: <span className="font-bold">{accuracy}%</span>
              </p>
              
              <div className="space-y-4">
                <p className="text-green-600">
                  {accuracy && accuracy >= 70 
                    ? "Excellent! Your eye tracking is well calibrated." 
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

      {/* WebGazer Video Preview */}
      <div className="fixed bottom-4 left-4 w-80 h-60 bg-black rounded-lg shadow-lg overflow-hidden">
        <div id="webgazerVideoContainer" />
      </div>
    </div>
  );
};

export default OptimizedCalibrationProcess;