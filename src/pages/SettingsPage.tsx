import React, { useState, useEffect } from 'react';
import { Gauge, Camera, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../components/ui/alert-dialog";
import { cn } from '../lib/utils';

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
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedFrontCamera, setSelectedFrontCamera] = useState<string>('');
  const [selectedBackCamera, setSelectedBackCamera] = useState<string>('');
  const [isDetectingCameras, setIsDetectingCameras] = useState(false);
  const [wheelchairSettings, setWheelchairSettings] = useState<WheelchairSettings>(DEFAULT_WHEELCHAIR_SETTINGS);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'destructive' | null>(null);

  useEffect(() => {
    loadSavedSettings();
  }, []);

  useEffect(() => {
    if (alertMessage) {
      const timeout = setTimeout(() => setAlertMessage(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [alertMessage]);

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

      // Check if user has already chosen cameras
      const savedFrontCamera = localStorage.getItem('frontCameraId');
      const savedBackCamera = localStorage.getItem('backCameraId');

      if (videoDevices.length === 1) {
        setSelectedFrontCamera(videoDevices[0].deviceId);
        setSelectedBackCamera(''); // Clear back camera selection
        // Save settings immediately
        localStorage.setItem('frontCameraId', videoDevices[0].deviceId);
        localStorage.setItem('backCameraId', '');
      } else if (videoDevices.length >= 2) {
        // Only auto-select if user hasn't chosen yet
        if (!savedFrontCamera && !savedBackCamera) {
          setSelectedFrontCamera(videoDevices[0].deviceId);
          setSelectedBackCamera(videoDevices[1].deviceId);
          localStorage.setItem('frontCameraId', videoDevices[0].deviceId);
          localStorage.setItem('backCameraId', videoDevices[1].deviceId);
        }
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
    setAlertMessage('Settings saved successfully!');
    setAlertType('success');
  };

  const handleClearCalibration = () => {
    localStorage.removeItem('calibrationData');
    setAlertMessage('Calibration data has been cleared successfully.');
    setAlertType('success');
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
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Settings</h1>
              <p className="text-gray-600">
                Configure your wheelchair and camera settings for optimal performance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wheelchair Settings Card */}
            <Card className="h-full bg-card dark:bg-card border border-[hsl(var(--border))]">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Gauge size={20} className="text-blue-600" />
                  <CardTitle>Wheelchair Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {alertMessage && (
                  <Alert variant={alertType === 'destructive' ? 'destructive' : 'default'} className="mb-4">
                    <AlertTitle>{alertType === 'destructive' ? 'Error' : 'Success'}</AlertTitle>
                    <AlertDescription>{alertMessage}</AlertDescription>
                  </Alert>
                )}
                
                {/* Default Speed */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Default Speed ({wheelchairSettings.defaultSpeed}%)
                  </label>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[wheelchairSettings.defaultSpeed]}
                    onValueChange={([v]) => handleWheelchairSettingChange('defaultSpeed', v)}
                    className="text-blue-600"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>

                {/* Speed Presets */}
                <div className="grid grid-cols-3 gap-2">
                  {[25, 50, 75].map(presetSpeed => (
                    <Button
                      key={presetSpeed}
                      variant={wheelchairSettings.defaultSpeed === presetSpeed ? 'default' : 'outline'}
                      onClick={() => handleWheelchairSettingChange('defaultSpeed', presetSpeed)}
                      className={cn(
                        "w-full",
                        wheelchairSettings.defaultSpeed === presetSpeed 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "hover:bg-blue-50 hover:text-blue-600 border-blue-200"
                      )}
                    >
                      {presetSpeed}%
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Camera Settings Card */}
            <Card className="bg-card dark:bg-card border border-[hsl(var(--border))]">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Camera size={20} className="text-blue-600" />
                  <CardTitle>Camera Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {/* Detect Cameras Button */}
                <div className="mb-6">
                  <Button
                    onClick={loadCameras}
                    disabled={isDetectingCameras}
                    variant="default"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white"
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
                  </Button>
                  {cameras.length > 0 && (
                    <span className="ml-3 text-sm text-muted-foreground">
                      {cameras.length} camera{cameras.length !== 1 ? 's' : ''} detected
                    </span>
                  )}
                </div>

                {/* Front Camera Selection */}
                <div className="mb-4">
                  <label htmlFor="frontCamera" className="block text-sm font-medium mb-2">
                    Front Camera (for Gaze Tracking)
                  </label>
                  {cameras.length === 1 ? (
                    <Alert className="mt-1">
                      <AlertTitle>Using the only available camera</AlertTitle>
                      <AlertDescription>
                        {cameras[0].label} ({cameras[0].facingMode})
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <select
                      id="frontCamera"
                      value={selectedFrontCamera}
                      onChange={(e) => setSelectedFrontCamera(e.target.value)}
                      disabled={cameras.length === 0}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm"
                    >
                      <option value="">Select a camera</option>
                      {cameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label} ({camera.facingMode})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Back Camera Selection */}
                {cameras.length > 1 && (
                  <div className="mb-4">
                    <label htmlFor="backCamera" className="block text-sm font-medium mb-2">
                      Back Camera
                    </label>
                    <select
                      id="backCamera"
                      value={selectedBackCamera}
                      onChange={(e) => setSelectedBackCamera(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm"
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

                {/* Calibration Settings */}
                <div className="mt-6">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full hover:bg-red-50 hover:text-red-600 border-red-200">
                        <AlertTriangle size={16} className="mr-2" />
                        Clear Calibration Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all calibration data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCalibration} className="bg-red-600 hover:bg-red-700 text-white">
                          Yes, clear it
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Save Button */}
                <Button
                  onClick={saveSettings}
                  disabled={cameras.length === 0}
                  variant="default"
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 