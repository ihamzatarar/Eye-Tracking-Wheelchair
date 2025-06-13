import React, { useEffect, useCallback, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, HelpCircle, Trash2, ArrowLeftCircle, Zap, CheckCircle, Maximize, Minimize } from 'lucide-react';

interface WebGazerParams {
  applyKalmanFilter: boolean;
  storingPoints: boolean;
}

interface WebGazer {
  applyKalmanFilter: (apply: boolean) => void;
  params: WebGazerParams;
  clearData: () => void;
  end: () => void;
  begin: () => Promise<void>;
  setGazeListener: (listener: (data: any, timestamp: number) => void) => void;
  showPredictionPoints: (show: boolean) => void;
  showVideoPreview: (show: boolean) => void;
  setRegression: (type: string) => WebGazer;
  saveDataAcrossSessions: (save: boolean) => WebGazer;
}

declare global {
  interface Window {
    webgazer?: WebGazer;
  }
}

const OptimizedCalibrationProcess: React.FC = () => {
  const [calibrationPoints, setCalibrationPoints] = useState<Record<string, number>>({});
  const [completedPoints, setCompletedPoints] = useState(0);
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

  // Border calibration points (8 additional points)
  const borderCalibrationConfig = [
    { id: 'top-center', position: 'top-8 left-1/2 transform -translate-x-1/2' },
    { id: 'top-right', position: 'top-32 right-8' },
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

  const initializeWebGazer = useCallback(async () => {
    if (!window.webgazer) {
      console.error('WebGazer not loaded');
      setIsInitializing(false);
      return;
    }

    try {
      // Set a proper gaze listener
      window.webgazer.setGazeListener((data, timestamp) => {
        if (data == null) return;
      });
      
      // Initialize WebGazer with proper settings
      await window.webgazer
        .setRegression('ridge')
        .saveDataAcrossSessions(true)
        .begin();
      
      // Show video preview and prediction points
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

    // Enter fullscreen by default
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
      });
    }

    const loadWebGazer = () => {
      webgazerScript.current = document.createElement('script');
      webgazerScript.current.src = 'https://webgazer.cs.brown.edu/webgazer.js';
      webgazerScript.current.async = true;
      webgazerScript.current.onload = () => {
        setTimeout(() => {
          initializeWebGazer();
        }, 100);
      };
      webgazerScript.current.onerror = () => {
        console.error('Failed to load WebGazer script');
        setIsInitializing(false);
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
    setCalibrationPoints({});
    setCompletedPoints(0);
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
          <p className="text-sm text-gray-500 mt-2">Please allow camera access when prompted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-white">
      {/* Top Right Control Panel */}
      <div className="absolute top-6 right-6 z-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-2">
          <div className="flex items-center space-x-1">
            {/* Calibration Status - Enhanced */}
            <div className={`h-12 px-4 flex items-center rounded-xl transition-all ${
              completedPoints === 13 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/25 shadow-lg' 
                : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700'
            }`}>
              {completedPoints === 13 ? (
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle size={18} className="animate-bounce" />
                  <span>Ready!</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <div className="w-4 h-4 rounded-full bg-amber-500 animate-pulse" />
                  <span>Calibrating</span>
                </span>
              )}
            </div>

            {/* Button Group with Divider */}
            <div className="flex items-center bg-gray-50/50 rounded-xl p-1 space-x-1">
              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-md transition-all group"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? 
                  <Minimize size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" /> : 
                  <Maximize size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                }
              </button>

              {/* Kalman Filter Toggle - Enhanced */}
              <button
                onClick={toggleKalmanFilter}
                className={`h-10 w-10 flex items-center justify-center rounded-lg transition-all ${
                  kalmanEnabled 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40' 
                    : 'hover:bg-white hover:shadow-md'
                }`}
                title={kalmanEnabled ? "Kalman Filter ON" : "Kalman Filter OFF"}
              >
                <Zap size={18} className={kalmanEnabled ? 'text-white' : 'text-gray-600'} />
              </button>
              
              {/* Divider */}
              <div className="w-px h-8 bg-gray-200" />
              
              {/* Clear Data Button - Enhanced */}
              <button
                onClick={handleClearData}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-red-50 hover:shadow-md transition-all group"
                title="Reset Calibration"
              >
                <Trash2 size={18} className="text-gray-600 group-hover:text-red-500 transition-colors" />
              </button>
              
              {/* Help Button */}
              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`h-10 w-10 flex items-center justify-center rounded-lg transition-all ${
                  showHelp ? 'bg-blue-50 shadow-md' : 'hover:bg-white hover:shadow-md'
                }`}
                title="Help Guide"
              >
                <HelpCircle size={18} className={showHelp ? 'text-blue-600' : 'text-gray-600'} />
              </button>
            </div>
            
            {/* Back Button - Separated */}
            <button
              onClick={handleBack}
              className="h-12 px-4 flex items-center justify-center rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg hover:shadow-xl group"
              title="Back to Bluetooth"
            >
              <ArrowLeftCircle size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="ml-2 text-sm font-medium">Back</span>
            </button>
          </div>
        </div>
        
        {/* Progress Bar - Below the buttons with simple design */}
        <div className="mt-3 mr-24">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-600">Progress:</span>
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(completedPoints / 13) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600">{completedPoints}/13</span>
          </div>
          {/* Instructions under progress bar */}
          <div className="mt-2 text-right">
            <p className="text-sm font-semibold text-gray-700">Click each button 3 times while looking at it</p>
            <p className="text-xs text-gray-500">Complete all 13 calibration points for best accuracy</p>
          </div>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="absolute top-32 right-6 bg-white/95 backdrop-blur-sm border border-blue-200/30 rounded-2xl p-5 max-w-sm z-20 shadow-xl">
          <div className="absolute -top-2 right-8 w-4 h-4 bg-white border-t border-l border-blue-200/30 transform rotate-45"></div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HelpCircle size={16} className="text-blue-600" />
            </div>
            Quick Guide
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Look at each button and click it <strong>3 times</strong>. When a button turns <span className="text-green-600 font-semibold">green ✓</span>, it's complete. The layout matches your wheelchair control interface.
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Tip: Complete all 13 points for best control accuracy</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {completedPoints < 13 ? (
        <div className="absolute inset-0">
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
      ) : (
        // Calibration Complete
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-green-100 rounded-lg p-8 shadow-lg max-w-md">
            <h2 className="text-3xl font-bold text-green-800 mb-4 text-center">
              Calibration Complete!
            </h2>
            <p className="text-lg text-green-700 mb-6 text-center">
              Eye tracking is now calibrated for wheelchair control.
            </p>
            
            <div className="space-y-4">
              <p className="text-green-600 text-center">
                You're ready to control the wheelchair with your eyes!
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