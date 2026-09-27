import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls, Float, Box, Torus, Sphere } from '@react-three/drei';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function FloatingShapes() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      <Float speed={2} rotationIntensity={2} floatIntensity={2} position={[-4, 2, -5]}>
        <Box args={[1, 1, 1]}>
          <meshStandardMaterial color="#FF6B6B" wireframe />
        </Box>
      </Float>

      <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2} position={[5, -2, -8]}>
        <Torus args={[1, 0.3, 16, 32]}>
          <meshStandardMaterial color="#4D96FF" />
        </Torus>
      </Float>
      
      <Float speed={3} rotationIntensity={1} floatIntensity={3} position={[-5, -3, -10]}>
        <Sphere args={[1, 32, 32]}>
          <meshStandardMaterial color="#6BCB77" wireframe />
        </Sphere>
      </Float>
    </>
  );
}

function Background3D() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <color attach="background" args={['#FFE57F']} />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={1} fade speed={1} />
        <FloatingShapes />
        <OrbitControls autoRotate autoRotateSpeed={1} enableZoom={false} />
      </Canvas>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#fff',
          color: '#000',
          border: '4px solid #000',
          boxShadow: '4px 4px 0px #000',
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 'bold',
          fontSize: '16px'
        }
      }} />
      <Background3D />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
