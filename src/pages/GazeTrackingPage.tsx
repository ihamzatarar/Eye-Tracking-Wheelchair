import React from 'react';
import { Eye } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';

const GazeTrackingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Wheelchair Control</h1>
              <p className="text-gray-600">
                Control your wheelchair using gaze tracking technology.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-full bg-card dark:bg-card border border-[hsl(var(--border))]">
              <div className="p-6 text-center">
                <div className="mb-6">
                  <Eye size={64} className="mx-auto text-blue-600 mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Gaze Control System</h2>
                  <p className="text-gray-600 mb-6">
                    Use your eye movements to control the wheelchair. The system tracks your gaze to determine the direction of movement.
                  </p>
                  <Button
                    variant="primary"
                    size="large"
                    onClick={() => navigate('/wheelchair-control')}
                    className="w-full"
                  >
                    Start Gaze Control
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="bg-card dark:bg-card border border-[hsl(var(--border))]">
              <div className="space-y-4 p-6">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Safety Reminder</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-100">
                  Always ensure a clear path when operating the wheelchair. Use the pause button or look at the center area to stop immediately if needed.
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-100">
                  For emergency situations, use the physical emergency stop button on the wheelchair.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GazeTrackingPage;