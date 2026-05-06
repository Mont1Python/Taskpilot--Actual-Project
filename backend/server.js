const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/todo';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// ==================== SCHEMAS ====================

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: '#3B82F6' },
  icon: { type: String, default: '📌' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  isDefault: { type: Boolean, default: false }
});

const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  completed: { type: Boolean, default: false },
  category: { type: String, default: 'General' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: Date,
  createdAt: { type: Date, default: Date.now }
});

const deploymentSchema = new mongoose.Schema({
  status: { type: String, enum: ['pending', 'running', 'success', 'failed'], default: 'pending' },
  type: { type: String, default: 'check' },
  output: { type: String, default: '' },
  error: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: Date,
  endTime: Date,
  duration: Number
});

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Todo = mongoose.model('Todo', todoSchema);
const Deployment = mongoose.model('Deployment', deploymentSchema);

// ==================== MIDDLEWARE ====================

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CATEGORY ROUTES ====================

app.get('/api/categories', verifyToken, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories/init', verifyToken, async (req, res) => {
  try {
    const existingCount = await Category.countDocuments({ userId: req.userId });
    if (existingCount > 0) {
      return res.json({ message: 'Categories already exist' });
    }
    
    const defaultCategories = [
      { name: 'General', color: '#3B82F6', icon: '📌', userId: req.userId, isDefault: true },
      { name: 'Work', color: '#EF4444', icon: '💼', userId: req.userId, isDefault: true },
      { name: 'Personal', color: '#10B981', icon: '👤', userId: req.userId, isDefault: true },
      { name: 'Shopping', color: '#F59E0B', icon: '🛒', userId: req.userId, isDefault: true },
      { name: 'Health', color: '#EC4899', icon: '💚', userId: req.userId, isDefault: true }
    ];
    
    await Category.insertMany(defaultCategories);
    res.json({ message: 'Default categories created', categories: defaultCategories });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/categories', verifyToken, async (req, res) => {
  try {
    const category = new Category({ ...req.body, userId: req.userId });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted', category });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== TODO ROUTES ====================

app.get('/api/todos', verifyToken, async (req, res) => {
  try {
    const { category, completed } = req.query;
    let query = { userId: req.userId };
    
    if (category && category !== 'All') {
      query.category = category;
    }
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }

    const todos = await Todo.find(query).sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/todos', verifyToken, async (req, res) => {
  try {
    const todo = new Todo({ ...req.body, userId: req.userId });
    await todo.save();
    res.status(201).json(todo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/todos/:id', verifyToken, async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/todos/:id', verifyToken, async (req, res) => {
  try {
    await Todo.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== ANSIBLE ROUTES ====================

app.post('/api/ansible/run', verifyToken, async (req, res) => {
  const { type = 'check', dryRun = true } = req.body;
  
  try {
    const deployment = new Deployment({
      status: 'running',
      type: type,
      userId: req.userId,
      startTime: new Date()
    });
    await deployment.save();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    res.write(JSON.stringify({
      deploymentId: deployment._id,
      status: 'started',
      message: 'Starting deployment simulation...'
    }) + '\n');

    // Simulate deployment phases
    const phases = [
      { message: '✓ Phase 1: System prerequisites', status: 'running' },
      { message: '✓ Phase 2: Kernel configuration', status: 'running' },
      { message: '✓ Phase 3: Container runtime installation', status: 'running' },
      { message: '✓ Phase 4: Kubernetes tools installation', status: 'running' },
      { message: '✓ Phase 5: Master node initialization', status: 'running' },
      { message: '✓ Phase 6: Worker nodes join', status: 'running' },
      { message: '✓ Phase 7: CNI deployment', status: 'running' },
      { message: '✓ Phase 8: Application deployment', status: 'running' },
      { message: '✓ Phase 9: Cluster verification', status: 'running' },
      { message: '✅ DEPLOYMENT SIMULATION COMPLETE - All phases passed!', status: 'success' }
    ];

    let phaseIndex = 0;
    const phaseInterval = setInterval(() => {
      if (phaseIndex < phases.length) {
        res.write(JSON.stringify({
          deploymentId: deployment._id,
          status: phases[phaseIndex].status,
          message: phases[phaseIndex].message
        }) + '\n');
        phaseIndex++;
      } else {
        clearInterval(phaseInterval);
        
        const endTime = new Date();
        const duration = (endTime - deployment.startTime) / 1000;
        
        deployment.status = 'success';
        deployment.output = phases.map(p => p.message).join('\n');
        deployment.endTime = endTime;
        deployment.duration = duration;
        deployment.save();

        res.write(JSON.stringify({
          deploymentId: deployment._id,
          status: 'success',
          message: 'Deployment simulation finished successfully!',
          duration: duration,
          code: 0
        }) + '\n');

        res.end();
      }
    }, 500);

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to start deployment',
      error: err.message
    });
  }
});

app.get('/api/ansible/deployments', verifyToken, async (req, res) => {
  try {
    const deployments = await Deployment.find({ userId: req.userId })
      .sort({ startTime: -1 })
      .limit(20);
    res.json(deployments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ansible/deployments/:id', verifyToken, async (req, res) => {
  try {
    const deployment = await Deployment.findOne({ _id: req.params.id, userId: req.userId });
    if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
    res.json(deployment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ansible/playbook', verifyToken, (req, res) => {
  try {
    const playbookPath = path.join(__dirname, '../../ansible/deployment-verify.yaml');
    if (fs.existsSync(playbookPath)) {
      const content = fs.readFileSync(playbookPath, 'utf8');
      const lines = content.split('\n').slice(0, 100);
      
      res.json({ 
        content: content,
        preview: lines.join('\n'),
        lines: content.split('\n').length
      });
    } else {
      res.json({
        content: 'Deployment verification playbook',
        preview: 'Playbook file not found - using default',
        lines: 0
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ansible/info', verifyToken, (req, res) => {
  res.json({
    name: 'Kubernetes Cluster Setup & Deployment Verification',
    description: 'Automated Kubernetes cluster deployment with Ansible and deployment verification simulation',
    phases: [
      'System prerequisites',
      'Kernel configuration',
      'Container runtime installation',
      'Kubernetes tools installation',
      'Master node initialization',
      'Worker nodes join',
      'CNI deployment',
      'Application deployment',
      'Cluster verification'
    ],
    features: [
      'Automated cluster setup',
      'Multi-node support (1 master + 2 workers)',
      'Container runtime: containerd',
      'CNI: Flannel',
      'Kubernetes: v1.27.0',
      'Deployment verification simulation'
    ],
    estimatedTime: '10-15 minutes',
    requirements: [
      '3 Ubuntu/Debian VMs (for real deployment)',
      'SSH access to all nodes',
      'Ansible installed on control machine'
    ],
    instructions: {
      ui_based: 'Click "Execute Playbook" button in Ansible Control Panel at localhost:3001',
      os_level: 'See setup guide in ANSIBLE_SETUP.md or run: ansible-playbook -i ansible/hosts.ini ansible/deployment-verify.yaml'
    }
  });
});

// ==================== HEALTH ROUTES ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date(),
    version: '2.1'
  });
});

app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    const todoCount = await Todo.countDocuments({ userId: req.userId });
    const completedCount = await Todo.countDocuments({ userId: req.userId, completed: true });
    const categoryCount = await Category.countDocuments({ userId: req.userId });
    const deploymentCount = await Deployment.countDocuments({ userId: req.userId });
    const successCount = await Deployment.countDocuments({ userId: req.userId, status: 'success' });
    const lastDeployment = await Deployment.findOne({ userId: req.userId }).sort({ startTime: -1 });
    
    res.json({
      totalTodos: todoCount,
      completedTodos: completedCount,
      totalCategories: categoryCount,
      deployments: {
        total: deploymentCount,
        successful: successCount,
        failed: deploymentCount - successCount,
        lastDeploymentTime: lastDeployment ? lastDeployment.startTime : null,
        lastDeploymentStatus: lastDeployment ? lastDeployment.status : null
      },
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/deployment/verify', verifyToken, (req, res) => {
  res.json({
    status: 'deployed',
    message: 'Deployment verification successful',
    deploymentTime: new Date(),
    version: '2.1',
    environment: process.env.NODE_ENV || 'production',
    timestamp: Date.now()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
