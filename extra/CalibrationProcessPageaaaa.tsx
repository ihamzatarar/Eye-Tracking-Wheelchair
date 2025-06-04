import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CalibrationProcess.css';
import { initializeWebGazer, cleanupWebGazer } from '../utils/webgazerSetup';

const CALIBRATION_POINTS = 9;
const CALIBRATION_CLICKS = 3; // Number of clicks needed to calibrate

// Classic 9-point calibration grid, with top row moved further down and point 1 closer to point 2
const pointPositions = [
  { top: '15%', left: '27.5%' },    // Top-left (moved closer to center)
  { top: '15%', left: '50%' },     // Top-center
  { top: '15%', left: '95%' },     // Top-right
  { top: '50%', left: '5%' },      // Middle-left
  { top: '50%', left: '50%' },     // Center
  { top: '50%', left: '95%' },     // Middle-right
  { top: '95%', left: '5%' },      // Bottom-left
  { top: '95%', left: '50%' },     // Bottom-center
  { top: '95%', left: '95%' },     // Bottom-right
];

const CalibrationProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const [clickedCounts, setClickedCounts] = useState(Array(CALIBRATION_POINTS).fill(0));

  useEffect(() => {
    // Dummy handlers for now
    const onCalibrationPointClick = () => {};
    const onShowCalibrationPoint = () => {};
    const onPopUpInstruction = () => {};
    initializeWebGazer(onCalibrationPointClick, onShowCalibrationPoint, onPopUpInstruction);
    return () => {
      cleanupWebGazer();
    };
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleClearData = () => {
    setClickedCounts(Array(CALIBRATION_POINTS).fill(0));
  };

  const handlePointClick = (idx: number) => {
    setClickedCounts(prev => {
      const next = [...prev];
      next[idx] = Math.min(next[idx] + 1, CALIBRATION_CLICKS);
      return next;
    });
  };

  return (
    <div className="calibration-process-page">
      <nav className="calibration-navbar">
        <button className="back-btn" onClick={handleBack}>← Back</button>
        <button className="clear-btn" onClick={handleClearData}>🗑️ Clear Data</button>
      </nav>
      <div className="calibration-border-area">
        {pointPositions.map((pos, idx) => (
          <button
            key={idx}
            className={`calibration-point Calibration${clickedCounts[idx] === CALIBRATION_CLICKS ? ' calibrated' : ''}`}
            style={{
              ...pos,
              position: 'absolute',
              fontSize: 18,
              width: 40,
              height: 40,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => handlePointClick(idx)}
            disabled={clickedCounts[idx] === CALIBRATION_CLICKS}
          >
            {clickedCounts[idx] < CALIBRATION_CLICKS ? idx + 1 : '✓'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalibrationProcessPage; 