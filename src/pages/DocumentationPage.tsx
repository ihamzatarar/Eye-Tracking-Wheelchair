import React, { useState, useEffect } from 'react';
import { ChevronRight, Menu, X, Book, Code, Settings, Users, Phone, AlertCircle, Zap, Shield, Accessibility } from 'lucide-react';

const DocumentationPage = () => {
  const [activeSection, setActiveSection] = useState('introduction');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const sections = [
    { id: 'introduction', title: 'Introduction', icon: Book },
    { id: 'features', title: 'Features', icon: Zap },
    { id: 'architecture', title: 'Architecture', icon: Code },
    { id: 'installation', title: 'Installation & Setup', icon: Settings },
    { id: 'usage', title: 'Usage Guide', icon: Users },
    { id: 'api', title: 'API Reference', icon: Code },
    { id: 'components', title: 'Components', icon: Code },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertCircle },
    { id: 'contact', title: 'Contact & Support', icon: Phone }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-50">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 z-30 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">GazeWheel</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Documentation</p>
        </div>
        
        <nav className="p-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  activeSection === section.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{section.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 px-4 py-8 max-w-4xl mx-auto">
        {/* Introduction Section */}
        <section id="introduction" className="mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              GazeWheel Documentation
            </h1>
            
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                GazeWheel is an innovative web application that enables hands-free wheelchair control using gaze-tracking technology. 
                Designed for users with limited mobility, it leverages modern web technologies to provide a safe, accessible, 
                and customizable control interface for powered wheelchairs.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">Target Users</h3>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                      <ChevronRight size={16} className="mr-2 mt-1 flex-shrink-0 text-blue-600" />
                      Individuals with motor impairments
                    </li>
                    <li className="flex items-start">
                      <ChevronRight size={16} className="mr-2 mt-1 flex-shrink-0 text-blue-600" />
                      Caregivers and healthcare professionals
                    </li>
                    <li className="flex items-start">
                      <ChevronRight size={16} className="mr-2 mt-1 flex-shrink-0 text-blue-600" />
                      Accessibility researchers
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3">Key Benefits</h3>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                      <ChevronRight size={16} className="mr-2 mt-1 flex-shrink-0 text-green-600" />
                      Independent mobility control
                    </li>
                    <li className="flex items-start">
                      <ChevronRight size={16} className="mr-2 mt-1 flex-shrink-0 text-green-600" />
                      Built-in safety features
                    </li>
                    <li className="flex items-start">
                      <ChevronRight size={16} className="mr-2 mt-1 flex-shrink-0 text-green-600" />
                      Fully accessible interface
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Features</h2>
          
          <div className="grid gap-6">
            {/* Gaze Tracking Feature */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg mr-4">
                  <Zap className="text-purple-600 dark:text-purple-300" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Gaze Tracking System</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Real-time eye tracking powered by WebGazer.js</li>
                <li>• 9-point calibration process for accuracy</li>
                <li>• Visual feedback on tracking precision</li>
                <li>• Automatic detection of tracking issues</li>
              </ul>
            </div>

            {/* Bluetooth Feature */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                  <Settings className="text-blue-600 dark:text-blue-300" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Bluetooth Connectivity</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Automatic device discovery</li>
                <li>• Persistent connection state handling</li>
                <li>• Standardized command protocol (F, B, L, R, S)</li>
                <li>• Automatic reconnection attempts</li>
              </ul>
            </div>

            {/* Safety Features */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg mr-4">
                  <Shield className="text-red-600 dark:text-red-300" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Safety Features</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Emergency stop button always accessible</li>
                <li>• Speed limits and restrictions</li>
                <li>• Automatic stop on signal loss</li>
                <li>• Safe center zone for stopping</li>
              </ul>
            </div>

            {/* Accessibility */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                  <Accessibility className="text-green-600 dark:text-green-300" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Accessibility</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• WCAG 2.1 Level AA compliant</li>
                <li>• Full keyboard navigation support</li>
                <li>• Screen reader compatible</li>
                <li>• High contrast and dark mode options</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Architecture</h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Technology Stack</h3>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 font-mono text-sm mb-6">
              <div className="space-y-2">
                <div><span className="text-blue-600 dark:text-blue-400">Frontend:</span> React 18 with TypeScript</div>
                <div><span className="text-blue-600 dark:text-blue-400">Build Tool:</span> Vite</div>
                <div><span className="text-blue-600 dark:text-blue-400">Styling:</span> Tailwind CSS</div>
                <div><span className="text-blue-600 dark:text-blue-400">State:</span> React Context API</div>
                <div><span className="text-blue-600 dark:text-blue-400">Routing:</span> React Router DOM v6</div>
                <div><span className="text-blue-600 dark:text-blue-400">Eye Tracking:</span> WebGazer.js</div>
                <div><span className="text-blue-600 dark:text-blue-400">Connectivity:</span> Web Bluetooth API</div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Project Structure</h3>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 font-mono text-sm overflow-x-auto">
              <pre className="text-gray-700 dark:text-gray-300">{`src/
├── components/          # Reusable UI components
│   ├── Layout.tsx
│   ├── Navbar.tsx
│   └── Footer.tsx
├── context/            # React Context providers
│   └── BluetoothContext.tsx
├── pages/              # Application pages
│   ├── WelcomePage.tsx
│   ├── CalibrationPage.tsx
│   ├── BluetoothPage.tsx
│   └── WheelchairControlPage.tsx
├── utils/              # Utility functions
│   └── webgazerSetup.ts
├── App.tsx            # Main app component
└── main.tsx           # Entry point`}</pre>
            </div>
          </div>
        </section>

        {/* Installation Section */}
        <section id="installation" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Installation & Setup</h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Prerequisites</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 mb-6">
              <li>Node.js version 16.0 or higher</li>
              <li>npm version 7.0 or higher</li>
              <li>Chrome or Edge browser (for Web Bluetooth)</li>
              <li>Webcam for gaze tracking</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Installation Steps</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">1. Clone the Repository</p>
                <code className="text-sm text-blue-600 dark:text-blue-400">
                  git clone &lt;repository-url&gt;<br />
                  cd gazewheel
                </code>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">2. Install Dependencies</p>
                <code className="text-sm text-blue-600 dark:text-blue-400">
                  npm install
                </code>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">3. Start Development Server</p>
                <code className="text-sm text-blue-600 dark:text-blue-400">
                  npm run dev
                </code>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">4. Build for Production</p>
                <code className="text-sm text-blue-600 dark:text-blue-400">
                  npm run build
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Guide Section */}
        <section id="usage" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Usage Guide</h2>
          
          <div className="space-y-6">
            {/* Getting Started */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Getting Started</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-300">
                <li>Open Chrome or Edge browser</li>
                <li>Navigate to the application URL</li>
                <li>Grant camera permissions when prompted</li>
                <li>Complete the welcome tour</li>
                <li>Proceed to calibration</li>
              </ol>
            </div>

            {/* Calibration Process */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Calibration Process</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Setup</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                    <li>• Position yourself comfortably</li>
                    <li>• Ensure good lighting</li>
                    <li>• Minimize head movement</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Calibration</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                    <li>• Click on each calibration point</li>
                    <li>• Look at the point while clicking</li>
                    <li>• Complete all 9 points</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Control Zones */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Control Zones</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto text-center">
                  <div className="col-start-2 bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Forward</span>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Left</span>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 rounded-lg p-4">
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">Stop</span>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Right</span>
                  </div>
                  <div className="col-start-2 bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Backward</span>
                  </div>
                </div>
                <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Look at a zone for 1 second to activate
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* API Reference Section */}
        <section id="api" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">API Reference</h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bluetooth Communication Protocol</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Service Configuration</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm">
                  <code className="text-blue-600 dark:text-blue-400">
                    const BLUETOOTH_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';<br />
                    const BLUETOOTH_CHARACTERISTIC_UUID = '87654321-4321-8765-4321-fedcba987654';
                  </code>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Command Structure</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-2">Command</th>
                        <th className="text-left py-2">Description</th>
                        <th className="text-left py-2">Example</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-400">
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-2">F</td>
                        <td className="py-2">Move Forward</td>
                        <td className="py-2 font-mono">sendCommand('F')</td>
                      </tr>
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-2">B</td>
                        <td className="py-2">Move Backward</td>
                        <td className="py-2 font-mono">sendCommand('B')</td>
                      </tr>
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-2">L</td>
                        <td className="py-2">Turn Left</td>
                        <td className="py-2 font-mono">sendCommand('L')</td>
                      </tr>
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-2">R</td>
                        <td className="py-2">Turn Right</td>
                        <td className="py-2 font-mono">sendCommand('R')</td>
                      </tr>
                      <tr>
                        <td className="py-2">S</td>
                        <td className="py-2">Stop</td>
                        <td className="py-2 font-mono">sendCommand('S')</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Components Section */}
        <section id="components" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Components Documentation</h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">BluetoothContext</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Manages Bluetooth connection state and operations throughout the application.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <code className="text-blue-600 dark:text-blue-400">
                  {`interface BluetoothContextType {
  device: BluetoothDevice | null;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendCommand: (command: string) => Promise<void>;
}`}
                </code>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Layout Component</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Main layout wrapper providing consistent structure across all pages.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <code className="text-blue-600 dark:text-blue-400">
                  {`interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  className?: string;
}`}
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section id="troubleshooting" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Troubleshooting</h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="space-y-6">
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Bluetooth Connection Issues
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <strong>Problem:</strong> Device not appearing in scan results
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 text-sm space-y-1">
                  <li>Ensure device is powered on and in pairing mode</li>
                  <li>Check browser permissions for Bluetooth</li>
                  <li>Verify HTTPS connection (required for Web Bluetooth)</li>
                </ul>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Gaze Tracking Issues
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <strong>Problem:</strong> Poor calibration accuracy
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 text-sm space-y-1">
                  <li>Improve lighting conditions</li>
                  <li>Reduce head movement during calibration</li>
                  <li>Clean camera lens</li>
                  <li>Adjust camera angle</li>
                </ul>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Performance Issues
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <strong>Problem:</strong> Laggy or unresponsive controls
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 text-sm space-y-1">
                  <li>Close unnecessary browser tabs</li>
                  <li>Update browser to latest version</li>
                  <li>Check CPU usage</li>
                  <li>Reduce video quality in settings</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Contact & Support</h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Developer Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Developer Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="font-semibold mr-2">Name:</span> Hamza Tarar
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="font-semibold mr-2">Email:</span>
                    <a href="mailto:ihamzatarar@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                      ihamzatarar@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="font-semibold mr-2">Phone:</span> +92 325 5525557
                  </div>
                  <div className="flex items-start text-gray-600 dark:text-gray-300">
                    <span className="font-semibold mr-2">Location:</span>
                    <span>Forman Christian College,<br />Lahore, Pakistan</span>
                  </div>
                </div>
              </div>

              {/* Online Presence */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Online Presence</h3>
                <div className="space-y-3">
                  <a href="https://ihamzatarar.github.io/portfolio/" target="_blank" rel="noopener noreferrer" 
                     className="flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                    <span className="font-semibold mr-2">Portfolio:</span> View Portfolio
                  </a>
                  <a href="https://github.com/ihamzatarar" target="_blank" rel="noopener noreferrer"
                     className="flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                    <span className="font-semibold mr-2">GitHub:</span> @ihamzatarar
                  </a>
                  <a href="https://www.linkedin.com/in/hamza-tarar/" target="_blank" rel="noopener noreferrer"
                     className="flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                    <span className="font-semibold mr-2">LinkedIn:</span> Hamza Tarar
                  </a>
                  <a href="https://x.com/ihamzatarar" target="_blank" rel="noopener noreferrer"
                     className="flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                    <span className="font-semibold mr-2">Twitter:</span> @ihamzatarar
                  </a>
                </div>
              </div>
            </div>

            {/* Support Channels */}
            <div className="mt-8 pt-8 border-t dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Support Channels</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Technical Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Create an issue on GitHub</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-300 mb-1">General Inquiries</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email: ihamzatarar@gmail.com</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-1">Feature Requests</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Submit via GitHub issues</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 dark:text-red-300 mb-1">Emergency</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone: +92 325 5525557</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center text-gray-600 dark:text-gray-400">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <p className="mb-2">
              © 2024 GazeWheel. Developed for educational and accessibility research purposes.
            </p>
            <p className="text-sm">
              Version 1.0.0 | Last Updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </footer>
      </main>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
        aria-label="Back to top"
      >
        <ChevronRight className="transform rotate-[-90deg]" size={24} />
      </button>
    </div>
  );
};

export default DocumentationPage;