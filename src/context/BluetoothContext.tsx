import React, { createContext, useContext, useState, useEffect } from 'react';

interface BluetoothContextType {
  isConnected: boolean;
  bleDevice: BluetoothDevice | null;
  bleCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  setConnectionState: (device: BluetoothDevice | null, characteristic: BluetoothRemoteGATTCharacteristic | null) => void;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [bleDevice, setBleDevice] = useState<BluetoothDevice | null>(null);
  const [bleCharacteristic, setBleCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  const setConnectionState = (device: BluetoothDevice | null, characteristic: BluetoothRemoteGATTCharacteristic | null) => {
    setBleDevice(device);
    setBleCharacteristic(characteristic);
    setIsConnected(!!device && !!characteristic);
  };

  // Listen for disconnection events
  useEffect(() => {
    if (bleDevice) {
      const handleDisconnect = () => {
        setConnectionState(null, null);
      };

      bleDevice.addEventListener('gattserverdisconnected', handleDisconnect);
      return () => {
        bleDevice.removeEventListener('gattserverdisconnected', handleDisconnect);
      };
    }
  }, [bleDevice]);

  return (
    <BluetoothContext.Provider value={{
      isConnected,
      bleDevice,
      bleCharacteristic,
      setConnectionState
    }}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
}; 