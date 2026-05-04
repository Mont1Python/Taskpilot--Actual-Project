# Kubernetes Cluster Setup Guide

Your Kubernetes cluster is currently not running. Here's how to fix it:

## Quick Fix

### Option 1: Use Kind (Lightweight Local Cluster) - RECOMMENDED

**Windows:**
```bash
kind-init.bat
```

**Linux/macOS/WSL:**
```bash
chmod +x kind-init.sh
./kind-init.sh
```

This creates a 3-node cluster (1 control-plane + 2 workers) locally.

---

### Option 2: Use Docker Desktop Kubernetes

1. Open Docker Desktop
2. Go to Settings → Kubernetes
3. Enable "Enable Kubernetes"
4. Wait for cluster to start (5-10 minutes)
5. Run: `kubectl get nodes`

---

## Diagnose the Issue

### Check Current Context
```bash
kubectl config current-context
kubectl config get-contexts
```

### Check Cluster Status
```bash
kubectl cluster-info
kubectl get nodes
```

### Error: Connection Refused (port 65130)
This means the Kubernetes API server is not running. Choose one:
- **Start Kind cluster** (easiest for local testing)
- **Start Docker Desktop Kubernetes** (if already installed)
- **Connect to remote cluster** (if using 3 VMs)

---

## Complete Kubernetes Setup for 3 Nodes (VMs)

If you have 3 Ubuntu/Debian VMs (1 master + 2 workers):

### 1. Update Inventory
```bash
nano ansible/inventory.ini
```
Set your VMs' IPs:
```
master ansible_host=192.168.1.10
worker1 ansible_host=192.168.1.11
worker2 ansible_host=192.168.1.12
```

### 2. Run Ansible Playbook
```bash
ansible-playbook -i ansible/inventory.ini ansible/k8s-setup.yaml
```

### 3. Verify Cluster
```bash
kubectl get nodes
# Expected: master (control-plane), worker1, worker2 all Ready
```

### 4. Deploy App
```bash
kubectl apply -f k8s/todo-app.yaml
kubectl get pods -n todo-app
```

---

## Verify Everything Works

After starting your cluster:

```bash
# Check nodes
kubectl get nodes -o wide

# Check pods
kubectl get pods -n todo-app -o wide

# Check services
kubectl get svc -n todo-app

# Check deployments
kubectl get deployment -n todo-app

# View logs
kubectl logs -f deployment/backend -n todo-app
```

---

## Access Your App

After cluster is running and app is deployed:

```bash
# Frontend (NodePort)
kubectl port-forward -n todo-app svc/frontend 3000:3000
# Access at: http://localhost:3000

# Backend API
kubectl port-forward -n todo-app svc/backend 5000:5000
# Access at: http://localhost:5000/api/todos

# Or check service details
kubectl get svc -n todo-app -o wide
```

---

## Quick Commands Summary

```bash
# Start cluster (Kind)
kind start cluster --name todo-cluster

# Deploy app
kubectl apply -f k8s/todo-app.yaml

# Check status
kubectl get all -n todo-app

# View logs
kubectl logs -f deployment/backend -n todo-app
kubectl logs -f deployment/frontend -n todo-app

# Port forward
kubectl port-forward -n todo-app svc/frontend 3000:3000
kubectl port-forward -n todo-app svc/backend 5000:5000

# Stop cluster (Kind)
kind delete cluster --name todo-cluster
```

---

## Troubleshooting

### Cluster won't start
```bash
# Check Docker is running
docker ps

# Check Kind is installed
kind --version

# Check kubeconfig
kubectl config view
```

### Pods not starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n todo-app

# Check events
kubectl get events -n todo-app

# Check logs
kubectl logs <pod-name> -n todo-app
```

### Cannot connect to API server
```bash
# Verify cluster is running
kubectl cluster-info

# Check context
kubectl config use-context kind-todo-cluster

# Or reset context
kubectl config set-context kind-todo-cluster --cluster=kind-todo-cluster --user=kind-todo-cluster
```

---

## Next Steps

1. **Start cluster** using Kind or Docker Desktop
2. **Deploy app** with `kubectl apply -f k8s/todo-app.yaml`
3. **Verify pods** with `kubectl get pods -n todo-app`
4. **Access app** via port-forward or NodePort
5. **Monitor** with `./k8s-monitor.sh pods`
6. **View dashboard** with `./k8s-dashboard.sh open`

Let me know if you need help with any of these steps!
