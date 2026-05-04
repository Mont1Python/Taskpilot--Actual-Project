# 🎓 MCA Project Presentation - To-Do List Application

## Complete Kubernetes & Ansible Deployment

---

## 📋 Executive Summary

This project demonstrates a production-ready containerized to-do list application deployed on a **3-node Kubernetes cluster** using **Ansible automation** and **Docker containers** with a **complete CI/CD pipeline**.

---

## 🏗️ Architecture Overview

### Three-Tier Application Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                 │
│              Served on Port 3000/30000               │
└─────────────────────────────────────────────────────┘
                          ↓
                  Service: NodePort
                          ↓
┌─────────────────────────────────────────────────────┐
│           Backend API (Express.js)                  │
│              Running on Port 5000                    │
└─────────────────────────────────────────────────────┘
                          ↓
                  Service: ClusterIP
                          ↓
┌─────────────────────────────────────────────────────┐
│        Database (MongoDB - StatefulSet)             │
│              Running on Port 27017                   │
│              3 Replicas with PVC Storage             │
└─────────────────────────────────────────────────────┘
```

---

## 🌐 Access Your Application

### ✅ Frontend (To-Do UI)
```
URL: http://localhost:3000
Command: kubectl port-forward -n todo-app svc/frontend 3000:3000
```

### ✅ Backend API
```
URL: http://localhost:5000/api/todos
Command: kubectl port-forward -n todo-app svc/backend 5000:5000

Health Check: http://localhost:5000/health
```

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Orchestration** | Kubernetes | v1.27.0 |
| **Container Runtime** | Containerd | 1.6.19 |
| **Frontend** | React | 18.2 |
| **Backend** | Express.js | 4.18 |
| **Database** | MongoDB | 6.0 |
| **IaC/Automation** | Ansible | 2.x |
| **CI/CD** | GitHub Actions | Latest |
| **Container Registry** | GitHub Container Registry | GHCR |

---

## 📊 Kubernetes Cluster Setup

### Three-Node Kind Cluster

```
Master Node (Control Plane)           Worker Node 1              Worker Node 2
├─ API Server                        ├─ Backend Pod             ├─ Backend Pod
├─ Scheduler                         ├─ Frontend Pod            ├─ Frontend Pod
├─ Controller Manager                ├─ MongoDB-0               ├─ MongoDB-1
└─ etcd                             └─ Kubelet                 ├─ MongoDB-2
                                                                └─ Kubelet
```

### Current Cluster Status

```bash
$ kubectl get nodes -o wide

NAME                         STATUS   ROLES           VERSION   INTERNAL-IP
todo-cluster-control-plane   Ready    control-plane   v1.27.0   172.20.0.3
todo-cluster-worker          Ready    <none>          v1.27.0   172.20.0.4
todo-cluster-worker2         Ready    <none>          v1.27.0   172.20.0.2
```

---

## 🚀 Deployment Configuration

### Kubernetes Resources Deployed

```bash
$ kubectl get all -n todo-app

DEPLOYMENTS:
  ✓ backend (2 replicas, 2/2 ready)
  ✓ frontend (2 replicas, 2/2 ready)

SERVICES:
  ✓ backend (ClusterIP: 10.96.172.235:5000)
  ✓ frontend (NodePort: 10.96.241.73:30000)
  ✓ mongo (Headless Service: 27017)

STATEFULSETS:
  ✓ mongo (3 replicas, 3/3 ready)
    - mongo-0 (10.244.2.10)
    - mongo-1 (10.244.1.7)
    - mongo-2 (10.244.1.9)

DEPLOYMENTS:
  ✓ backend (10.244.1.4, 10.244.2.8)
  ✓ frontend (10.244.2.9, 10.244.1.5)
