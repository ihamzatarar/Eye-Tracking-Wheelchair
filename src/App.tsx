import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';
import CalibrationPage from './pages/CalibrationPage';
import CalibrationProcessPage from './pages/CalibrationProcessPage';
import BluetoothPage from './pages/BluetoothPage';
import GazeTrackingPage from './pages/GazeTrackingPage';
import WheelchairControlPage from './pages/WheelchairControlPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<WelcomePage />} />
          <Route path="calibration" element={<CalibrationPage />} />
          <Route path="bluetooth" element={<BluetoothPage />} />
          <Route path="gaze-tracking" element={<GazeTrackingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        
        {/* Routes without Layout */}
        <Route path="calibration/process" element={<CalibrationProcessPage />} />
        <Route path="wheelchair-control" element={<WheelchairControlPage />} />
      </Routes>
    </Router>
  );
}

export default App;