# Kubernetes Nodes Running & Management Commands

Your 3-node Kubernetes cluster is now **running and fully operational**.

---

## ✅ Cluster Status - 3 Nodes Running

**Show all nodes with details:**
```bash
kubectl get nodes -o wide
```

**Expected output:**
```
NAME                         STATUS   ROLES           AGE     VERSION   INTERNAL-IP   OS-IMAGE
todo-cluster-control-plane   Ready    control-plane   2m52s   v1.27.0   172.20.0.3    Ubuntu 22.04.2 LTS
todo-cluster-worker          Ready    <none>          2m32s   v1.27.0   172.20.0.4    Ubuntu 22.04.2 LTS
todo-cluster-worker2         Ready    <none>          2m32s   v1.27.0   172.20.0.2    Ubuntu 22.04.2 LTS
```

---

## 🚀 Quick Commands to Verify Everything

### Check All Nodes
```bash
kubectl get nodes
kubectl get nodes -o wide
kubectl describe nodes
```

### Check Cluster Info
```bash
kubectl cluster-info
kubectl get cluster-info dump
```

### View Running Pods Across All Nodes
```bash
kubectl get pods -n todo-app -o wide
```

**Expected pods:**
- 2x backend pods (running on different workers)
- 2x frontend pods (running on different workers)
- 3x MongoDB StatefulSet pods

### View Node Details
```bash
# Get detailed info on a specific node
kubectl describe node todo-cluster-control-plane
kubectl describe node todo-cluster-worker
kubectl describe node todo-cluster-worker2

# Check node conditions
kubectl get nodes -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].{name:.metadata.name,status:.status}}'
```

---

## ⏸️ Pause Nodes (Drain Workloads)

Pause evicts all pods from worker nodes while keeping the cluster running.

### Using Script (Recommended)
```bash
# Windows
node-control.bat pause

# Linux/macOS/WSL
./node-control.sh pause
```

### Manual Commands
```bash
# Drain worker1
kubectl drain todo-cluster-worker --ignore-daemonsets --delete-emptydir-data --grace-period=30 --force

# Drain worker2
kubectl drain todo-cluster-worker2 --ignore-daemonsets --delete-emptydir-data --grace-period=30 --force

# Verify nodes are cordoned
kubectl get nodes
```

---

## ▶️ Resume Nodes (Bring Back Workloads)

Resume uncordons nodes and redeploys all pods.

### Using Script (Recommended)
```bash
# Windows
node-control.bat resume

# Linux/macOS/WSL
./node-control.sh resume
```

### Manual Commands
```bash
# Uncordon worker1
kubectl uncordon todo-cluster-worker

# Uncordon worker2
kubectl uncordon todo-cluster-worker2

# Redeploy app
kubectl apply -f k8s/todo-app.yaml

# Verify pods are running
kubectl get pods -n todo-app -o wide
```

---

## 🛑 Start/Stop Cluster

### Start Cluster
```bash
# Windows
node-control.bat start

# Linux/macOS/WSL
./node-control.sh start
```

**Manual start:**
```bash
kind start cluster --name todo-cluster
kubectl apply -f k8s/todo-app.yaml
```

### Stop Cluster
```bash
# Windows
node-control.bat stop

# Linux/macOS/WSL
./node-control.sh stop
```

**Manual stop:**
```bash
kind delete cluster --name todo-cluster
```

---

## 📊 Complete Node Management Script

### Windows - `node-control.bat`
```bash
node-control.bat status      # Show cluster status
node-control.bat start       # Start cluster
node-control.bat pause       # Pause nodes
node-control.bat resume      # Resume nodes
node-control.bat stop        # Stop cluster
```

### Linux/macOS/WSL - `node-control.sh`
```bash
chmod +x node-control.sh
./node-control.sh status     # Show cluster status
./node-control.sh start      # Start cluster
./node-control.sh pause      # Pause nodes
./node-control.sh resume     # Resume nodes
./node-control.sh stop       # Stop cluster
```

---

## 🔍 Advanced Node Monitoring

### Watch Pods in Real-Time
```bash
kubectl get pods -n todo-app -w
```

### Check Resource Usage per Node
```bash
# Requires Metrics Server
kubectl top nodes
kubectl top pods -n todo-app
```

### View Pod Distribution Across Nodes
```bash
kubectl get pods -n todo-app -o=custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName
```

### Monitor Node Events
```bash
kubectl get events --all-namespaces --sort-by='.lastTimestamp'
```

### Check Node Capacity
```bash
kubectl describe nodes | grep -A 5 "Allocated resources"
```

---

## 📋 Pod Status Across Nodes

**Verify pods are running on different nodes:**
```bash
kubectl get pods -n todo-app -o wide --show-labels
```

**Expected distribution:**
- `todo-cluster-control-plane`: Some system pods
- `todo-cluster-worker`: backend/frontend/mongo pods
- `todo-cluster-worker2`: backend/frontend/mongo pods

---

## 🎯 Common Scenarios

### Scenario 1: Check if All 3 Nodes are Ready
```bash
kubectl get nodes
# All 3 should show STATUS: Ready
```

### Scenario 2: Pause and Resume
```bash
# Show current pods
kubectl get pods -n todo-app

# Pause (drain nodes)
node-control.bat pause

# Verify pods are gone
kubectl get pods -n todo-app

# Resume (uncordon and redeploy)
node-control.bat resume

# Verify pods are back
kubectl get pods -n todo-app
```

### Scenario 3: Check Pod Locations
```bash
kubectl get pods -n todo-app -o wide | grep -E "NAME|backend|frontend|mongo"
```

### Scenario 4: Scale Deployments
```bash
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n todo-app

# Scale frontend to 3 replicas
kubectl scale deployment frontend --replicas=3 -n todo-app

# View pods across nodes
kubectl get pods -n todo-app -o wide
```

---

## 🔧 Troubleshooting

### Nodes Not Ready
```bash
kubectl describe node <node-name>
kubectl get nodes -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")]}'
```

### Pods Stuck on a Node
```bash
kubectl logs <pod-name> -n todo-app
kubectl describe pod <pod-name> -n todo-app
```

### Clear Node Cache
```bash
# Remove stale nodes
kubectl delete node <node-name>

# Restart cluster
kind delete cluster --name todo-cluster
kind create cluster --config kind-cluster-config.yaml
```

---

## 📞 Quick Reference

| Command | Action |
|---------|--------|
| `kubectl get nodes` | List all nodes |
| `kubectl get nodes -o wide` | Nodes with details |
| `kubectl describe node <name>` | Node details |
| `kubectl get pods -n todo-app -o wide` | Pods with node assignment |
| `node-control.bat status` | Full cluster status |
| `node-control.bat pause` | Drain all worker pods |
| `node-control.bat resume` | Uncordon and redeploy |
| `node-control.bat start` | Start cluster |
| `node-control.bat stop` | Stop cluster |

---

Your Kubernetes cluster is ready! All 3 nodes are running and your to-do app is deployed across them.
