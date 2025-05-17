import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, Sliders, Bluetooth, Gauge } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Control Your Mobility <br />With Just Your Eyes
          </h1>
          <p className="text-xl max-w-2xl mb-10 opacity-90">
            GazeWheel enables independent movement through innovative gaze tracking technology, 
            providing freedom and autonomy for individuals with limited mobility.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="large" 
              onClick={() => navigate('/calibration')}
              icon={<Sliders size={20} />}
            >
              Start Calibration
            </Button>
            <Button 
              variant="outline" 
              size="large" 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => navigate('/bluetooth')}
              icon={<Bluetooth size={20} />}
            >
              Connect Wheelchair
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">How GazeWheel Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border border-gray-100 transition-transform duration-300 hover:transform hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <Eye size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Eye Tracking</h3>
                <p className="text-gray-600">
                  Advanced cameras capture your eye movements with precision, allowing for intuitive control.
                </p>
              </div>
            </Card>
            
            <Card className="border border-gray-100 transition-transform duration-300 hover:transform hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <Sliders size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Calibration</h3>
                <p className="text-gray-600">
                  Our system adapts to your unique eye movements for personalized control.
                </p>
              </div>
            </Card>
            
            <Card className="border border-gray-100 transition-transform duration-300 hover:transform hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <Bluetooth size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Wireless Connection</h3>
                <p className="text-gray-600">
                  Seamlessly connect to your wheelchair via Bluetooth for instant control.
                </p>
              </div>
            </Card>
            
            <Card className="border border-gray-100 transition-transform duration-300 hover:transform hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <Gauge size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Speed Control</h3>
                <p className="text-gray-600">
                  Easily adjust speed settings to match your comfort level and environment.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Follow our simple setup process to start experiencing the freedom of gaze-controlled mobility.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <ol className="space-y-4">
                {[
                  { text: 'Calibrate the eye tracking system', path: '/calibration', icon: <Sliders size={18} /> },
                  { text: 'Connect to your wheelchair via Bluetooth', path: '/bluetooth', icon: <Bluetooth size={18} /> },
                  { text: 'Start controlling with your gaze', path: '/gaze-tracking', icon: <Gauge size={18} /> }
                ].map((step, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-grow pt-1">
                      <p className="font-medium">{step.text}</p>
                      <Button 
                        variant="outline" 
                        size="small" 
                        className="mt-2"
                        onClick={() => navigate(step.path)}
                        icon={step.icon}
                      >
                        Go to Step <ChevronRight size={14} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;