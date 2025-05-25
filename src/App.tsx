import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BluetoothProvider } from './context/BluetoothContext';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Lazy load all pages
const WelcomePage = React.lazy(() => import('./pages/WelcomePage'));
const CalibrationPage = React.lazy(() => import('./pages/CalibrationPage'));
const CalibrationProcessPage = React.lazy(() => import('./pages/CalibrationProcessPage'));
const BluetoothPage = React.lazy(() => import('./pages/BluetoothPage'));
const GazeTrackingPage = React.lazy(() => import('./pages/GazeTrackingPage'));
const WheelchairControlPage = React.lazy(() => import('./pages/WheelchairControlPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const DocumentationPage = React.lazy(() => import('./pages/DocumentationPage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage'));

// Loading component
const LoadingFallback = () => <LoadingScreen />;

const App: React.FC = () => {
  return (
    <BluetoothProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Routes with Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<WelcomePage />} />
              <Route path="calibration" element={<CalibrationPage />} />
              <Route path="bluetooth" element={<BluetoothPage />} />
              <Route path="gaze-tracking" element={<GazeTrackingPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            
            {/* Routes without Layout */}
            <Route path="calibration/process" element={<CalibrationProcessPage />} />
            <Route path="wheelchair-control" element={<WheelchairControlPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          </Routes>
        </Suspense>
      </Router>
    </BluetoothProvider>
  );
};

export default App;