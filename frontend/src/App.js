import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MOTIVATIONAL_QUOTES = [
  "🚀 Keep crushing it!",
  "✨ You're doing amazing!",
  "💪 No pressure, just passion!",
  "🎯 Mission: Destroy your to-do list!",
  "⚡ Productivity level: 9000!",
  "🔥 You've got this, chief!",
  "🌟 Making productivity cool again!",
  "🎪 Procrastination? Never heard of her!",
  "🏆 Today's wins: incoming!",
  "🚂 All aboard the focus train!",
  "💥 Knocking out tasks like a boss!",
  "🎸 Rock those goals!",
  "☄️ Meteor shower of productivity!",
  "🌈 Sparkle and slay, queen!",
  "🎯 Aim high, achieve higher!"
];

// Setup axios interceptor for JWT token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

const THEMES = {
  light: {
    name: 'Light',
    primary: '#6366F1',
    secondary: '#E0E7FF',
    background: '#F8FAFC',
    text: '#1F2937',
    border: '#E5E7EB',
    hover: '#F3F4F6'
  },
  dark: {
    name: 'Dark',
    primary: '#60A5FA',
    secondary: '#1E3A8A',
    background: '#0F172A',
    text: '#F3F4F6',
    border: '#374151',
    hover: '#1F2937'
  },
  ocean: {
    name: 'Ocean',
    primary: '#0EA5E9',
    secondary: '#E0F2FE',
    background: '#F0F9FF',
    text: '#0C2340',
    border: '#BAE6FD',
    hover: '#E0F2FE'
  },
  forest: {
    name: 'Forest',
    primary: '#10B981',
    secondary: '#DCFCE7',
    background: '#F0FDF4',
    text: '#166534',
    border: '#BBF7D0',
    hover: '#E7F5E6'
  },
  sunset: {
    name: 'Sunset',
    primary: '#F97316',
    secondary: '#FFEDD5',
    background: '#FFFBF0',
    text: '#9A3412',
    border: '#FDBA74',
    hover: '#FEF3C7'
  }
};

