import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bluetooth, RefreshCw, Search, ArrowRight, Shield, Wifi, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import ConnectionStatus from '../components/ConnectionStatus';

// Define our service and characteristic UUIDs (matching the eye-tracking car)
const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CHARACTERISTIC_UUID = "abcdef01-1234-5678-1234-56789abcdef0";

// Add custom window interface for global command access
declare global {
  interface Window {
    sendCommand?: (command: string) => Promise<void>;
  }
}

interface Device {
  deviceId: string;
  name: string;
  paired: boolean;
  device?: BluetoothDevice;
}

const BluetoothPage: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [bleCharacteristic, setBleCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  const scanForDevices = async () => {
    setIsScanning(true);
    setError(null);
    
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID]
      });

      // Add the device to our list if it's not already there
      const newDevice: Device = {
        deviceId: device.id,
        name: device.name || 'Unknown Device',
        paired: false,
        device: device
      };

      setDevices(prevDevices => {
        const exists = prevDevices.some(d => d.deviceId === device.id);
        if (!exists) {
          return [...prevDevices, newDevice];
        }
        return prevDevices;
      });

    } catch (error) {
      console.error('Bluetooth scanning failed:', error);
      setError('Failed to scan for devices. Make sure Bluetooth is enabled and permissions are granted.');
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: Device) => {
    if (!device.device) return;
    
    setConnectionStatus('connecting');
    setError(null);
    
    try {
      const server = await device.device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');
      
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
      
      setBleCharacteristic(characteristic);
      setConnectionStatus('connected');
      setConnectedDevice(device);
      
      // Update the device's paired status
      setDevices(prevDevices => 
        prevDevices.map(d => 
          d.deviceId === device.deviceId ? { ...d, paired: true } : d
        )
      );

    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus('error');
      setError('Failed to connect to device. Please try again.');
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice?.device?.gatt?.connected) {
      try {
        // Send stop command before disconnecting
        await sendCommand('S');
        await connectedDevice.device.gatt?.disconnect();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    
    setConnectionStatus('disconnected');
    setConnectedDevice(null);
    setBleCharacteristic(null);
    setSpeed(0);
    
    // Update the device's paired status
    setDevices(prevDevices => 
      prevDevices.map(d => 
        d.deviceId === connectedDevice?.deviceId ? { ...d, paired: false } : d
      )
    );
  };

  const sendCommand = async (command: string) => {
    if (!bleCharacteristic) {
      setError('Not connected to device');
      return;
    }

    try {
      const data = new TextEncoder().encode(command);
      await bleCharacteristic.writeValue(data);
      console.log(`Command sent successfully: ${command}`);
    } catch (error) {
      console.error(`Error sending command: ${error}`);
      setError(`Failed to send command: ${error}`);
    }
  };

  // Handle speed changes
  const handleSpeedChange = async (newSpeed: number) => {
    setSpeed(newSpeed);
    await sendCommand(`V${newSpeed}`);
  };

  // Expose sendCommand to parent components if needed
  useEffect(() => {
    if (window) {
      window.sendCommand = sendCommand;
    }
    return () => {
      if (window) {
        delete window.sendCommand;
      }
    };
  }, [bleCharacteristic]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Bluetooth Connection</h1>
              <p className="text-gray-600">
                Connect to your wheelchair using Web Bluetooth for wireless control
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Bluetooth size={24} className={`${connectionStatus === 'connected' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">
                {connectionStatus === 'connected' ? 'Web Bluetooth Active' : 'Web Bluetooth Ready'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white shadow-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Available Devices</h2>
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        size="small"
                        onClick={scanForDevices}
                        disabled={isScanning}
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
                        <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
                      </Button>
                      
                      {connectionStatus === 'connected' && (
                        <Button
                          variant="danger"
                          size="small"
                          onClick={disconnectDevice}
                          className="flex items-center space-x-2"
                        >
                          <Wifi size={16} />
                          <span>Disconnect</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle size={20} className="text-red-500 mt-0.5" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Speed Control - Only visible when connected */}
                  {connectionStatus === 'connected' && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="speedSlider" className="text-sm font-medium text-blue-900">
                          Speed Control
                        </label>
                        <span className="text-sm font-semibold text-blue-900">{speed}%</span>
                      </div>
                      <input
                        type="range"
                        id="speedSlider"
                        min="0"
                        max="100"
                        value={speed}
                        onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  )}

                  {isScanning ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                      <Search size={40} className="mb-3 animate-pulse text-blue-500" />
                      <p className="text-sm font-medium">Scanning for nearby devices...</p>
                      <p className="text-xs text-gray-400 mt-1">This may take a few moments</p>
                    </div>
                  ) : devices.length === 0 ? (
                    <div className="py-12 text-center bg-gray-50 rounded-lg">
                      <Bluetooth size={40} className="mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">No devices found</p>
                      <p className="text-xs text-gray-400 mt-1">Click "Scan" to search for nearby devices</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {devices.map(device => (
                        <div 
                          key={device.deviceId} 
                          className={`p-4 rounded-lg border transition-colors ${
                            connectedDevice?.deviceId === device.deviceId 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${
                                connectedDevice?.deviceId === device.deviceId 
                                  ? 'bg-blue-100' 
                                  : 'bg-gray-100'
                              }`}>
                                <Bluetooth size={20} className={
                                  connectedDevice?.deviceId === device.deviceId 
                                    ? 'text-blue-600' 
                                    : 'text-gray-500'
                                } />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{device.name}</p>
                                <p className="text-xs text-gray-500">ID: {device.deviceId.slice(0, 8)}...</p>
                              </div>
                            </div>
                            
                            {connectedDevice?.deviceId === device.deviceId ? (
                              <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                                Connected
                              </span>
                            ) : (
                              <Button
                                size="small"
                                onClick={() => connectToDevice(device)}
                                disabled={connectionStatus === 'connecting'}
                                className="flex items-center space-x-2"
                              >
                                <Wifi size={16} />
                                <span>Connect</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-white shadow-lg">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Connection Status</h2>
                  <ConnectionStatus 
                    status={connectionStatus} 
                    deviceName={connectedDevice?.name}
                  />
                  
                  {connectionStatus === 'connected' && (
                    <div className="mt-6">
                      <Button 
                        size="small" 
                        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate('/gaze-tracking')}
                      >
                        <span>Continue to Control</span>
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield size={20} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Web Bluetooth Guide</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">1</span>
                    </div>
                    <p className="text-sm text-gray-600">Ensure your browser supports Web Bluetooth (Chrome, Edge, or Opera)</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">2</span>
                    </div>
                    <p className="text-sm text-gray-600">Grant Bluetooth permissions when prompted by your browser</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">3</span>
                    </div>
                    <p className="text-sm text-gray-600">Keep the browser tab open to maintain the connection</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">4</span>
                    </div>
                    <p className="text-sm text-gray-600">Use HTTPS or localhost for Web Bluetooth to work</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BluetoothPage;