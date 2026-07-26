import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Search, Menu, X, BookOpen, ChevronRight, FileText, ShieldAlert, CheckCircle2, Circle, Trophy, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import writeupsData from './writeupsData.json';
import { supabase } from './supabaseClient';

// Smooth Canvas Particles Component
const CanvasParticles = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const numParticles = 70;
    
    let mouse = { x: -1000, y: -1000, radius: 180 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const updateMouse = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', updateMouse);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 20) + 5;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
      }
      
      update() {
        // Natural movement
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if(this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if(this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

        // Mouse interaction (Repulse)
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let force = (mouse.radius - distance) / mouse.radius;
          let directionX = forceDirectionX * force * this.density;
          let directionY = forceDirectionY * force * this.density;
          
          // Smooth repulsion
          this.x -= directionX * 0.8;
          this.y -= directionY * 0.8;
        } 
      }

      draw() {
        ctx.fillStyle = 'rgba(123, 97, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        // Draw connecting lines between close particles
        for (let j = i; j < particles.length; j++) {
          let dx = particles[i].x - particles[j].x;
          let dy = particles[i].y - particles[j].y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(123, 97, 255, ${(1 - distance/120) * 0.3})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', updateMouse);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

// Interactive Cursor and Background Component
const InteractiveBackground = () => {
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const updateCursor = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target;
      const isClickable = 
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') || 
        target.closest('button') ||
        target.classList.contains('category-card-header');
        
      setIsPointer(isClickable);
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    window.addEventListener('mousemove', updateCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', updateCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <>
      <CanvasParticles />
      <div 
        className="interactive-bg-spotlight"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(123, 97, 255, 0.07), transparent 40%)`
        }}
      />
      
      <div 
        className={`new-custom-cursor ${isPointer ? 'hover' : ''} ${isClicked ? 'clicked' : ''}`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
      <div 
        className={`new-custom-cursor-outline ${isPointer ? 'hover' : ''} ${isClicked ? 'clicked' : ''}`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
    </>
  );
};

const getProgress = () => {
  const saved = localStorage.getItem('hacker-notebook-progress');
  return saved ? JSON.parse(saved) : {};
};

const saveProgress = (progress) => {
  localStorage.setItem('hacker-notebook-progress', JSON.stringify(progress));
};

const AuthModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnconfirmed(false);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // When email confirmation is enabled, signUp returns no session.
        if (!data.session) {
          setUnconfirmed(true);
          setInfo('Account created. Check your email to confirm your address.');
        } else {
          setInfo('Account created. You can now sign in.');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setInfo('Confirmation email resent. Check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}><X size={20} /></button>
        <h2>{isLogin ? 'Login to Sync' : 'Create Account'}</h2>
        <p className="auth-subtitle">Sync your progress securely across devices</p>
        
        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

        {forgotMode ? (
          <>
            <h2 style={{ marginTop: '10px' }}>Reset Password</h2>
            <p className="auth-subtitle">Enter your email and we'll send a reset link.</p>
            {resetSent ? (
              <div className="auth-info">
                Check your inbox for a password reset link. The link expires shortly.
              </div>
            ) : (
              <form onSubmit={handleReset}>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="auth-input"
                />
                <button type="submit" disabled={loading} className="auth-btn">
                  {loading ? 'Processing...' : 'Send Reset Link'}
                </button>
              </form>
            )}
            <p className="auth-switch" onClick={() => { setForgotMode(false); setResetSent(false); setInfo(null); }} style={{ marginTop: '20px' }}>
              Back to {isLogin ? 'Login' : 'Sign up'}
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleAuth}>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="auth-input"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="auth-input"
              />
              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
              </button>
            </form>

            {isLogin && (
              <p className="auth-switch" onClick={() => setForgotMode(true)} style={{ marginTop: '14px' }}>
                Forgot password?
              </p>
            )}

            {!isLogin && unconfirmed && (
              <p className="auth-switch" onClick={() => handleResend()} style={{ marginTop: '14px' }}>
                Didn't get the email? Resend confirmation
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-secondary)' }}>
              <hr style={{ flex: 1, borderColor: 'var(--glass-border)' }} />
              <span style={{ padding: '0 10px', fontSize: '0.85rem' }}>OR</span>
              <hr style={{ flex: 1, borderColor: 'var(--glass-border)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => handleOAuthLogin('google')} 
                disabled={loading} 
                className="auth-btn" 
                style={{ background: 'white', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign {isLogin ? 'in' : 'up'} with Google
              </button>
            </div>

            <p className="auth-switch" onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '20px' }}>
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const WriteupViewer = ({ content, categoryName, topic, progress, toggleTopic }) => {
  const isCompleted = progress[`${categoryName}/${topic.id}`] === true;

  return (
    <div className="content-container">
      <div className="content-header">
        <div className="breadcrumb">
          <span>Labs</span>
          <span className="breadcrumb-separator"><ChevronRight size={14} /></span>
          <Link to="/" style={{color: 'inherit', textDecoration: 'none'}}>{categoryName.replace(/-/g, ' ').toUpperCase()}</Link>
          <span className="breadcrumb-separator"><ChevronRight size={14} /></span>
          <span>{topic.title}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginTop: '20px' }}>
          <h1 className="page-title" style={{margin: 0, flex: '1 1 300px'}}>{topic.title}</h1>
          <button 
            className={`mark-done-btn ${isCompleted ? 'completed' : ''}`}
            onClick={() => toggleTopic(categoryName, topic.id)}
          >
            {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {isCompleted ? 'Completed' : 'Mark as Done'}
          </button>
        </div>
      </div>
      
      <div className="markdown-body">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeHighlight]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>{label}</p>
        <p style={{ margin: '8px 0 0', color: 'var(--accent-color)' }}>
          Completed: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

const InteractiveRoadmap = ({ progress, toggleTopic }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (catName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const totalTopics = writeupsData.reduce((acc, cat) => acc + cat.topics.length, 0);
  const completedTopics = Object.keys(progress).filter(k => progress[k]).length;
  const globalPercentage = Math.round((completedTopics / totalTopics) * 100) || 0;

  // Prepare data for Recharts
  const chartData = writeupsData.map(category => {
    const catTotal = category.topics.length;
    const catCompleted = category.topics.filter(t => progress[`${category.name}/${t.id}`]).length;
    const catPercentage = Math.round((catCompleted / catTotal) * 100) || 0;
    return {
      subject: category.name.replace(/-/g, ' '),
      A: catPercentage,
      fullMark: 100,
      completed: catCompleted,
      total: catTotal
    };
  });

  return (
    <div className="home-container" style={{ alignItems: 'flex-start', paddingTop: '20px' }}>
      <div className="roadmap-container" style={{ maxWidth: '1200px' }}>
        <div className="roadmap-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '20px' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '2.5rem' }}>
              <img src="/logo.jpg" alt="The Construct Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', boxShadow: '0 0 20px rgba(123, 97, 255, 0.4)' }} />
              The Construct
            </h1>
            <p className="home-desc" style={{ marginBottom: 0 }}>
              Visualize your mastery across different vulnerability classes.
            </p>
          </div>
          
          <div style={{ width: '100%', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {/* Horizontal Bar Chart for better readability */}
            <div style={{ flex: '1 1 100%', height: '600px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Module Progress Breakdown</h3>
                <div style={{ background: 'rgba(123, 97, 255, 0.1)', padding: '8px 16px', borderRadius: '20px', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                  Overall: {globalPercentage}%
                </div>
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-secondary)' }} hide={false} />
                  <YAxis type="category" dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} width={180} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="A" fill="var(--accent-color)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {writeupsData.map(category => {
            const catTotal = category.topics.length;
            const catCompleted = category.topics.filter(t => progress[`${category.name}/${t.id}`]).length;
            const catPercentage = Math.round((catCompleted / catTotal) * 100) || 0;
            const isExpanded = expandedCategories[category.name];

            return (
              <div key={category.name} className="category-card" style={{ alignSelf: 'start' }}>
                <div className="category-card-header" onClick={() => toggleCategory(category.name)}>
                  <div className="category-card-title" style={{ fontSize: '1.1rem' }}>
                    {isExpanded ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                    {category.name.replace(/-/g, ' ')}
                  </div>
                  <div className="category-stats">
                    <div className="progress-bar-container" style={{ width: '60px' }}>
                      <div className="progress-bar-fill" style={{ width: `${catPercentage}%`, background: catPercentage === 100 ? '#10b981' : '' }}></div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="topic-list">
                    {category.topics.map(topic => {
                      const isDone = progress[`${category.name}/${topic.id}`] === true;
                      return (
                        <div key={topic.id} className={`topic-item ${isDone ? 'completed' : ''}`} style={{ padding: '12px 20px' }}>
                          <div className="topic-info">
                            <input 
                              type="checkbox" 
                              className="custom-checkbox"
                              checked={isDone}
                              onChange={() => toggleTopic(category.name, topic.id)}
                            />
                            <Link to={`/${category.name}/${topic.id}`} className="topic-link" style={{ fontSize: '0.9rem' }}>
                              {topic.title}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [progress, setProgress] = useState(getProgress());
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProgress(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowAuth(false);
        fetchProgress(session.user.id);
      } else {
        setProgress(getProgress());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProgress = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('progress')
        .eq('id', userId)
        .single();
      
      if (data && data.progress) {
        const merged = { ...getProgress(), ...data.progress };
        setProgress(merged);
        saveProgress(merged);
      }
    } catch (err) {
      console.error('Error fetching progress', err);
    }
  };

  const syncProgressToDB = async (newProgress) => {
    if (!session) return;
    try {
      await supabase
        .from('profiles')
        .upsert({ id: session.user.id, progress: newProgress });
    } catch (err) {
      console.error('Error syncing progress:', err);
    }
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const toggleTopic = (categoryName, topicId) => {
    const key = `${categoryName}/${topicId}`;
    const newProgress = { ...progress, [key]: !progress[key] };
    setProgress(newProgress);
    saveProgress(newProgress);
    if (session) syncProgressToDB(newProgress);
  };

  const filteredData = writeupsData.map(category => {
    const filteredTopics = category.topics.filter(topic => 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...category, topics: filteredTopics };
  }).filter(category => category.topics.length > 0);

  return (
    <div className="app-container">
      <InteractiveBackground />
      
      {/* Top Right Auth Button */}
      <div style={{ position: 'fixed', top: '24px', right: '40px', zIndex: 100 }}>
        {!session && supabase && (
          <button 
            onClick={() => setShowAuth(true)} 
            style={{ background: 'rgba(123, 97, 255, 0.2)', border: '1px solid var(--accent-color)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, backdropFilter: 'blur(10px)', transition: 'all 0.2s', boxShadow: '0 0 15px rgba(123, 97, 255, 0.3)' }}
            onMouseOver={e => e.currentTarget.style.background='var(--accent-color)'}
            onMouseOut={e => e.currentTarget.style.background='rgba(123, 97, 255, 0.2)'}
          >
            Sign In to Sync
          </button>
        )}
        {session && supabase && (
          <button 
            onClick={() => supabase.auth.signOut()} 
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background='rgba(255, 255, 255, 0.1)'}
            onMouseOut={e => e.currentTarget.style.background='rgba(255, 255, 255, 0.05)'}
          >
            Sign Out
          </button>
        )}
      </div>

      <button className="mobile-nav-toggle" onClick={toggleSidebar}>
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/" style={{textDecoration: 'none'}}>
          <div className="sidebar-header" style={{cursor: 'pointer'}}>
            <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', boxShadow: '0 0 10px rgba(123, 97, 255, 0.4)' }} />
            <span className="sidebar-title">The Construct</span>
          </div>
        </Link>
        
        <div className="search-container">
          <Search className="search-icon" size={16} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search writeups..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <nav className="nav-links">
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          
          {filteredData.map((category) => (
            <div key={category.name} className="category-group">
              <h3 className="category-title">
                {category.name.replace(/-/g, ' ')}
              </h3>
              {category.topics.map((topic) => {
                const routePath = `/${category.name}/${topic.id}`;
                const isActive = location.pathname === routePath;
                const isCompleted = progress[`${category.name}/${topic.id}`];
                const shortTitle = topic.title.length > 22 ? topic.title.substring(0, 22) + '...' : topic.title;
                
                return (
                  <Link 
                    key={routePath} 
                    to={routePath} 
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={topic.title}
                  >
                    <FileText size={14} style={{ minWidth: '14px', color: isCompleted ? '#10b981' : 'inherit' }} />
                    <span style={{ color: isCompleted ? 'var(--text-secondary)' : 'inherit', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                      {shortTitle}
                    </span>
                    {isCompleted && <CheckCircle2 size={14} className="check-icon" style={{ marginLeft: 'auto' }} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<InteractiveRoadmap progress={progress} toggleTopic={toggleTopic} />} />
          
          {writeupsData.map(category => 
            category.topics.map(topic => (
              <Route 
                key={`/${category.name}/${topic.id}`}
                path={`/${category.name}/${topic.id}`}
                element={
                  <WriteupViewer 
                    content={topic.content} 
                    categoryName={category.name}
                    topic={topic}
                    progress={progress}
                    toggleTopic={toggleTopic}
                  />
                }
              />
            ))
          )}
          
          <Route path="*" element={
            <div className="home-container">
              <ShieldAlert size={80} color="var(--text-secondary)" style={{marginBottom: 20}} />
              <h1 className="home-title" style={{fontSize: '2rem'}}>404 - Not Found</h1>
              <p className="home-desc">The requested writeup does not exist.</p>
            </div>
          } />
        </Routes>
      </main>

      <footer style={{ marginTop: '40px', padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', borderTop: '1px solid var(--glass-border)' }}>
        <p style={{ margin: 0 }}>
          Writeup content adapted from{' '}
          <a href="https://github.com/thelicato/portswigger-labs" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
            thelicato/portswigger-labs
          </a>{' '}
          and{' '}
          <a href="https://portswigger.net/web-security" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
            PortSwigger Web Security Academy
          </a>.
        </p>
        <p style={{ margin: '6px 0 0' }}>Educational use only — not affiliated with or endorsed by PortSwigger.</p>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default App;
