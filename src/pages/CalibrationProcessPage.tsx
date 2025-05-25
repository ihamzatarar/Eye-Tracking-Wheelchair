import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './CalibrationProcess.css';

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
    saveDataAcrossSessions: boolean;
    calibrationPoints: Record<string, number>;
    pointCalibrate: number;
  }
}

const cleanupWebGazerAPI = (webgazerScriptRef: React.RefObject<HTMLScriptElement>) => {
  console.log('Cleaning up WebGazer API.');
  try {
    if (window.webgazer) {
      window.webgazer.end();
      window.webgazer.setGazeListener(() => {});
    }
    if (webgazerScriptRef.current && webgazerScriptRef.current.parentNode) {
      webgazerScriptRef.current.parentNode.removeChild(webgazerScriptRef.current);
    }
    window.webgazer = undefined;
  } catch (error) {
    console.error('Error during WebGazer API cleanup:', error);
  }
};

const CalibrationProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const [pointCalibrate, setPointCalibrate] = useState(0);
  const [calibrationPoints, setCalibrationPoints] = useState<Record<string, number>>({});
  const isInitialized = useRef(false);
  const webgazerScript = useRef<HTMLScriptElement | null>(null);
  
  const calculatePrecision = useCallback((past50Array: [number[], number[]]) => {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const x50 = past50Array[0];
    const y50 = past50Array[1];
    const staringPointX = windowWidth / 2;
    const staringPointY = windowHeight / 2;

    const precisionPercentages = new Array(50);
    for (let x = 0; x < 50; x++) {
      const xDiff = staringPointX - x50[x];
      const yDiff = staringPointY - y50[x];
      const distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
      const halfWindowHeight = windowHeight / 2;
      let precision = 0;

      if (distance <= halfWindowHeight && distance > -1) {
        precision = 100 - (distance / halfWindowHeight * 100);
      } else if (distance > halfWindowHeight) {
        precision = 0;
      } else if (distance > -1) {
        precision = 100;
      }

      precisionPercentages[x] = precision;
    }

    const average = precisionPercentages.reduce((a, b) => a + b, 0) / 50;
    return Math.round(average);
  }, []);

  const ClearCanvas = useCallback(() => {
      document.querySelectorAll('.Calibration').forEach((i) => {
        (i as HTMLElement).style.display = 'none';
      });
      const canvas = document.getElementById("plotting_canvas") as HTMLCanvasElement;
      if (canvas) {
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      }
  }, []);

  const ShowCalibrationPoint = useCallback(() => {
      document.querySelectorAll('.Calibration').forEach((i) => {
        (i as HTMLElement).style.display = 'block';
      });
      const pt5 = document.getElementById('Pt5');
      if (pt5) {
        pt5.style.display = 'none';
    }
  }, []);

  const ClearCalibration = useCallback(() => {
    setPointCalibrate(0);
    setCalibrationPoints({});
  }, []);

  const calcAccuracy = useCallback(() => {
      Swal.fire({
        title: "Calculating measurement",
        text: "Please don't move your mouse & stare at the middle dot for the next 5 seconds. This will allow us to calculate the accuracy of our predictions.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: true,
        confirmButtonText: "Start Measurement"
      }).then((result) => {
        if (result.isConfirmed) {
          if (window.webgazer) {
            window.webgazer.params.storingPoints = true;
          }
          
          let timeLeft = 5;
          const countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
              Swal.update({
                title: `Calculating measurement`,
                text: `Please don't move your mouse & stare at the middle dot for the next ${timeLeft} seconds.`
              });
            } else {
              clearInterval(countdownInterval);
              let precision_measurement = 0;
              if (window.webgazer) {
                window.webgazer.params.storingPoints = false;
                const past50 = window.webgazer.getStoredPoints();
                precision_measurement = calculatePrecision(past50);
              }
            
            const accuracyElement = document.getElementById("Accuracy");
            if (accuracyElement) {
              accuracyElement.innerHTML = `<a class="accuracy-status">Accuracy | ${precision_measurement}%</a>`;
            }
            
            const checkPrecisionBtn = document.getElementById("checkPrecisionBtn");
            if (checkPrecisionBtn) {
              checkPrecisionBtn.style.display = "block";
            }
              
              Swal.fire({
                title: `Your accuracy measure is ${precision_measurement}%`,
                allowOutsideClick: false,
                showCancelButton: true,
                confirmButtonText: "Done",
                cancelButtonText: "Recalibrate"
              }).then((result) => {
                if (result.isConfirmed) {
                  ClearCanvas();
                  navigate('/bluetooth');
                } else {
                  if (window.webgazer) {
                    window.webgazer.clearData();
                  }
                  ClearCalibration();
                  ClearCanvas();
                  ShowCalibrationPoint();
                if (checkPrecisionBtn) {
                  checkPrecisionBtn.style.display = "none";
                }
                }
              });
            }
          }, 1000);
        }
      });
  }, [navigate, calculatePrecision, ClearCanvas, ShowCalibrationPoint, ClearCalibration]);

  useEffect(() => {
    if (isInitialized.current) return;

    isInitialized.current = true;

    const loadWebGazerScript = () => {
      webgazerScript.current = document.createElement('script');
      webgazerScript.current.src = 'https://webgazer.cs.brown.edu/webgazer.js';
      webgazerScript.current.async = true;
      webgazerScript.current.onload = () => {
        console.log('WebGazer script loaded.');
        initializeWebGazerAPI();
      };
      webgazerScript.current.onerror = (error) => {
        console.error('WebGazer script failed to load:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to load eye tracking script.',
          icon: 'error'
        });
        isInitialized.current = false;
      };
      document.body.appendChild(webgazerScript.current);
    };

    const initializeWebGazerAPI = async () => {
      if (!window.webgazer) {
        console.error('WebGazer object not found after script load.');
        Swal.fire({
          title: 'Error',
          text: 'WebGazer object not found.',
          icon: 'error'
        });
        isInitialized.current = false;
        return;
      }

      try {
        if (window.webgazer) {
          window.webgazer.setGazeListener(() => {});
          await window.webgazer.begin();
        }

        console.log('WebGazer begin successful.');

        ClearCanvas();
        Swal.fire({
          title: "Calibration",
          text: "Please click on each of the 9 points on the screen. You must click on each point 5 times till it goes yellow. This will calibrate your eye movements.",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showCancelButton: false,
          confirmButtonText: "Start Calibration"
        }).then((result) => {
          if (result.isConfirmed) {
            ShowCalibrationPoint();
            addCalibrationListeners();
          }
        });

        window.webgazer.showPredictionPoints(false);
        window.webgazer.showVideoPreview(false);

      } catch (error) {
        console.error('WebGazer begin failed:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to start eye tracking. Please ensure camera access is allowed.',
          icon: 'error'
        });
        isInitialized.current = false;
      }
    };

    const addCalibrationListeners = () => {
      document.querySelectorAll('.Calibration').forEach((element) => {
        element.addEventListener('click', () => calPointClick(element as HTMLElement));
      });
    };

    const removeCalibrationListeners = () => {
       document.querySelectorAll('.Calibration').forEach((element) => {
        element.removeEventListener('click', () => calPointClick(element as HTMLElement));
      });
    };

    function calPointClick(node: HTMLElement) {
      const id = node.id;
      
      setCalibrationPoints(prev => {
        const newPoints = { ...prev };
        const currentPoints = (newPoints[id] || 0) + 1;
        newPoints[id] = currentPoints;

        if (currentPoints === 5) {
          node.style.backgroundColor = 'yellow';
          node.setAttribute('disabled', 'disabled');
          setPointCalibrate(prevPoints => {
            const newPointCount = prevPoints + 1;
            
            if (newPointCount === 8) {
              const pt5 = document.getElementById('Pt5');
              if (pt5) pt5.style.display = 'block';
            }
            
            if (newPointCount === 9) {
              setTimeout(() => {
                document.querySelectorAll('.Calibration').forEach((i) => {
                  (i as HTMLElement).style.display = 'none';
                });
                const pt5 = document.getElementById('Pt5');
                if (pt5) pt5.style.display = 'block';

                const canvas = document.getElementById("plotting_canvas") as HTMLCanvasElement;
                if (canvas) {
                  canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
                }

                calcAccuracy();
              }, 0);
            }
            
            return newPointCount;
          });
        } else if (currentPoints < 5) {
          const opacity = 0.2 * currentPoints + 0.2;
          node.style.opacity = opacity.toString();
        }

        return newPoints;
      });
    }

    loadWebGazerScript();

    return () => {
      console.log('Effect cleanup running.');
      removeCalibrationListeners();
      cleanupWebGazerAPI(webgazerScript);
      isInitialized.current = false;
    };

  }, [calcAccuracy, ClearCanvas, ShowCalibrationPoint, ClearCalibration, navigate]);

  const handleBack = useCallback(() => {
    cleanupWebGazerAPI(webgazerScript);
    isInitialized.current = false;
    navigate('/calibration');
  }, [navigate]);

  const handleClearData = useCallback(() => {
    Swal.fire({
      title: 'Clear Calibration Data',
      text: 'This will clear all saved calibration data. Are you sure you want to continue?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear data',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (result.isConfirmed) {
        if (window.webgazer) {
          window.webgazer.clearData();
        }
        localStorage.clear();
        ClearCalibration();
        ClearCanvas();
        ShowCalibrationPoint();
        const accuracyElement = document.getElementById("Accuracy");
        if (accuracyElement) {
          accuracyElement.innerHTML = '<a class="accuracy-status">Not yet Calibrated</a>';
        }
        const checkPrecisionBtn = document.getElementById("checkPrecisionBtn");
        if (checkPrecisionBtn) {
          checkPrecisionBtn.style.display = "none";
        }
        Swal.fire({
          title: 'Data Cleared',
          text: 'All calibration data has been cleared successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }, [ClearCalibration, ClearCanvas, ShowCalibrationPoint]);

  return (
    <div className="webgazerPage">
      <nav id="webgazerNavbar" className="navbar navbar-default navbar-fixed-top">
        <div className="container-fluid">
          <div className="navbar-content">
            <ul className="nav navbar-nav">
              <li id="Accuracy">
                <a className="accuracy-status">Not yet Calibrated</a>
              </li>
              <li>
                <a 
                  onClick={(e) => {
                    e.preventDefault();
                    handleBack();
                  }} 
                  href="/calibration" 
                  className="nav-link"
                >
                  <span className="nav-icon">←</span> Back to Calibration
                </a>
              </li>
              <li>
                <a 
                  onClick={() => {
                     if (window.webgazer) {
                       window.webgazer.applyKalmanFilter(!window.webgazer.params.applyKalmanFilter);
                     }
                  }} 
                  href="#" 
                  className="nav-link"
                >
                  <span className="nav-icon">⚡</span> Toggle Kalman Filter
                </a>
              </li>
              <li>
                <a 
                  onClick={() => {
                    const pt5 = document.getElementById('Pt5');
                    if (pt5) pt5.style.display = 'block';
                    calcAccuracy();
                  }} 
                  href="#" 
                  id="checkPrecisionBtn" 
                  className="nav-link"
                  style={{ display: 'none' }}
                >
                  <span className="nav-icon">✓</span> Check Precision
                </a>
              </li>
            </ul>
            <ul className="nav navbar-nav navbar-right">
              <li>
                <a 
                  onClick={handleClearData}
                  href="#" 
                  className="nav-link text-danger"
                >
                  <span className="nav-icon">🗑️</span> Clear Data
                </a>
              </li>
              <li>
                <a 
                  onClick={() => {
                    Swal.fire({
                      title: "Calibration Help",
                      html: `
                        <div class="text-left">
                          <p class="mb-3">Follow these steps to calibrate your eye tracking:</p>
                          <ol class="list-decimal pl-4">
                            <li class="mb-2">Click on each of the 9 red dots on the screen</li>
                            <li class="mb-2">Click each point 5 times until it turns yellow</li>
                            <li class="mb-2">After all points are yellow, stare at the center dot</li>
                            <li class="mb-2">Wait for the accuracy measurement to complete</li>
                          </ol>
                          <p class="mt-4 text-sm text-gray-600">Tip: Keep your head still and maintain a consistent distance from the screen.</p>
                        </div>
                      `,
                      confirmButtonText: "Got it!",
                      confirmButtonColor: "#3085d6",
                    });
                  }} 
                  href="#" 
                  className="helpBtn"
                >
                  <span className="nav-icon">?</span> Help
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <canvas id="plotting_canvas" width="500" height="500" style={{cursor: 'crosshair'}}></canvas>
      
      <div className="calibrationDiv">
        <input type="button" className="Calibration" id="Pt1"></input>
        <input type="button" className="Calibration" id="Pt2"></input>
        <input type="button" className="Calibration" id="Pt3"></input>
        <input type="button" className="Calibration" id="Pt4"></input>
        <input type="button" className="Calibration" id="Pt5"></input>
        <input type="button" className="Calibration" id="Pt6"></input>
        <input type="button" className="Calibration" id="Pt7"></input>
        <input type="button" className="Calibration" id="Pt8"></input>
        <input type="button" className="Calibration" id="Pt9"></input>
      </div>
    </div>
  );
};

export default CalibrationProcessPage; 