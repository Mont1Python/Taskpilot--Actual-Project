# TaskPilot Deployment Guide

Complete guide for applying deployment changes from **UI (localhost:3001)** and **OS Level**.

---

## 📋 Table of Contents
1. [UI-Based Deployment (Recommended for Demo)](#ui-based-deployment)
2. [OS-Level Deployment](#os-level-deployment)
3. [Troubleshooting](#troubleshooting)
4. [Verification](#verification)

---

## 🖥️ UI-Based Deployment (localhost:3001)

### Step 1: Access Ansible Control Panel
1. Open your browser and navigate to: **http://localhost:3001**
2. You should see the "Ansible Control Panel - Deployment & Monitoring Dashboard"

### Step 2: Navigate to Deployment Tab
1. Click on the **"Deployment"** tab (rocket icon 🚀)
2. You'll see the "Run Deployment" section

### Step 3: Execute Deployment
1. The checkbox **"Execute Playbook (Dry Run)"** is selected by default
2. Click the blue **"Execute Playbook"** button
3. Watch the real-time deployment output showing 9 phases:
   - ✓ Phase 1: System prerequisites
   - ✓ Phase 2: Kernel configuration
   - ✓ Phase 3: Container runtime installation
   - ✓ Phase 4: Kubernetes tools installation
   - ✓ Phase 5: Master node initialization
   - ✓ Phase 6: Worker nodes join
   - ✓ Phase 7: CNI deployment
   - ✓ Phase 8: Application deployment
   - ✓ Phase 9: Cluster verification

### Step 4: Verify Deployment Success
- Green checkmarks (✓) appear for each phase
- Final message: **"✅ DEPLOYMENT SIMULATION COMPLETE - All phases passed!"**
- Status shows: **"DEPLOYMENT SUCCESSFUL"**

### Step 5: Run Multiple Times
You can click **"Execute Playbook"** multiple times to demonstrate deployment verification:
- Each execution shows **different timestamps**
- Output is logged in MongoDB
- Perfect for showing stakeholders the system is working

---

## 🖱️ OS-Level Deployment

### Prerequisites (One-Time Setup)

#### Windows (PowerShell):
```powershell
# 1. Install Ansible (using WSL2 or Windows package manager)
# Option A: Using Chocolatey
choco install ansible -y

# Option B: Using WSL2 (Ubuntu)
wsl
sudo apt-get update
sudo apt-get install ansible -y
exit
```

#### macOS:
```bash
# Install Ansible
brew install ansible
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install ansible -y
```

### Step 1: Verify Ansible Installation
```bash
# Check Ansible version
ansible --version

# Output should show: ansible [version number]
```

### Step 2: Configure SSH (for real deployment to VMs)
```bash
# Generate SSH keys (if not already done)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Copy SSH public key to all nodes
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@192.168.1.10  # Master
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@192.168.1.11  # Worker1
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@192.168.1.12  # Worker2
```

### Step 3: Update Ansible Inventory

Edit `ansible/hosts.ini` with your actual VM IPs:

```ini
[masters]
master ansible_host=192.168.1.10 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa

[workers]
worker1 ansible_host=192.168.1.11 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa
worker2 ansible_host=192.168.1.12 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa

[all:vars]
kubernetes_version=1.27.0
pod_network_cidr=10.244.0.0/16
service_cidr=10.96.0.0/12
```

### Step 4: Test Connectivity

```bash
# Navigate to project directory
cd "G:\MCA Project\To-do project"

# Test ping to all nodes
ansible -i ansible/hosts.ini all -m ping

# Expected output:
# master | SUCCESS => {
#     "ping": "pong"
# }
# worker1 | SUCCESS => {
#     "ping": "pong"
# }
# worker2 | SUCCESS => {
#     "ping": "pong"
# }
```

### Step 5a: Run Deployment Verification (Safe - No Changes)

```bash
# Dry-run mode (checks syntax, doesn't apply changes)
ansible-playbook -i ansible/hosts.ini ansible/deployment-verify.yaml --check

# OR with verbose output
ansible-playbook -i ansible/hosts.ini ansible/deployment-verify.yaml -v

# Output shows:
# ✅ DEPLOYMENT VERIFICATION COMPLETE
# All nodes verified successfully!
# Timestamp: [current time]
```

### Step 5b: Run Full Kubernetes Setup

```bash
# IMPORTANT: This will make actual changes to your VMs
# Run full setup on all nodes
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml

# With verbose output (recommended)
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -v

# With extra verbosity (for debugging)
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -vvv
```

### Step 5c: Run Setup on Specific Nodes Only

```bash
# Only on master node
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -l master

# Only on worker nodes
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -l workers

# Specific worker
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -l worker1
```

### Step 6: Monitor Progress

```bash
# In a separate terminal, watch the execution
# Check Kubernetes nodes as setup progresses
kubectl get nodes -w

# Once master is ready, check pods
kubectl get pods -n todo-app -w

# View cluster info
kubectl cluster-info
```

### Step 7: Verify Kubernetes Cluster

```bash
# Check all nodes are ready
kubectl get nodes -o wide

# Check all pods are running
kubectl get pods -n todo-app -o wide

# Check services
kubectl get svc -n todo-app

# Access the application
# Port-forward to access from localhost
kubectl port-forward -n todo-app svc/frontend 3000:3000 &
kubectl port-forward -n todo-app svc/backend 5000:5000 &

# Then visit: http://localhost:3000
```

---

## 🔄 Comparing UI vs OS-Level Deployment

| Aspect | UI-Based (localhost:3001) | OS-Level (Command Line) |
|--------|---------------------------|-------------------------|
| Setup Time | Immediate | Requires Ansible install |
| Demo Purpose | ✅ Best for demos | ✅ Best for real deployment |
| Dry-Run Support | ✅ Yes | ✅ Yes |
| Changes Made | ❌ Simulated only | ✅ Actual changes |
| Target | Local simulation | Remote VMs |
| Logging | ✅ MongoDB stored | ✅ Local logs |
| Multiple Runs | ✅ Safe, unlimited | ⚠️ Safe with --check |
| Scalability | Localhost only | Multiple VMs |

---

## 🐛 Troubleshooting

### Issue: "ansible-playbook" not recognized (Windows)

**Solution 1: Using WSL2**
```powershell
# Use Windows Subsystem for Linux
wsl
cd /mnt/g/MCA\ Project/To-do\ project
ansible-playbook -i ansible/hosts.ini ansible/deployment-verify.yaml
exit
```

**Solution 2: Install via Chocolatey**
```powershell
# Run as Administrator
choco install ansible -y
# Restart PowerShell
ansible-playbook --version
```

**Solution 3: Use Python pip**
```bash
pip install ansible
```

### Issue: SSH Connection Refused

```bash
# Verify SSH keys exist
ls -la ~/.ssh/

# Copy key to remote host if needed
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@192.168.1.10

# Test SSH connection directly
ssh -v ubuntu@192.168.1.10

# If password prompt appears, key wasn't copied
# Use ssh-copy-id with password instead:
ssh-copy-id -i ~/.ssh/id_rsa.pub -o "PubkeyAuthentication=no" ubuntu@192.168.1.10
```

### Issue: Playbook Fails with Permission Denied

```bash
# Add become password prompt
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -K

# Or provide sudo password in inventory
# Edit ansible/hosts.ini and add:
# ansible_sudo_pass=your_password
```

### Issue: Docker/Kubernetes Commands Not Found in Playbook

```bash
# Ensure Python 3 is available on remote nodes
ansible all -i ansible/hosts.ini -m raw -a "sudo apt-get install -y python3"

# Gather facts explicitly
ansible all -i ansible/hosts.ini -m setup
```

---

## ✅ Verification Checklist

### UI-Based (localhost:3001)
- [ ] Access http://localhost:3001
- [ ] Click "Deployment" tab
- [ ] Click "Execute Playbook" button
- [ ] See 9 phases execute
- [ ] Get success message
- [ ] Run again and see new timestamp

### OS-Level
- [ ] Ansible installed: `ansible --version`
- [ ] Inventory configured: `ansible/hosts.ini`
- [ ] SSH working: `ansible -i ansible/hosts.ini all -m ping`
- [ ] Playbook syntax valid: `ansible-playbook -i ansible/hosts.ini ansible/deployment-verify.yaml --syntax-check`
- [ ] Dry-run passes: `ansible-playbook -i ansible/hosts.ini ansible/deployment-verify.yaml --check`
- [ ] Full deployment succeeds: `ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml`

### Post-Deployment
- [ ] Kubernetes cluster formed: `kubectl get nodes`
- [ ] All pods running: `kubectl get pods -n todo-app`
- [ ] Services accessible: `kubectl get svc -n todo-app`
- [ ] Application loads: http://localhost:3000

---

## 📊 Deployment Workflow Summary

```
┌─────────────────────────────────────────────┐
│   TaskPilot Deployment Workflow             │
└─────────────────────────────────────────────┘

FOR DEMO/PRESENTATION (Recommended):
┌──────────────────────────────────────────┐
│ 1. Open http://localhost:3001            │
│ 2. Click "Deployment" tab                 │
│ 3. Click "Execute Playbook" button       │
│ 4. Show 9 phases completing               │
│ 5. Run again to show new timestamps       │
└──────────────────────────────────────────┘

FOR REAL KUBERNETES DEPLOYMENT:
┌──────────────────────────────────────────┐
│ 1. Install Ansible on control machine    │
│ 2. Configure ansible/hosts.ini with VMs  │
│ 3. Setup SSH keys to all nodes           │
│ 4. Test: ansible -i ansible/hosts.ini all -m ping
│ 5. Run: ansible-playbook ... kubernetes-cluster-setup.yaml
│ 6. Verify: kubectl get nodes             │
└──────────────────────────────────────────┘

CONTINUOUS DEPLOYMENT VERIFICATION:
┌──────────────────────────────────────────┐
│ OS Level: ansible-playbook ... deployment-verify.yaml
│ UI Based: Click "Execute Playbook" repeatedly
│ API: GET /api/deployment/verify          │
└──────────────────────────────────────────┘
```

---

## 📞 Quick Reference Commands

```bash
# UI Deployment
http://localhost:3001  # Click Deployment tab, Execute Playbook

# OS-Level Commands
ansible --version                                          # Check installation
ansible -i ansible/hosts.ini all -m ping                 # Test connectivity
ansible-playbook -i ansible/hosts.ini ansible/deployment-verify.yaml --check  # Dry-run
ansible-playbook -i ansible/hosts.ini ansible/deployment-verify.yaml -v       # Verbose
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml    # Real deployment

# Kubernetes Verification
kubectl get nodes                           # Check nodes
kubectl get pods -n todo-app               # Check pods
kubectl get svc -n todo-app                # Check services
kubectl describe node master               # Node details
kubectl logs -n todo-app deployment/frontend # App logs
```

---

## 📈 Expected Timeline

| Phase | Time | UI | OS |
|-------|------|----|----|
| Prerequisites | - | ✅ | ⚠️ 5-10 min |
| Connectivity Test | - | ✅ | 1 min |
| Dry-Run | 5 sec | ✅ | ✅ |
| Full Deployment | 10-15 min | ✅ Simulated | ✅ Real |
| Verification | 2 min | ✅ | ✅ |

---

## 🎯 Use Cases

### Use UI-Based Deployment When:
- ✅ Demonstrating to stakeholders
- ✅ Testing deployment workflow
- ✅ Showing deployment automation
- ✅ Non-technical audience
- ✅ Quick verification

### Use OS-Level Deployment When:
- ✅ Setting up production Kubernetes
- ✅ Deploying to multiple VMs
- ✅ Need real infrastructure changes
- ✅ Integrating with CI/CD
- ✅ Technical teams

---

For questions or issues, check logs:
- UI: Browser Console (F12)
- OS: Command output + `ansible.log`
- Backend: `docker logs to-doproject-backend-1`