```

---

## 📦 Docker Images

### Multi-Stage Builds

**Backend Image:**
- Size: ~150MB (optimized)
- Base: node:18-alpine
- Layers: Builder → Runtime
- Features: Healthcheck, Non-root user, dumb-init

**Frontend Image:**
- Size: ~120MB (production optimized)
- Base: node:18-alpine
- Build: React production build
- Served by: serve package

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
Trigger: Push to main/develop branches
  ↓
1. TEST Phase
   - Run npm tests
   - Code coverage validation
  ↓
2. BUILD Phase
   - Build Docker images (multi-stage)
   - Push to GitHub Container Registry
  ↓
3. DEPLOY Phase (main branch only)
   - kubectl apply manifests
   - Rollout status check
   - Verify deployment
```

### CI/CD Features

- ✅ Automated testing on PR
- ✅ Multi-stage Docker builds
- ✅ Image caching optimization
- ✅ Automated deployment to Kubernetes
- ✅ Rollback capability
- ✅ Pod readiness verification

---

## 🤖 Ansible Automation

### Automated Cluster Setup (for Production)

**Playbook: `kubernetes-cluster-setup.yaml`**

#### 9 Automation Phases:

1. **System Prerequisites** - Update packages, install dependencies
2. **Kernel Configuration** - Load modules, set sysctl parameters
3. **Container Runtime** - Install and configure containerd
4. **Kubernetes Tools** - Install kubeadm, kubelet, kubectl
5. **Master Initialization** - Bootstrap control plane
6. **Worker Setup** - Join nodes to cluster
7. **CNI Deployment** - Deploy Flannel networking
8. **Application Deploy** - Deploy to-do app manifests
9. **Verification** - Display cluster status

#### Usage:

```bash
# Full cluster setup
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml

# Dry run (no changes)
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml --check

# With verbose output
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -v
```

#### Expected Execution Time: 10-15 minutes for 3-node cluster

---

## 📈 Features & Capabilities

### ✅ High Availability
- Multi-replica deployments
- Pod anti-affinity rules
- Rolling updates strategy

### ✅ Health Management
- Liveness probes (every 10s)
- Readiness probes (every 5s)
- Startup probes for initial delay

### ✅ Resource Management
- CPU requests: 100m per pod
- Memory requests: 128Mi per pod
- Resource limits enforced

### ✅ Storage
- PersistentVolumeClaim for MongoDB
- 5Gi storage allocation per replica

### ✅ Networking
- Service discovery via DNS
- ClusterIP for internal services
- NodePort for external access

### ✅ Monitoring & Logging
- kubectl logs for pod inspection
- kubectl describe for diagnostics
- Event tracking and status monitoring

---

## 🎯 Node Management Commands

### Show 3 Nodes Running
```bash
kubectl get nodes -o wide
```

### Pause Nodes (Drain Workloads)
```bash
node-control.bat pause
```

### Resume Nodes (Redeploy)
```bash
node-control.bat resume
```

### Check Full Status
```bash
node-control.bat status
```

---

## 📊 Performance Metrics

### Pod Distribution
```
Total Pods: 7
├─ Backend: 2 replicas (balanced across workers)
├─ Frontend: 2 replicas (balanced across workers)
└─ MongoDB: 3 replicas (StatefulSet, persistent)
```

### Deployment Status
```
backend    2/2 replicas ready   (100%)
frontend   2/2 replicas ready   (100%)
mongo      3/3 replicas ready   (100%)
```

### Network Connectivity
```
Frontend → Backend: Service discovery (backend.todo-app.svc.cluster.local:5000)
Backend → MongoDB: MongoDB replica set (mongo-0.mongo, mongo-1.mongo, mongo-2.mongo)
External → Frontend: NodePort (30000) or port-forward
```

---

## 🔐 Security Features

- ✅ Non-root container users
- ✅ Resource limits per pod
- ✅ Network namespaces isolation
- ✅ RBAC (Role-Based Access Control)
- ✅ Dumb-init for proper signal handling
- ✅ Health checks for auto-healing

---

## 📚 Project Files

