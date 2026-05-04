const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { spawn } = require('child_process');
const path = require('path');
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

    const ansiblePath = path.join(__dirname, '../../ansible');
    const playbookPath = path.join(ansiblePath, 'kubernetes-cluster-setup.yaml');
    const inventoryPath = path.join(ansiblePath, 'hosts.ini');

    let command = `ansible-playbook -i ${inventoryPath} ${playbookPath}`;
    
    if (dryRun) {
      command += ' --check';
    }
    
    command += ' -v';

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    res.write(JSON.stringify({
      deploymentId: deployment._id,
      status: 'started',
      message: `Starting Ansible ${type === 'check' ? 'check' : 'deployment'}...`,
      command: command
    }) + '\n');

    const ansible = spawn('ansible-playbook', [
      '-i', inventoryPath,
      playbookPath,
      ...(dryRun ? ['--check'] : []),
      '-v'
    ]);

    let output = '';
    let errorOutput = '';

    ansible.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      res.write(JSON.stringify({
        deploymentId: deployment._id,
        status: 'running',
        output: chunk
      }) + '\n');
    });

    ansible.stderr.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      res.write(JSON.stringify({
        deploymentId: deployment._id,
        status: 'running',
        error: chunk
      }) + '\n');
    });

    ansible.on('close', async (code) => {
      const endTime = new Date();
      const duration = (endTime - deployment.startTime) / 1000;

      deployment.status = code === 0 ? 'success' : 'failed';
      deployment.output = output;
      deployment.error = errorOutput;
      deployment.endTime = endTime;
      deployment.duration = duration;
      await deployment.save();

      res.write(JSON.stringify({
        deploymentId: deployment._id,
        status: code === 0 ? 'success' : 'failed',
        message: code === 0 ? 'Ansible execution completed successfully!' : 'Ansible execution failed!',
        duration: duration,
        code: code
      }) + '\n');

      res.end();
    });

    ansible.on('error', async (error) => {
      deployment.status = 'failed';
      deployment.error = error.message;
      deployment.endTime = new Date();
      await deployment.save();

      res.write(JSON.stringify({
        deploymentId: deployment._id,
        status: 'failed',
        error: error.message
      }) + '\n');

      res.end();
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to start Ansible execution',
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
  const fs = require('fs');
  
  try {
    const playbookPath = path.join(__dirname, '../../ansible/kubernetes-cluster-setup.yaml');
    const content = fs.readFileSync(playbookPath, 'utf8');
    const lines = content.split('\n').slice(0, 100);
    
    res.json({ 
      content: content,
      preview: lines.join('\n'),
      lines: content.split('\n').length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ansible/info', verifyToken, (req, res) => {
  res.json({
    name: 'Kubernetes Cluster Setup',
    description: 'Automated 3-node Kubernetes cluster deployment with Ansible',
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
      'Kubernetes: v1.27.0'
    ],
    estimatedTime: '10-15 minutes',
    requirements: [
      '3 Ubuntu/Debian VMs',
      'SSH access to all nodes',
      'Ansible installed on control machine'
    ]
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
    
    res.json({
      totalTodos: todoCount,
      completedTodos: completedCount,
      totalCategories: categoryCount,
      deployments: {
        total: deploymentCount,
        successful: successCount,
        failed: deploymentCount - successCount
      },
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
