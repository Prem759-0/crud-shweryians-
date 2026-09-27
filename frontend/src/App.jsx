import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls, Float, Box, Torus, Sphere, Text3D } from '@react-three/drei';
import MarqueePkg from 'react-fast-marquee';
const Marquee = MarqueePkg.default || MarqueePkg;
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function FloatingShapes({ isDarkMode }) {
  const wireColor = isDarkMode ? '#F1F2F6' : '#1A1A2E';
  
  return (
    <>
      <ambientLight intensity={isDarkMode ? 0.2 : 0.6} />
      <directionalLight position={[10, 10, 5]} intensity={isDarkMode ? 0.5 : 1.2} />
      
      <Float speed={2.5} rotationIntensity={3} floatIntensity={4} position={[-4, 2, -6]}>
        <Box args={[1.2, 1.2, 1.2]}>
          <meshStandardMaterial color={isDarkMode ? '#FF4757' : '#FF6B6B'} wireframe />
        </Box>
      </Float>

      <Float speed={1.5} rotationIntensity={2} floatIntensity={3} position={[6, -2, -8]}>
        <Torus args={[1.2, 0.4, 16, 32]}>
          <meshStandardMaterial color={isDarkMode ? '#FF7F50' : '#4D96FF'} />
        </Torus>
      </Float>
      
      <Float speed={3} rotationIntensity={1.5} floatIntensity={5} position={[-5, -4, -10]}>
        <Sphere args={[1.5, 32, 32]}>
          <meshStandardMaterial color={isDarkMode ? '#2ED573' : '#6BCB77'} wireframe />
        </Sphere>
      </Float>
      
      <Float speed={1} rotationIntensity={1} floatIntensity={2} position={[0, 4, -12]}>
         <Box args={[2, 0.5, 2]}>
           <meshStandardMaterial color={wireColor} wireframe />
         </Box>
      </Float>
    </>
  );
}

function Background3D({ isDarkMode }) {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <color attach="background" args={[isDarkMode ? '#0d0d17' : '#FFE57F']} />
        <Stars radius={100} depth={50} count={isDarkMode ? 3000 : 1000} factor={4} saturation={1} fade speed={1.5} />
        <FloatingShapes isDarkMode={isDarkMode} />
        <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} />
      </Canvas>
    </div>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage for preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  };

  return (
    <Router>
      <div style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000, background: 'var(--panel-bg)', borderBottom: 'var(--border-thick)' }}>
        <Marquee speed={60} gradient={false} style={{ padding: '8px 0', fontFamily: 'var(--font-modern)', fontWeight: 'bold', fontSize: '14px', color: 'var(--text-main)' }}>
          ⚡ WELCOME TO HQ ⚡ NEO-BRUTALIST EDITION ⚡ MANAGE YOUR PRODUCTS WITH STYLE ⚡ A7 TASK MANAGER VIBES ⚡ STAY AWESOME ⚡ 
        </Marquee>
      </div>

      <button 
        onClick={toggleDarkMode}
        className="btn-brutal"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '10px 15px',
          fontSize: '24px',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--panel-bg)',
          color: 'var(--text-main)'
        }}
        title="Toggle Dark Mode"
      >
        {isDarkMode ? '🌞' : '🌙'}
      </button>

      <Background3D isDarkMode={isDarkMode} />
      
      <div style={{ paddingTop: '40px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