```
To-do project/
├── backend/                    # Express.js API
│   ├── Dockerfile              # Multi-stage build
│   ├── .dockerignore
│   ├── server.js
│   └── package.json
├── frontend/                   # React UI
│   ├── Dockerfile              # Multi-stage build
│   ├── .dockerignore
│   ├── src/
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
├── k8s/
│   └── todo-app.yaml           # K8s manifests (3 nodes)
├── ansible/
│   ├── kubernetes-cluster-setup.yaml  # Automation playbook
│   ├── hosts.ini               # Inventory
│   └── ANSIBLE_SETUP.md
├── .github/workflows/
│   └── ci-cd.yaml              # GitHub Actions pipeline
├── docker-compose.yml          # Local development
├── node-control.bat            # Node management (Windows)
├── node-control.sh             # Node management (Linux)
├── kind-cluster-config.yaml    # K8s cluster config
├── COMPLETE_SETUP.md
├── ACCESS_APPLICATION.md
├── K8S_COMMANDS.md
└── README.md
```

---

## 🎓 Project Learning Outcomes

### Technologies Mastered
- ✅ Kubernetes orchestration (deployment, service, statefulset)
- ✅ Docker containerization (multi-stage builds)
- ✅ Ansible IaC (playbooks, roles, handlers)
- ✅ CI/CD automation (GitHub Actions)
- ✅ MongoDB replica sets
- ✅ Network policies and service discovery

### DevOps Practices
- ✅ Infrastructure as Code (Ansible)
- ✅ Continuous Integration/Deployment
- ✅ Container orchestration
- ✅ High availability patterns
- ✅ Monitoring and logging
- ✅ Security best practices

---

## 🚀 Quick Start

### Option 1: Local Kind Cluster (Current Setup)
```bash
# View current status
kubectl get nodes
kubectl get pods -n todo-app -o wide

# Access application
kubectl port-forward -n todo-app svc/frontend 3000:3000
# Open: http://localhost:3000
```

### Option 2: Production Setup (3 VMs)
```bash
# Configure Ansible
nano ansible/hosts.ini  # Update IPs

# Run playbook
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml

# Verify
kubectl get nodes
kubectl get pods -n todo-app
```

---

## 📊 Demonstration Steps

For your project presentation:

1. **Show Cluster Status**
   ```bash
   kubectl get nodes -o wide
   ```

2. **Show Running Pods**
   ```bash
   kubectl get pods -n todo-app -o wide
   ```

3. **Show Services**
   ```bash
   kubectl get svc -n todo-app
   ```

4. **Access Application**
   ```bash
   kubectl port-forward -n todo-app svc/frontend 3000:3000
   # Open: http://localhost:3000
   ```

5. **Demonstrate Node Pause**
   ```bash
   node-control.bat pause
   kubectl get pods -n todo-app
   ```

6. **Demonstrate Node Resume**
   ```bash
   node-control.bat resume
   kubectl get pods -n todo-app -w
   ```

7. **Show Ansible Playbook**
   ```bash
   cat ansible/kubernetes-cluster-setup.yaml | less
   ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml --check
   ```

---

## 🎉 Conclusion

This project showcases:
- ✅ Enterprise-grade containerization
- ✅ Kubernetes orchestration at scale
- ✅ Infrastructure automation
- ✅ CI/CD best practices
- ✅ Production-ready application deployment

**Total Implementation:**
- 1 Frontend service
- 1 Backend service
- 1 Database with 3 replicas
- 3-node Kubernetes cluster
- Automated Ansible deployment
- GitHub Actions CI/CD pipeline

---

## 📞 For Questions

Refer to:
- `COMPLETE_SETUP.md` - Full setup guide
- `ACCESS_APPLICATION.md` - Access instructions
- `ansible/ANSIBLE_SETUP.md` - Ansible documentation
- `K8S_COMMANDS.md` - Kubernetes commands reference

---

**Project Ready for Presentation! 🎓**
