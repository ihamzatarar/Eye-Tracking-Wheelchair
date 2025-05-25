import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, Sliders, Bluetooth, Gauge } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight">
              Control Your Mobility <br />
              <span className="text-blue-200">With Just Your Eyes</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 text-blue-50 leading-relaxed">
              GazeWheel enables independent movement through innovative gaze tracking technology, 
              providing freedom and autonomy for individuals with limited mobility.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/calibration')}
                className="gap-2 text-lg px-8 py-6 bg-white text-blue-700 hover:bg-blue-50 transition-all duration-300"
              >
                <Sliders className="h-6 w-6" />
                Start Calibration
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2 text-lg px-8 py-6 bg-transparent text-white border-2 border-white/30 hover:bg-white/10 transition-all duration-300"
                onClick={() => navigate('/bluetooth')}
              >
                <Bluetooth className="h-6 w-6" />
                Connect Wheelchair
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 dark:text-white">How GazeWheel Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="transition-transform duration-300 hover:transform hover:-translate-y-2 bg-card dark:bg-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-200 mb-4">
                    <Eye className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 dark:text-white">Eye Tracking</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Advanced cameras capture your eye movements with precision, allowing for intuitive control.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="transition-transform duration-300 hover:transform hover:-translate-y-2 bg-card dark:bg-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-200 mb-4">
                    <Sliders className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 dark:text-white">Smart Calibration</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Our system adapts to your unique eye movements for personalized control.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="transition-transform duration-300 hover:transform hover:-translate-y-2 bg-card dark:bg-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-200 mb-4">
                    <Bluetooth className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 dark:text-white">Wireless Connection</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Seamlessly connect to your wheelchair via Bluetooth for instant control.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="transition-transform duration-300 hover:transform hover:-translate-y-2 bg-card dark:bg-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-200 mb-4">
                    <Gauge className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 dark:text-white">Speed Control</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Easily adjust speed settings to match your comfort level and environment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 dark:text-white">Ready to Get Started?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Follow our simple setup process to start experiencing the freedom of gaze-controlled mobility.
            </p>
            
            <Card className="bg-card dark:bg-card">
              <CardContent className="pt-6">
                <ol className="space-y-4">
                  {[
                    { text: 'Calibrate the eye tracking system', path: '/calibration', icon: <Sliders className="h-4 w-4" /> },
                    { text: 'Connect to your wheelchair via Bluetooth', path: '/bluetooth', icon: <Bluetooth className="h-4 w-4" /> },
                    { text: 'Start controlling with your gaze', path: '/gaze-tracking', icon: <Gauge className="h-4 w-4" /> }
                  ].map((step, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-grow pt-1">
                        <p className="font-medium">{step.text}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 gap-2"
                          onClick={() => navigate(step.path)}
                        >
                          {step.icon}
                          Go to Step
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;