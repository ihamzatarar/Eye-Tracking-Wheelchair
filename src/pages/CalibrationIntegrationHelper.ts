// CalibrationIntegration.ts
// Helper functions to integrate the optimized calibration with your wheelchair control

interface CalibrationData {
    isCalibrated: boolean;
    accuracy: number | null;
    calibrationPoints: Record<string, number>;
    timestamp: string;
  }
  
  interface GazeCalibrationConfig {
    requiredClicks: number;
    minimumAccuracy: number;
    calibrationTimeout: number;
    gazeThreshold: number;
  }
  
  export class WheelchairCalibrationManager {
    private static instance: WheelchairCalibrationManager;
    private config: GazeCalibrationConfig;
  
    private constructor() {
      this.config = {
        requiredClicks: 5,
        minimumAccuracy: 70,
        calibrationTimeout: 1000, // ms to register a gaze
        gazeThreshold: 50 // pixel threshold for gaze detection
      };
    }
  
    static getInstance(): WheelchairCalibrationManager {
      if (!WheelchairCalibrationManager.instance) {
        WheelchairCalibrationManager.instance = new WheelchairCalibrationManager();
      }
      return WheelchairCalibrationManager.instance;
    }
  
    // Save calibration data
    saveCalibration(data: CalibrationData): void {
      localStorage.setItem('wheelchairCalibration', JSON.stringify(data));
      localStorage.setItem('wheelchairCalibrationComplete', 'true');
      localStorage.setItem('wheelchairCalibrationAccuracy', data.accuracy?.toString() || '0');
    }
  
    // Load calibration data
    loadCalibration(): CalibrationData | null {
      const data = localStorage.getItem('wheelchairCalibration');
      if (data) {
        return JSON.parse(data);
      }
      return null;
    }
  
    // Check if calibration is valid
    isCalibrationValid(): boolean {
      const calibration = this.loadCalibration();
      if (!calibration) return false;
      
      // Check if calibration is recent (within 7 days)
      const calibrationDate = new Date(calibration.timestamp);
      const daysSinceCalibration = (Date.now() - calibrationDate.getTime()) / (1000 * 60 * 60 * 24);
      
      return calibration.isCalibrated && 
             (calibration.accuracy || 0) >= this.config.minimumAccuracy &&
             daysSinceCalibration < 7;
    }
  
    // Clear calibration
    clearCalibration(): void {
      localStorage.removeItem('wheelchairCalibration');
      localStorage.removeItem('wheelchairCalibrationComplete');
      localStorage.removeItem('wheelchairCalibrationAccuracy');
      if (window.webgazer) {
        window.webgazer.clearData();
      }
    }
  
    // Get calibration status
    getCalibrationStatus(): { status: string; message: string; accuracy: number | null } {
      const calibration = this.loadCalibration();
      
      if (!calibration) {
        return {
          status: 'not_calibrated',
          message: 'Eye tracking not calibrated. Please complete calibration.',
          accuracy: null
        };
      }
  
      if (!this.isCalibrationValid()) {
        return {
          status: 'calibration_expired',
          message: 'Calibration is outdated or inaccurate. Please recalibrate.',
          accuracy: calibration.accuracy
        };
      }
  
      return {
        status: 'calibrated',
        message: `Eye tracking calibrated with ${calibration.accuracy}% accuracy`,
        accuracy: calibration.accuracy
      };
    }
  
    // Calculate button hit area based on calibration accuracy
    getButtonHitArea(baseSize: number, accuracy: number | null): number {
      if (!accuracy) return baseSize * 1.5; // Default larger hit area if not calibrated
      
      // Scale hit area inversely with accuracy
      // Higher accuracy = smaller hit area needed
      const scaleFactor = 1 + ((100 - accuracy) / 100);
      return baseSize * scaleFactor;
    }
  
    // Wheelchair-specific calibration points
    getWheelchairCalibrationPoints(): Array<{id: string, x: number, y: number}> {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      return [
        { id: 'forward', x: width / 2, y: height * 0.25 },
        { id: 'left', x: width * 0.25, y: height / 2 },
        { id: 'stop', x: width / 2, y: height / 2 },
        { id: 'right', x: width * 0.75, y: height / 2 },
        { id: 'backward', x: width / 2, y: height * 0.75 }
      ];
    }
  
    // Validate gaze point is within button bounds
    isGazeOnButton(
      gazeX: number, 
      gazeY: number, 
      buttonElement: HTMLElement, 
      accuracy: number | null
    ): boolean {
      const rect = buttonElement.getBoundingClientRect();
      const hitArea = this.getButtonHitArea(Math.max(rect.width, rect.height), accuracy);
      const padding = (hitArea - Math.max(rect.width, rect.height)) / 2;
      
      return gazeX >= rect.left - padding &&
             gazeX <= rect.right + padding &&
             gazeY >= rect.top - padding &&
             gazeY <= rect.bottom + padding;
    }
  
    // Get configuration
    getConfig(): GazeCalibrationConfig {
      return { ...this.config };
    }
  
    // Update configuration
    updateConfig(newConfig: Partial<GazeCalibrationConfig>): void {
      this.config = { ...this.config, ...newConfig };
    }
  }
  
  // Export helper functions for easier integration
  export function checkCalibrationBeforeControl(): boolean {
    const manager = WheelchairCalibrationManager.getInstance();
    const status = manager.getCalibrationStatus();
    
    if (status.status !== 'calibrated') {
      // Redirect to calibration or show message
      console.warn(status.message);
      return false;
    }
    
    return true;
  }
  
  export function getGazeValidationForButton(
    gazeX: number,
    gazeY: number,
    buttonId: string
  ): boolean {
    const manager = WheelchairCalibrationManager.getInstance();
    const buttonElement = document.getElementById(buttonId);
    const calibration = manager.loadCalibration();
    
    if (!buttonElement) return false;
    
    return manager.isGazeOnButton(
      gazeX, 
      gazeY, 
      buttonElement, 
      calibration?.accuracy || null
    );
  }
  
  // Integration with your existing wheelchair control
  export function enhanceWheelchairControl(): void {
    const manager = WheelchairCalibrationManager.getInstance();
    
    // Check calibration on page load
    if (!checkCalibrationBeforeControl()) {
      // Show calibration prompt
      const shouldCalibrate = confirm(
        'Eye tracking is not calibrated. Would you like to calibrate now for better control?'
      );
      
      if (shouldCalibrate) {
        window.location.href = '/calibration-process';
      }
    }
    
    // Add calibration status indicator
    const status = manager.getCalibrationStatus();
    console.log(`Wheelchair Control: ${status.message}`);
  }
  
  // Export the calibration data type for use in other components
  export type { CalibrationData, GazeCalibrationConfig };