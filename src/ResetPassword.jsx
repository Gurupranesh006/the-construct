import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  // Supabase lands here with #access_token / #type=recovery in the URL hash.
  // The JS client auto-reads the session from the hash on load.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError('This reset link is invalid or has expired. Request a new one.');
      }
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <h2>Set a New Password</h2>
        <p className="auth-subtitle">Choose a new password for your account.</p>

        {error && <div className="auth-error">{error}</div>}
        {done && <div className="auth-info">Password updated. Redirecting to home...</div>}

        {!done && (
          <form onSubmit={handleUpdate}>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="auth-input"
            />
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <p className="auth-switch" style={{ marginTop: '20px' }}>
          <Link to="/" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
            Back to The Construct
          </Link>
        </p>
      </div>
    </div>
  );
}
