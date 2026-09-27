import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, password }, { withCredentials: true });
      if (res.data.accessToken) {
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('currentUser', JSON.stringify({ id: res.data._id, name: res.data.name, email: res.data.email }));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="page-container">
      <motion.div 
        className="brutal-panel"
        style={{ width: '100%', maxWidth: '400px', padding: '40px' }}
        initial={{ opacity: 0, scale: 0.8, rotate: 2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '8px' }}>Register ✨</h2>
          <p style={{ fontFamily: 'var(--font-modern)', fontWeight: 'bold' }}>BOOM! Join the club!</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            style={{ color: '#000', background: 'var(--secondary-bg)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: 'var(--border-thick)', marginBottom: '15px', fontWeight: 'bold' }}
          >
            ❌ {error}
          </motion.div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '18px', fontFamily: 'var(--font-modern)', fontWeight: 'bold' }}>FULL NAME</label>
            <input 
              type="text" 
              className="input-brutal" 
              placeholder="BATMAN"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '18px', fontFamily: 'var(--font-modern)', fontWeight: 'bold' }}>EMAIL ADDRESS</label>
            <input 
              type="email" 
              className="input-brutal" 
              placeholder="BATMAN@CAVE.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '18px', fontFamily: 'var(--font-modern)', fontWeight: 'bold' }}>PASSWORD</label>
            <input 
              type="password" 
              className="input-brutal" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" className="btn-brutal btn-success" style={{ marginTop: '10px' }}>
            CREATE HERO 🔥
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '16px', fontFamily: 'var(--font-modern)', fontWeight: 'bold' }}>
            ALREADY A HERO?{' '}
            <Link to="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none', textShadow: '1px 1px 0px #000' }}>
              LOGIN
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
