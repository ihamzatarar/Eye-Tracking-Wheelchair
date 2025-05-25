import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bluetooth, RefreshCw, Search, ArrowRight, Shield, Wifi, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "../lib/utils";
import ConnectionStatus from '../components/ConnectionStatus';
import { useBluetooth } from '../context/BluetoothContext';

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
  const { isConnected, bleDevice, bleCharacteristic, setConnectionState } = useBluetooth();
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(0);

  // Update connection status based on context
  useEffect(() => {
    if (isConnected && bleDevice && bleCharacteristic) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected, bleDevice, bleCharacteristic]);

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
      
      // Update the shared context
      setConnectionState(device.device, characteristic);
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
    if (bleDevice?.gatt?.connected) {
      try {
        // Send stop command before disconnecting
        if (bleCharacteristic) {
          const data = new TextEncoder().encode('S');
          await bleCharacteristic.writeValue(data);
        }
        await bleDevice.gatt?.disconnect();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    
    setConnectionState(null, null);
    setConnectionStatus('disconnected');
    setConnectedDevice(null);
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
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Bluetooth Connection</h1>
              <p className="text-muted-foreground">
                Connect to your wheelchair using Web Bluetooth for wireless control
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-full shadow-sm">
              <Bluetooth size={24} className={cn(
                connectionStatus === 'connected' ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className="text-sm font-medium">
                {connectionStatus === 'connected' ? 'Web Bluetooth Active' : 'Web Bluetooth Ready'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Available Devices</CardTitle>
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={scanForDevices}
                        disabled={isScanning}
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw size={16} className={cn(isScanning && 'animate-spin')} />
                        <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
                      </Button>
                      
                      {connectionStatus === 'connected' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={disconnectDevice}
                          className="flex items-center space-x-2"
                        >
                          <Wifi size={16} />
                          <span>Disconnect</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle size={20} className="mt-0.5" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Speed Control - Only visible when connected */}
                  {connectionStatus === 'connected' && (
                    <div className="mb-6 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="speedSlider" className="text-sm font-medium">
                          Speed Control
                        </label>
                        <span className="text-sm font-semibold">{speed}%</span>
                      </div>
                      <Slider
                        id="speedSlider"
                        min={0}
                        max={100}
                        value={[speed]}
                        onValueChange={(value) => handleSpeedChange(value[0])}
                        className="w-full"
                      />
                    </div>
                  )}

                  {isScanning ? (
                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
                      <Search size={40} className="mb-3 animate-pulse text-primary" />
                      <p className="text-sm font-medium">Scanning for nearby devices...</p>
                      <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
                    </div>
                  ) : devices.length === 0 ? (
                    <div className="py-12 text-center bg-muted/50 rounded-lg">
                      <Bluetooth size={40} className="mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">No devices found</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "Scan" to search for nearby devices</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {devices.map(device => (
                        <div 
                          key={device.deviceId} 
                          className={cn(
                            "p-4 rounded-lg border transition-colors",
                            connectedDevice?.deviceId === device.deviceId 
                              ? 'bg-primary/10 border-primary/20' 
                              : 'bg-card hover:bg-muted/50'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "p-2 rounded-full",
                                connectedDevice?.deviceId === device.deviceId 
                                  ? 'bg-primary/20' 
                                  : 'bg-muted'
                              )}>
                                <Bluetooth size={20} className={cn(
                                  connectedDevice?.deviceId === device.deviceId 
                                    ? 'text-primary' 
                                    : 'text-muted-foreground'
                                )} />
                              </div>
                              <div>
                                <p className="font-medium">{device.name}</p>
                                <p className="text-xs text-muted-foreground">ID: {device.deviceId.slice(0, 8)}...</p>
                              </div>
                            </div>
                            
                            {connectedDevice?.deviceId === device.deviceId ? (
                              <Badge variant="success">Connected</Badge>
                            ) : (
                              <Button
                                size="sm"
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
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConnectionStatus 
                    status={connectionStatus} 
                    deviceName={connectedDevice?.name}
                  />
                  
                  {connectionStatus === 'connected' && (
                    <div className="mt-6">
                      <Button 
                        size="sm" 
                        className="w-full flex items-center justify-center space-x-2"
                        onClick={() => navigate('/gaze-tracking')}
                      >
                        <span>Continue to Control</span>
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Shield size={20} className="text-primary" />
                    <CardTitle>Web Bluetooth Guide</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">1</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Ensure your browser supports Web Bluetooth (Chrome, Edge, or Opera)</p>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">2</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Grant Bluetooth permissions when prompted by your browser</p>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">3</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Keep the browser tab open to maintain the connection</p>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">4</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Use HTTPS or localhost for Web Bluetooth to work</p>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BluetoothPage;