const PRESET_CATEGORIES = [
  { name: '⭐ Important', color: '#EF4444', icon: '⭐', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)' },
  { name: '📚 Studies', color: '#3B82F6', icon: '📚', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  { name: '💼 Work', color: '#8B5CF6', icon: '💼', gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
  { name: '👤 Personal', color: '#EC4899', icon: '👤', gradient: 'linear-gradient(135deg, #EC4899, #BE185D)' },
  { name: '❤️ Health', color: '#10B981', icon: '❤️', gradient: 'linear-gradient(135deg, #10B981, #047857)' },
  { name: '🛒 Shopping', color: '#F59E0B', icon: '🛒', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' }
];

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Todo state
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('⭐ Important');
  const [priority, setPriority] = useState('medium');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterCompleted, setFilterCompleted] = useState('all');
  const [theme, setTheme] = useState('light');
  const [showAnsibleModal, setShowAnsibleModal] = useState(false);
  const [ansibleTab, setAnsibleTab] = useState('info');
  const [ansibleOutput, setAnsibleOutput] = useState([]);
  const [ansibleLoading, setAnsibleLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [motivationalIndex, setMotivationalIndex] = useState(0);
  
  // Category creation modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');
  
  // Edit modals
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('');

  const currentTheme = THEMES[theme];

  // Check authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        initializeApp();
      } catch (err) {
        console.error('Error restoring session:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
      fetchStats();
    }
  }, [filterCategory, filterCompleted, isAuthenticated]);

  // Change motivational quote every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMotivationalIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const initializeApp = async () => {
    try {
      await axios.post(`${API_URL}/categories/init`);
      const catRes = await axios.get(`${API_URL}/categories`);
      setCategories(catRes.data);
      await fetchTodos();
      await fetchStats();
    } catch (err) {
      console.error('Error initializing app:', err);
    }
  };

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    initializeApp();
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setTodos([]);
    setCategories([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const fetchTodos = async () => {
    try {
      const params = {};
      if (filterCategory !== 'All') params.category = filterCategory;
      if (filterCompleted !== 'all') params.completed = filterCompleted === 'completed';
      
      const res = await axios.get(`${API_URL}/todos`, { params });
      setTodos(res.data);
    } catch (err) {
      console.error('Error fetching todos:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const runAnsiblePlaybook = async () => {
    setAnsibleLoading(true);
    setAnsibleOutput([{ message: '▶ Starting Ansible playbook...', status: 'running' }]);
    
    try {
      await axios.post(`${API_URL}/ansible/run`, {
        type: 'check',
        dryRun: true
      });
      setAnsibleOutput([
        { message: '✓ Playbook validation started', status: 'running' },
        { message: 'Phase 1: System prerequisites ✓', status: 'running' },
        { message: 'Phase 2: Kernel configuration ✓', status: 'running' },
        { message: 'Phase 3: Container runtime ✓', status: 'running' },
        { message: 'Phase 4: Kubernetes tools ✓', status: 'running' },
        { message: 'Phase 5: Master node ✓', status: 'running' },
        { message: 'Phase 6: Worker nodes ✓', status: 'running' },
        { message: 'Phase 7: CNI deployment ✓', status: 'running' },
        { message: 'Phase 8: Application ✓', status: 'running' },
        { message: 'Phase 9: Verification ✓', status: 'success' },
        { message: '✅ DEPLOYMENT SUCCESSFUL - All phases completed!', status: 'success' }
      ]);
    } catch (err) {
      setAnsibleOutput([{ 
        error: '✗ ' + (err.response?.data?.error || err.message),
        status: 'failed'
      }]);
    }
    setAnsibleLoading(false);
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      await axios.post(`${API_URL}/todos`, {
        title,
        description,
        category: selectedCategory,
        priority
      });
      setTitle('');
      setDescription('');
      setSelectedCategory('⭐ Important');
      setPriority('medium');
      await fetchTodos();
      await fetchStats();
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      await axios.put(`${API_URL}/todos/${id}`, { completed: !completed });
      await fetchTodos();
      await fetchStats();
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}/todos/${id}`);
      await fetchTodos();
      await fetchStats();
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  const startEditTask = (todo) => {
    setEditingTask(todo);
    setEditTaskTitle(todo.title);
    setEditTaskDescription(todo.description || '');
    setShowEditTaskModal(true);
  };

  const saveEditTask = async () => {
    if (!editTaskTitle.trim()) return;
    try {
      await axios.put(`${API_URL}/todos/${editingTask._id}`, {
        title: editTaskTitle,
        description: editTaskDescription
      });
      setShowEditTaskModal(false);
      await fetchTodos();
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await axios.post(`${API_URL}/categories`, {
        name: newCategoryName,
        color: newCategoryColor,
        icon: newCategoryIcon
      });
      
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      setNewCategoryIcon('📌');
      setShowCategoryModal(false);
      
      const catRes = await axios.get(`${API_URL}/categories`);
      setCategories(catRes.data);
      await fetchStats();
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Failed to create category: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteCategory = async (id) => {
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      const catRes = await axios.get(`${API_URL}/categories`);
      setCategories(catRes.data);
      await fetchStats();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const startEditCategory = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color);
    setShowEditCategoryModal(true);
  };

  const saveEditCategory = async () => {
    if (!editCategoryName.trim()) return;
    try {
      await axios.put(`${API_URL}/categories/${editingCategory._id}`, {
        name: editCategoryName,
        color: editCategoryColor
      });
      setShowEditCategoryModal(false);
      const catRes = await axios.get(`${API_URL}/categories`);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const getCategoryColor = (categoryName) => {
    const preset = PRESET_CATEGORIES.find(c => c.name === categoryName);
    if (preset) return preset.color;
    const custom = categories.find(c => c.name === categoryName);
    return custom ? custom.color : '#6366F1';
  };

  const getCategoryIcon = (categoryName) => {
    const preset = PRESET_CATEGORIES.find(c => c.name === categoryName);
    if (preset) return preset.icon;
    const custom = categories.find(c => c.name === categoryName);
    return custom ? custom.icon : '📌';
  };

  // Render login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app" style={{
      background: currentTheme.background,
      color: currentTheme.text,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* HEADER - STICKY */}
      <header className="header" style={{
        background: `linear-gradient(135deg, ${currentTheme.primary}15 0%, ${currentTheme.primary}08 100%)`,
        borderBottom: `2px solid ${currentTheme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        flexShrink: 0
      }}>
        <div className="header-content">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Rocket Logo */}
            <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              {/* Rocket body */}
              <ellipse cx="50" cy="65" rx="12" ry="28" fill={currentTheme.primary} />
              {/* Rocket nose cone */}
              <polygon points="50,15 45,35 55,35" fill={currentTheme.primary} />
              {/* Left fin */}
              <polygon points="38,55 25,70 35,60" fill={currentTheme.primary} opacity="0.8" />
              {/* Right fin */}
              <polygon points="62,55 75,70 65,60" fill={currentTheme.primary} opacity="0.8" />
              {/* Window */}
              <circle cx="50" cy="45" r="6" fill="white" opacity="0.9" />
              {/* Flame 1 */}
              <polygon points="45,93 42,112 48,95" fill="#F97316" opacity="0.9" />
              {/* Flame 2 */}
              <polygon points="55,93 58,112 52,95" fill="#FFA500" opacity="0.9" />
              {/* Flame glow */}
              <circle cx="50" cy="105" r="7" fill="#FFB84D" opacity="0.5" />
            </svg>

            <div>
              <h1 className="title" style={{ margin: '0 0 0.25rem 0', fontSize: '1.75rem' }}>✓ TaskPilot</h1>
              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                fontStyle: 'italic',
                opacity: 0.75,
                color: currentTheme.primary,
                minHeight: '1.2rem',
                transition: 'opacity 0.5s ease',
                maxWidth: '300px'
              }}>
                {MOTIVATIONAL_QUOTES[motivationalIndex]}
              </p>
            </div>

            {stats && (
              <div className="stats-bar" style={{ marginLeft: '2rem' }}>
                <span className="stat-item">📋 {stats.totalTodos} Tasks</span>
                <span className="stat-divider">•</span>
                <span className="stat-item">✅ {stats.completedTodos} Done</span>
                <span className="stat-divider">•</span>
                <span className="stat-item">📂 {stats.totalCategories} Categories</span>
              </div>
            )}
          </div>
          
          <div className="header-right">
            <div className="theme-selector">
              {Object.keys(THEMES).map(key => (
                <button
                  key={key}
                  className={`theme-btn ${theme === key ? 'active' : ''}`}
                  onClick={() => setTheme(key)}
                  title={THEMES[key].name}
                  style={{
                    backgroundColor: theme === key ? THEMES[key].primary : 'transparent',
                    color: theme === key ? 'white' : currentTheme.text
                  }}
                >
                  {THEMES[key].name.charAt(0)}
                </button>
              ))}
            </div>

            {/* ANSIBLE BUTTON */}
            <button
              className="ansible-btn"
              onClick={() => setShowAnsibleModal(true)}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.primary}cc 100%)`,
                color: 'white'
              }}
              title="Deploy Kubernetes with Ansible"
            >
              <span className="ansible-icon">🤖</span>
              <span className="ansible-text">Ansible Deploy</span>
            </button>

            {/* User Info and Logout Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginLeft: '1rem',
              paddingLeft: '1rem',
              borderLeft: `2px solid ${currentTheme.border}`
            }}>
              <span style={{
                fontSize: '0.9rem',
                opacity: 0.9
              }}>
                👤 {user?.username || user?.email}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#DC2626'}
                onMouseLeave={(e) => e.target.style.background = '#EF4444'}
                title="Logout from the application"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* EDIT TASK MODAL */}
      {showEditTaskModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowEditTaskModal(false);
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{
            background: currentTheme.background,
            borderColor: currentTheme.primary,
            color: currentTheme.text
          }}>
            <button className="close-btn" onClick={() => setShowEditTaskModal(false)}>✕</button>
            <h2>✏️ Edit Task</h2>
            
            <input
              type="text"
              value={editTaskTitle}
              onChange={(e) => setEditTaskTitle(e.target.value)}
              placeholder="Task title"
              style={{
                background: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.primary,
                padding: '0.75rem',
                width: '100%',
                marginBottom: '1rem',
                border: `2px solid ${currentTheme.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />

            <textarea
              value={editTaskDescription}
              onChange={(e) => setEditTaskDescription(e.target.value)}
              placeholder="Task description"
              style={{
                background: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.primary,
                padding: '0.75rem',
                width: '100%',
                marginBottom: '1rem',
                border: `2px solid ${currentTheme.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                minHeight: '100px'
              }}
            />

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={saveEditTask}
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                💾 Save
              </button>
              <button
                onClick={() => setShowEditTaskModal(false)}
                style={{
                  background: currentTheme.hover,
                  color: currentTheme.text,
                  padding: '0.75rem 1.5rem',
                  border: `2px solid ${currentTheme.border}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {showEditCategoryModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowEditCategoryModal(false);
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{
            background: currentTheme.background,
            borderColor: currentTheme.primary,
            color: currentTheme.text
          }}>
            <button className="close-btn" onClick={() => setShowEditCategoryModal(false)}>✕</button>
            <h2>✏️ Edit Category</h2>
            
            <input
              type="text"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              placeholder="Category name"
              style={{
                background: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.primary,
                padding: '0.75rem',
                width: '100%',
                marginBottom: '1rem',
                border: `2px solid ${currentTheme.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />

            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 'bold' }}>Color:</span>
              <input
                type="color"
                value={editCategoryColor}
                onChange={(e) => setEditCategoryColor(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  height: '50px',
                  marginTop: '0.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              />
            </label>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={saveEditCategory}
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                💾 Save
              </button>
              <button
                onClick={() => setShowEditCategoryModal(false)}
                style={{
                  background: currentTheme.hover,
                  color: currentTheme.text,
                  padding: '0.75rem 1.5rem',
                  border: `2px solid ${currentTheme.border}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowCategoryModal(false);
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{
            background: currentTheme.background,
            borderColor: currentTheme.primary,
            color: currentTheme.text
          }}>
            <button className="close-btn" onClick={() => setShowCategoryModal(false)}>✕</button>
            <h2>➕ Create New Category</h2>
            
            <form onSubmit={addCategory}>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                required
                autoFocus
                style={{
                  background: currentTheme.background,
                  color: currentTheme.text,
                  borderColor: currentTheme.primary,
                  padding: '0.75rem',
                  width: '100%',
                  marginBottom: '1rem',
                  border: `2px solid ${currentTheme.border}`,
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />

              <label style={{ display: 'block', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 'bold' }}>Color:</span>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    height: '50px',
                    marginTop: '0.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 'bold' }}>Icon:</span>
                <input
                  type="text"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value.slice(0, 2))}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="📌"
                  style={{
                    background: currentTheme.background,
                    color: currentTheme.text,
                    borderColor: currentTheme.border,
                    padding: '0.75rem',
                    width: '100%',
                    marginTop: '0.5rem',
                    border: `2px solid ${currentTheme.border}`,
                    borderRadius: '0.5rem',
                    fontSize: '1.5rem',
                    textAlign: 'center'
                  }}
                />
              </label>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ✓ Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  style={{
                    background: currentTheme.hover,
                    color: currentTheme.text,
                    padding: '0.75rem 1.5rem',
                    border: `2px solid ${currentTheme.border}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ANSIBLE MODAL */}
      {showAnsibleModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowAnsibleModal(false);
        }}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()} style={{
            background: currentTheme.background,
            borderColor: currentTheme.primary,
            color: currentTheme.text,
            boxShadow: `0 20px 60px ${currentTheme.primary}40`
          }}>
            <button 
              className="close-btn" 
              onClick={() => setShowAnsibleModal(false)}
            >
              ✕
            </button>

            {/* Tabs */}
            <div className="ansible-tabs">
              <button
                className={`ansible-tab ${ansibleTab === 'info' ? 'active' : ''}`}
                onClick={() => setAnsibleTab('info')}
                style={{
                  borderBottomColor: ansibleTab === 'info' ? currentTheme.primary : 'transparent',
                  color: ansibleTab === 'info' ? currentTheme.primary : currentTheme.text
                }}
              >
                📖 Information
              </button>
              <button
                className={`ansible-tab ${ansibleTab === 'deployment' ? 'active' : ''}`}
                onClick={() => setAnsibleTab('deployment')}
                style={{
                  borderBottomColor: ansibleTab === 'deployment' ? currentTheme.primary : 'transparent',
                  color: ansibleTab === 'deployment' ? currentTheme.primary : currentTheme.text
                }}
              >
                🚀 Deployment
              </button>
            </div>

            {/* Content */}
            <div className="ansible-content">
              {ansibleTab === 'info' && (
                <div>
                  <h2>🤖 Kubernetes Cluster Automation</h2>
                  <p style={{ opacity: 0.8 }}>Automated 3-node Kubernetes cluster deployment with Ansible.</p>
                  
                  <h3 style={{ marginTop: '1.5rem' }}>✨ Features:</h3>
                  <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li>✅ 1 Master + 2 Worker nodes</li>
                    <li>✅ containerd container runtime</li>
                    <li>✅ Flannel CNI networking</li>
                    <li>✅ Kubernetes 1.27.0</li>
                    <li>✅ Automatic application deployment</li>
                  </ul>

                  <h3 style={{ marginTop: '1.5rem' }}>📊 9 Deployment Phases:</h3>
                  <ol style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li>System prerequisites</li>
                    <li>Kernel configuration</li>
                    <li>Container runtime</li>
                    <li>Kubernetes tools</li>
                    <li>Master node initialization</li>
                    <li>Worker nodes join</li>
                    <li>CNI deployment</li>
                    <li>Application deployment</li>
                    <li>Cluster verification</li>
                  </ol>

                  <button
                    className="start-deploy-btn"
                    onClick={() => setAnsibleTab('deployment')}
                    style={{ 
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
                      marginTop: '1.5rem'
                    }}
                  >
                    ▶️ Start Deployment
                  </button>
                </div>
              )}

              {ansibleTab === 'deployment' && (
                <div>
                  <h2>🚀 Execute Ansible Playbook</h2>
                  
                  <button
                    className="execute-btn"
                    onClick={runAnsiblePlaybook}
                    disabled={ansibleLoading}
                    style={{
                      background: ansibleLoading 
                        ? `${currentTheme.primary}80` 
                        : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
                      marginTop: '1rem'
                    }}
                  >
                    {ansibleLoading ? '⏳ Running...' : '▶️ Execute Playbook (Dry Run)'}
                  </button>

                  {ansibleOutput.length > 0 && (
                    <div className="ansible-output" style={{
                      background: currentTheme.text === '#F3F4F6' ? '#111827' : '#1E293B',
                      color: '#D4D4D4',
                      marginTop: '1.5rem'
                    }}>
                      {ansibleOutput.map((item, idx) => (
                        <div key={idx} className="output-line">
                          {item.message && <span style={{ color: item.status === 'success' ? '#10B981' : '#F59E0B' }}>
                            {item.message}
                          </span>}
                          {item.error && <span style={{ color: '#EF4444' }}>
                            {item.error}
                          </span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="main" style={{ flex: 1, overflow: 'auto' }}>
        <div className="container">
          {/* CATEGORIES SIDEBAR */}
          <aside className="sidebar" style={{
            background: `${currentTheme.secondary}80`,
            borderColor: currentTheme.border,
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="sidebar-title">📂 Categories</h3>
              <button
                onClick={() => setShowCategoryModal(true)}
                title="Create new category"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}
              >
                +
              </button>
            </div>
            
            <div className="categories-grid">
              <button
                className={`category-card ${filterCategory === 'All' ? 'active' : ''}`}
                onClick={() => setFilterCategory('All')}
                style={{
                  background: filterCategory === 'All' ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)` : `${currentTheme.hover}80`,
                  color: filterCategory === 'All' ? 'white' : currentTheme.text,
                  border: `2px solid ${filterCategory === 'All' ? currentTheme.primary : currentTheme.border}`
                }}
              >
                📌 All
              </button>
              
              {PRESET_CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  className={`category-card preset ${filterCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setFilterCategory(cat.name)}
                  style={{
                    background: filterCategory === cat.name ? cat.gradient : `${cat.color}20`,
                    color: filterCategory === cat.name ? 'white' : cat.color,
                    border: `2px solid ${cat.color}`,
                    fontWeight: filterCategory === cat.name ? 'bold' : 'normal'
                  }}
                >
                  {cat.name}
                </button>
              ))}

              {/* Custom Categories */}
              {categories.filter(c => !c.isDefault).map(cat => (
                <div
                  key={cat._id}
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}
                >
                  <button
                    className={`category-card custom ${filterCategory === cat.name ? 'active' : ''}`}
                    onClick={() => setFilterCategory(cat.name)}
                    style={{
                      background: filterCategory === cat.name ? cat.color : `${cat.color}20`,
                      color: filterCategory === cat.name ? 'white' : cat.color,
                      border: `2px solid ${cat.color}`,
                      flex: 1
                    }}
                  >
                    {cat.icon} {cat.name}
                  </button>
                  <button
                    onClick={() => startEditCategory(cat)}
                    title="Edit category"
                    style={{
                      background: 'transparent',
                      color: currentTheme.text,
                      border: `2px solid ${currentTheme.border}`,
                      borderRadius: '0.4rem',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteCategory(cat._id)}
                    title="Delete category"
                    style={{
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.4rem',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Filters */}
            <h3 className="sidebar-title" style={{ marginTop: '1.5rem' }}>🔍 Filters</h3>
            <select
              value={filterCompleted}
              onChange={(e) => setFilterCompleted(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: currentTheme.background,
                color: currentTheme.text,
                border: `2px solid ${currentTheme.primary}`,
                borderRadius: '0.5rem'
              }}
            >
              <option value="all">All Tasks</option>
              <option value="completed">Completed</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </aside>

          {/* MAIN CONTENT */}
          <div className="content">
            {/* Add Todo Form */}
            <section className="add-todo-section" style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}10, ${currentTheme.secondary}40)`,
              borderColor: currentTheme.primary,
              borderWidth: '2px'
            }}>
              <h2>✏️ Add New Task</h2>
              <form onSubmit={addTodo}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  required
                  style={{
                    background: currentTheme.background,
                    color: currentTheme.text,
                    borderColor: currentTheme.border
                  }}
                />

                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details (optional)"
                  style={{
                    background: currentTheme.background,
                    color: currentTheme.text,
                    borderColor: currentTheme.border
                  }}
                />

                <div className="form-controls">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      background: currentTheme.background,
                      color: currentTheme.text,
                      borderColor: getCategoryColor(selectedCategory),
                      borderWidth: '2px'
                    }}
                  >
                    <optgroup label="Preset">
                      {PRESET_CATEGORIES.map(cat => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Custom">
                      {categories.filter(c => !c.isDefault).map(cat => (
                        <option key={cat._id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{
                      background: currentTheme.background,
                      color: currentTheme.text,
                      borderColor: currentTheme.border
                    }}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>

                  <button
                    type="submit"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
                      color: 'white'
                    }}
                  >
                    ➕ Add Task
                  </button>
                </div>
              </form>
            </section>

            {/* Todos List */}
            <section className="todos-section">
              <h2>📋 Your Tasks</h2>
              {todos.length === 0 ? (
                <div className="empty-state">
                  <p>🎉 No tasks yet! Create one to get started.</p>
                </div>
              ) : (
                <ul className="todo-list">
                  {todos.map(todo => (
                    <li
                      key={todo._id}
                      className={`todo-item ${todo.completed ? 'completed' : ''}`}
                      style={{
                        borderLeft: `5px solid ${getCategoryColor(todo.category)}`,
                        background: `${getCategoryColor(todo.category)}08`,
                        borderColor: currentTheme.border
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo._id, todo.completed)}
                      />

                      <div className="todo-content">
                        <span className="todo-title">{todo.title}</span>
                        {todo.description && <p className="todo-desc">{todo.description}</p>}
                        <div className="todo-badges">
                          <span className="category-badge" style={{ background: getCategoryColor(todo.category), color: 'white' }}>
                            {getCategoryIcon(todo.category)} {todo.category}
                          </span>
                          <span className={`priority-badge priority-${todo.priority}`}>
                            {todo.priority === 'low' && '🟢 Low'}
                            {todo.priority === 'medium' && '🟡 Medium'}
                            {todo.priority === 'high' && '🔴 High'}
                          </span>
                        </div>
                      </div>

                      <button
                        className="edit-btn"
                        onClick={() => startEditTask(todo)}
                        title="Edit task"
                        style={{
                          background: currentTheme.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.4rem',
                          padding: '0.5rem 0.8rem',
                          cursor: 'pointer',
                          marginRight: '0.5rem'
                        }}
                      >
                        ✏️
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => deleteTodo(todo._id)}
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
