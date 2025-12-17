import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import CoupleDashboard from './components/CoupleDashboard';
import GuestPortal from './components/GuestPortal';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<CoupleDashboard />} />
          <Route path="/guest/:weddingId" element={<GuestPortal />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
