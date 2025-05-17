import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, AlertTriangle } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';

const CalibrationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Gaze Calibration</h1>
          <p className="text-gray-600 mb-8">
            Follow the on-screen instructions to calibrate the eye tracking system for optimal performance.
          </p>

            <Card className="mb-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <Eye size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Calibration Instructions</h3>
                    <p className="text-gray-600">
                      During calibration, you'll need to follow a dot on the screen with your eyes. 
                      The system will learn your eye movements to ensure accurate control.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex items-start">
                    <AlertTriangle size={20} className="text-yellow-500 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Before you begin:</h4>
                      <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                        <li>Make sure you're in a well-lit environment</li>
                        <li>Position yourself 50-70cm from the screen</li>
                        <li>Keep your head relatively still during calibration</li>
                        <li>Remove glasses or contacts if possible</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button 
                  size="large" 
                  className="w-full" 
                onClick={() => navigate('/calibration/process')}
                  icon={<Zap size={20} />}
                >
                  Start Calibration
                </Button>
              </div>
            </Card>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Calibration Tips</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                  <span className="text-xs font-bold">1</span>
                </div>
                <p className="text-gray-700">Keep your eyes relaxed and blink naturally between calibration points</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                  <span className="text-xs font-bold">2</span>
                </div>
                <p className="text-gray-700">If you wear glasses, make sure they're clean and positioned properly</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                  <span className="text-xs font-bold">3</span>
                </div>
                <p className="text-gray-700">Recalibrate if you change your position or lighting conditions</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                  <span className="text-xs font-bold">4</span>
                </div>
                <p className="text-gray-700">For best results, calibrate in the same environment where you'll use the system</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationPage;