import React, { useState } from 'react';
import { Gauge } from 'lucide-react';

interface SpeedControlProps {
  onChange: (speed: number) => void;
  initialSpeed?: number;
}

const SpeedControl: React.FC<SpeedControlProps> = ({ 
  onChange, 
  initialSpeed = 50 
}) => {
  const [speed, setSpeed] = useState(initialSpeed);
  
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseInt(e.target.value);
    setSpeed(newSpeed);
    onChange(newSpeed);
  };
  
  const getSpeedColor = () => {
    if (speed < 30) return 'text-green-500';
    if (speed < 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Gauge size={24} className={getSpeedColor()} />
          <h3 className="text-lg font-semibold">Speed Control</h3>
        </div>
        <div className={`text-xl font-bold ${getSpeedColor()}`}>
          {speed}%
        </div>
      </div>
      
      <div className="space-y-4">
        <input
          type="range"
          min="0"
          max="100"
          value={speed}
          onChange={handleSpeedChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        
        <div className="flex justify-between text-sm text-gray-500">
          <span>Slow</span>
          <span>Medium</span>
          <span>Fast</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[25, 50, 75].map(presetSpeed => (
            <button
              key={presetSpeed}
              onClick={() => {
                setSpeed(presetSpeed);
                onChange(presetSpeed);
              }}
              className={`py-2 px-3 rounded border text-sm font-medium transition-colors
                ${speed === presetSpeed 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              {presetSpeed}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpeedControl;