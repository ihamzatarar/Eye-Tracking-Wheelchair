import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge } from 'lucide-react';

type CameraFacingMode = 'user' | 'environment' | 'unknown';

interface CameraDevice {
  deviceId: string;
  label: string;
  facingMode: CameraFacingMode;
}

interface WheelchairSettings {
  maxSpeed: number;
  defaultSpeed: number;
  accelerationRate: number;
  decelerationRate: number;
}

const DEFAULT_WHEELCHAIR_SETTINGS: WheelchairSettings = {
  maxSpeed: 100,
  defaultSpeed: 50,
  accelerationRate: 5,
  decelerationRate: 5,
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedFrontCamera, setSelectedFrontCamera] = useState<string>('');
  const [selectedBackCamera, setSelectedBackCamera] = useState<string>('');
  const [isDetectingCameras, setIsDetectingCameras] = useState(false);
  const [wheelchairSettings, setWheelchairSettings] = useState<WheelchairSettings>(DEFAULT_WHEELCHAIR_SETTINGS);

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadCameras = async () => {
    setIsDetectingCameras(true);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
          facingMode: 'unknown' as CameraFacingMode,
        }));

      // Try to determine camera facing mode
      for (const device of videoDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: device.deviceId }
          });
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();
          device.facingMode = (settings.facingMode as CameraFacingMode) || 'unknown';
          // Immediately stop the stream after getting settings
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error('Error determining camera facing mode:', error);
        }
      }

      setCameras(videoDevices);

      // If only one camera is available, automatically set it as the front camera
      if (videoDevices.length === 1) {
        setSelectedFrontCamera(videoDevices[0].deviceId);
        setSelectedBackCamera(''); // Clear back camera selection
        // Save settings immediately
        localStorage.setItem('frontCameraId', videoDevices[0].deviceId);
        localStorage.setItem('backCameraId', '');
      }
    } catch (error) {
      console.error('Error loading cameras:', error);
      alert('Error detecting cameras. Please make sure you have granted camera permissions.');
    } finally {
      setIsDetectingCameras(false);
    }
  };

  const loadSavedSettings = () => {
    const savedFrontCamera = localStorage.getItem('frontCameraId');
    const savedBackCamera = localStorage.getItem('backCameraId');
    const savedWheelchairSettings = localStorage.getItem('wheelchairSettings');
    
    if (savedFrontCamera) setSelectedFrontCamera(savedFrontCamera);
    if (savedBackCamera) setSelectedBackCamera(savedBackCamera);
    if (savedWheelchairSettings) {
      setWheelchairSettings(JSON.parse(savedWheelchairSettings));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('frontCameraId', selectedFrontCamera);
    localStorage.setItem('backCameraId', selectedBackCamera);
    localStorage.setItem('wheelchairSettings', JSON.stringify(wheelchairSettings));
    alert('Settings saved successfully!');
  };

  const clearCalibration = () => {
    if (window.confirm('Are you sure you want to clear all calibration data? This action cannot be undone.')) {
      localStorage.removeItem('calibrationData');
      // Add any other calibration-related data that needs to be cleared
      alert('Calibration data has been cleared successfully.');
    }
  };

  const handleWheelchairSettingChange = (
    key: keyof WheelchairSettings,
    value: number
  ) => {
    setWheelchairSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
            
            {/* Wheelchair Speed Settings Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Gauge size={20} className="mr-2" />
                Wheelchair Speed Settings
              </h2>
              
              {/* Default Speed */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Speed ({wheelchairSettings.defaultSpeed}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={wheelchairSettings.defaultSpeed}
                  onChange={(e) => handleWheelchairSettingChange('defaultSpeed', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Max Speed */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Speed ({wheelchairSettings.maxSpeed}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={wheelchairSettings.maxSpeed}
                  onChange={(e) => handleWheelchairSettingChange('maxSpeed', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Acceleration Rate */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acceleration Rate ({wheelchairSettings.accelerationRate}% per second)
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={wheelchairSettings.accelerationRate}
                  onChange={(e) => handleWheelchairSettingChange('accelerationRate', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Gradual</span>
                  <span>Quick</span>
                </div>
              </div>

              {/* Deceleration Rate */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deceleration Rate ({wheelchairSettings.decelerationRate}% per second)
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={wheelchairSettings.decelerationRate}
                  onChange={(e) => handleWheelchairSettingChange('decelerationRate', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Gradual</span>
                  <span>Quick</span>
                </div>
              </div>

              {/* Speed Presets */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[25, 50, 75].map(presetSpeed => (
                  <button
                    key={presetSpeed}
                    onClick={() => handleWheelchairSettingChange('defaultSpeed', presetSpeed)}
                    className={`py-2 px-3 rounded border text-sm font-medium transition-colors
                      ${wheelchairSettings.defaultSpeed === presetSpeed 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {presetSpeed}%
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Settings Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Camera Settings</h2>
              
              {/* Detect Cameras Button */}
              <div className="mb-6">
                <button
                  onClick={loadCameras}
                  disabled={isDetectingCameras}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                    ${isDetectingCameras 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                >
                  {isDetectingCameras ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Detecting Cameras...
                    </>
                  ) : (
                    'Detect Cameras'
                  )}
                </button>
                {cameras.length > 0 && (
                  <span className="ml-3 text-sm text-gray-500">
                    {cameras.length} camera{cameras.length !== 1 ? 's' : ''} detected
                  </span>
                )}
              </div>
              
              {/* Front Camera Selection */}
              <div className="mb-4">
                <label htmlFor="frontCamera" className="block text-sm font-medium text-gray-700 mb-2">
                  Front Camera (for Gaze Tracking)
                </label>
                {cameras.length === 1 ? (
                  <div className="mt-1 p-2 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-700">
                      Using the only available camera: {cameras[0].label} ({cameras[0].facingMode})
                    </p>
                  </div>
                ) : (
                  <select
                    id="frontCamera"
                    value={selectedFrontCamera}
                    onChange={(e) => setSelectedFrontCamera(e.target.value)}
                    disabled={cameras.length === 0}
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md
                      ${cameras.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select a camera</option>
                    {cameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label} ({camera.facingMode})
                      </option>
                    ))}
                  </select>
                )}
                {cameras.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Click "Detect Cameras" to find available cameras
                  </p>
                )}
              </div>

              {/* Back Camera Selection - Only show if more than one camera is available */}
              {cameras.length > 1 && (
                <div className="mb-4">
                  <label htmlFor="backCamera" className="block text-sm font-medium text-gray-700 mb-2">
                    Back Camera
                  </label>
                  <select
                    id="backCamera"
                    value={selectedBackCamera}
                    onChange={(e) => setSelectedBackCamera(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select a camera</option>
                    {cameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label} ({camera.facingMode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={saveSettings}
                disabled={cameras.length === 0}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white
                  ${cameras.length === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
              >
                Save Camera Settings
              </button>
            </div>

            {/* Calibration Settings Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Calibration Settings</h2>
              <button
                onClick={clearCalibration}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear Calibration Data
              </button>
            </div>

            {/* Save Button */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={saveSettings}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save All Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 