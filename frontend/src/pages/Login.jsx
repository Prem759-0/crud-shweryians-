import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.accessToken) {
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('currentUser', JSON.stringify({
          id: res.data._id,
          name: res.data.name,
          email: res.data.email
        }));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <motion.div
        className="brutal-panel"
        style={{ width: '100%', maxWidth: '420px', padding: '40px' }}
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '42px', marginBottom: '8px' }}>Login 💥</h2>
          <p style={{ fontFamily: 'var(--font-modern)', fontWeight: 'bold', fontSize: '16px' }}>
            POW! Get back to managing!
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              color: '#000',
              background: '#FF6B6B',
              padding: '12px 16px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '3px solid #000',
              boxShadow: '3px 3px 0px #000',
              marginBottom: '20px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-modern)'
            }}
          >
            ⚠️ {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '18px', fontFamily: 'var(--font-modern)', fontWeight: 'bold' }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              className="input-brutal"
              placeholder="HERO@MAIL.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '18px', fontFamily: 'var(--font-modern)', fontWeight: 'bold' }}>
              PASSWORD
            </label>
            <input
              type="password"
              className="input-brutal"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-brutal"
            style={{ marginTop: '10px', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'LOGGING IN... ⏳' : 'ENTER HQ 🦸'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '16px', fontFamily: 'var(--font-modern)', fontWeight: 'bold' }}>
            NEW HERO?{' '}
            <Link to="/register" style={{ color: 'var(--accent-color)', textDecoration: 'none', textShadow: '1px 1px 0px #000' }}>
              SIGN UP!
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
