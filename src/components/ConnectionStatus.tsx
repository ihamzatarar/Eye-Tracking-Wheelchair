import React from 'react';
import { Bluetooth, BluetoothOff, Check, X } from 'lucide-react';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  deviceName?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, deviceName }) => {
  const statusConfig = {
    connected: {
      icon: <Check size={16} />,
      color: 'bg-green-500',
      text: 'Connected',
      description: deviceName ? `Connected to ${deviceName}` : 'Device connected successfully'
    },
    disconnected: {
      icon: <BluetoothOff size={16} />,
      color: 'bg-gray-400',
      text: 'Disconnected',
      description: 'No device connected'
    },
    connecting: {
      icon: <Bluetooth size={16} className="animate-pulse" />,
      color: 'bg-blue-500',
      text: 'Connecting',
      description: 'Attempting to connect...'
    },
    error: {
      icon: <X size={16} />,
      color: 'bg-red-500',
      text: 'Error',
      description: 'Connection failed'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center space-x-3">
      <div className={`${config.color} p-2 rounded-full text-white`}>
        {config.icon}
      </div>
      <div>
        <div className="font-medium text-gray-900">{config.text}</div>
        <div className="text-sm text-gray-500">{config.description}</div>
      </div>
    </div>
  );
};

export default ConnectionStatus;