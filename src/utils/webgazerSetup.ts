import Swal from 'sweetalert2';

export async function initializeWebGazer(
  onCalibrationPointClick: (node: HTMLElement) => void,
  onShowCalibrationPoint: () => void,
  onPopUpInstruction: () => void,
  onError?: (error: any) => void
) {
  try {
    await window.webgazer.setRegression('ridge')
      .setGazeListener(function() {
        // Gaze data is being collected but not used directly
      })
      .saveDataAcrossSessions(true)
      .begin();

    window.webgazer.showVideoPreview(true)
      .showPredictionPoints(true)
      .applyKalmanFilter(true);

    // Setup canvas
    const canvas = document.getElementById("plotting_canvas") as HTMLCanvasElement;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.position = 'fixed';
    }

    // Add click handlers to calibration points
    document.querySelectorAll('.Calibration').forEach((i) => {
      i.addEventListener('click', () => {
        onCalibrationPointClick(i as HTMLElement);
      });
    });

    // Show calibration points after a short delay
    setTimeout(() => {
      onShowCalibrationPoint();
    }, 500);

    // Show initial instructions
    onPopUpInstruction();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Failed to initialize eye tracking. Please make sure your camera is connected and try again.',
        icon: 'error'
      });
    }
  }
}

export function cleanupWebGazer() {
  if (window.webgazer && typeof window.webgazer.end === 'function') {
    try {
      window.webgazer.end();
    } catch (e) {
      // Optionally log the error, but don't crash the app
      console.warn('webgazer.end() failed:', e);
    }
  }
} 