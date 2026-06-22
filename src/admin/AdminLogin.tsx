import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import { appendAdminActivity } from '../services/adminActivityLog';

type AdminLoginProps = {
  onEnterDashboard?: () => void;
};

export function AdminLogin({ onEnterDashboard }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const adminSnapshot = {
      username: username.trim(),
      password: password.trim(),
      loggedInAt: new Date().toISOString(),
    };

    sessionStorage.setItem('junto-admin-access', 'true');
    sessionStorage.setItem('junto-admin-user', JSON.stringify(adminSnapshot));
    appendAdminActivity({
      category: 'login',
      title: 'Admin login',
      detail: `${adminSnapshot.username || 'Admin'} signed into the dashboard.`,
    });

    onEnterDashboard?.();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background:
          'radial-gradient(circle at top, rgba(124,92,252,0.16), transparent 35%), linear-gradient(180deg, #0f1117 0%, #090b10 100%)',
        color: '#e8eaf6',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'rgba(24, 26, 35, 0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg,#7c5cfc,#5b8af5)',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <Shield size={26} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(232,234,246,0.58)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Admin Access
            </div>
            <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.1 }}>Enter dashboard</h1>
          </div>
        </div>

        <p style={{ margin: '0 0 22px', color: 'rgba(232,234,246,0.65)', lineHeight: 1.6 }}>
          Leave the username and password blank if you want a quick entry. Press Enter or use the button below to open the admin dashboard.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(232,234,246,0.6)' }}>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="off"
              placeholder="Optional"
              style={{
                width: '100%',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#e8eaf6',
                padding: '14px 16px',
                outline: 'none',
                fontSize: 15,
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(232,234,246,0.6)' }}>Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="off"
              placeholder="Optional"
              style={{
                width: '100%',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#e8eaf6',
                padding: '14px 16px',
                outline: 'none',
                fontSize: 15,
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              marginTop: 6,
              border: 'none',
              borderRadius: 14,
              padding: '14px 18px',
              background: 'linear-gradient(135deg,#7c5cfc,#5b8af5)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            Enter Dashboard
            <ArrowRight size={18} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default AdminLogin;
