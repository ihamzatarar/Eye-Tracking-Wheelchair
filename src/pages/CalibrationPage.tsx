import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, AlertTriangle } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';

const CalibrationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-20 pb-16 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">Gaze Calibration</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Follow the on-screen instructions to calibrate the eye tracking system for optimal performance.
          </p>

            <Card className="mb-8 bg-card dark:bg-card border border-[hsl(var(--border))]">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full text-blue-600 dark:text-blue-200">
                    <Eye size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 dark:text-white">Calibration Instructions</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      During calibration, you'll need to follow a dot on the screen with your eyes. 
                      The system will learn your eye movements to ensure accurate control.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded">
                  <div className="flex items-start">
                    <AlertTriangle size={20} className="text-yellow-500 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Before you begin:</h4>
                      <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-100 list-disc list-inside">
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

          <div className="bg-card dark:bg-card rounded-xl p-6 border border-[hsl(var(--border))]">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Calibration Tips</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200 mr-3 mt-0.5">
                  <span className="text-xs font-bold">1</span>
                </div>
                <p className="text-gray-700 dark:text-gray-200">Keep your eyes relaxed and blink naturally between calibration points</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200 mr-3 mt-0.5">
                  <span className="text-xs font-bold">2</span>
                </div>
                <p className="text-gray-700 dark:text-gray-200">If you wear glasses, make sure they're clean and positioned properly</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200 mr-3 mt-0.5">
                  <span className="text-xs font-bold">3</span>
                </div>
                <p className="text-gray-700 dark:text-gray-200">Recalibrate if you change your position or lighting conditions</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200 mr-3 mt-0.5">
                  <span className="text-xs font-bold">4</span>
                </div>
                <p className="text-gray-700 dark:text-gray-200">For best results, calibrate in the same environment where you'll use the system</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationPage;