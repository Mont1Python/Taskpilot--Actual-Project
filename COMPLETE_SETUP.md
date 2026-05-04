# 🎯 Kubernetes 3-Node Cluster - Complete Setup & Commands

## ✅ Cluster Status: RUNNING

Your 3-node Kubernetes cluster is **fully operational and running**.

---

## 📊 Current Cluster State

```
✓ 1 Control Plane (Master): todo-cluster-control-plane
✓ 2 Worker Nodes: todo-cluster-worker, todo-cluster-worker2
✓ All nodes: Ready
✓ Kubernetes version: v1.27.0
✓ Container runtime: containerd 1.6.19
```

---

## 🔍 Commands to Show 3 Nodes Are Running

### 1️⃣ Get All Nodes
```bash
kubectl get nodes
```

**Output:**
```
NAME                         STATUS   ROLES           AGE     VERSION
todo-cluster-control-plane   Ready    control-plane   6m28s   v1.27.0
todo-cluster-worker          Ready    <none>          6m8s    v1.27.0
todo-cluster-worker2         Ready    <none>          6m8s    v1.27.0
```

### 2️⃣ Get Nodes with Detailed Information
```bash
kubectl get nodes -o wide
```

Shows: Node name, status, roles, age, version, IP addresses, OS, kernel, container runtime.

### 3️⃣ Describe All Nodes
```bash
kubectl describe nodes
```

Shows: Capacity, allocatable resources, node conditions, running pods on each node.

### 4️⃣ Check Cluster Info
```bash
kubectl cluster-info
```

Shows: Kubernetes master and DNS server endpoints.

### 5️⃣ View Pods Distributed Across Nodes
```bash
kubectl get pods -n todo-app -o wide
```

**Output shows pods running on different nodes:**
```
NAME                        READY   NODE                   IP
backend-6587dd8b87-6qrsz    1/1     todo-cluster-worker2   10.244.1.4
backend-6587dd8b87-8m9nc    1/1     todo-cluster-worker    10.244.2.8
frontend-58c977695d-b6zkv   1/1     todo-cluster-worker    10.244.2.9
frontend-58c977695d-jfjbt   1/1     todo-cluster-worker2   10.244.1.5
mongo-0                     1/1     todo-cluster-worker    10.244.2.10
mongo-1                     1/1     todo-cluster-worker2   10.244.1.7
mongo-2                     1/1     todo-cluster-worker2   10.244.1.9
```

---

## 🎮 Node Management Commands

### START Cluster
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
kubectl get pods -n todo-app
```

---

### PAUSE Nodes (Drain All Pods)
Evicts all workloads from worker nodes while cluster remains running.

```bash
# Windows
node-control.bat pause

# Linux/macOS/WSL
./node-control.sh pause
```

**Manual pause:**
```bash
# Drain worker 1
kubectl drain todo-cluster-worker --ignore-daemonsets --delete-emptydir-data --grace-period=30 --force

# Drain worker 2
kubectl drain todo-cluster-worker2 --ignore-daemonsets --delete-emptydir-data --grace-period=30 --force

# Verify nodes are cordoned
kubectl get nodes
# Output: Workers show STATUS = SchedulingDisabled

# Check pods are gone
kubectl get pods -n todo-app
# Output: No pods (or only on control-plane)
```

---

### RESUME Nodes (Uncordon & Redeploy)
Brings worker nodes back online and redeploys all pods.

```bash
# Windows
node-control.bat resume

# Linux/macOS/WSL
./node-control.sh resume
```

**Manual resume:**
```bash
# Uncordon worker 1
kubectl uncordon todo-cluster-worker

# Uncordon worker 2
kubectl uncordon todo-cluster-worker2

# Verify nodes are ready
kubectl get nodes
# Output: Workers show STATUS = Ready

# Redeploy app
kubectl apply -f k8s/todo-app.yaml

# Check pods are running
kubectl get pods -n todo-app -o wide
# Output: Pods distributed across workers
```

---

### CHECK Status
```bash
# Windows
node-control.bat status

# Linux/macOS/WSL
./node-control.sh status
```

**Shows:**
- Cluster name
- All nodes (status, roles, age, version)
- Pods across nodes
- Deployments
- Services
- StatefulSets

---

### STOP Cluster
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

## 🚀 Running Application Across 3 Nodes

### View Running Services
```bash
kubectl get svc -n todo-app
```

**Output:**
```
NAME       TYPE        CLUSTER-IP      PORT(S)          AGE
backend    ClusterIP   10.96.172.235   5000/TCP         2m45s
frontend   NodePort    10.96.241.73    3000:30000/TCP   2m45s
mongo      ClusterIP   None            27017/TCP        2m45s
```

### Access Application
```bash
# Frontend (via NodePort)
kubectl port-forward -n todo-app svc/frontend 3000:3000
# Access at: http://localhost:3000

# Backend API (via ClusterIP)
kubectl port-forward -n todo-app svc/backend 5000:5000
# Access at: http://localhost:5000/api/todos
```

### View Deployments
```bash
kubectl get deployment -n todo-app
```

**Output:**
```
NAME       READY   UP-TO-DATE   AVAILABLE   AGE
backend    2/2     2            2           2m40s
frontend   2/2     2            2           2m40s
```

### View StatefulSet (MongoDB)
```bash
kubectl get statefulset -n todo-app
```

**Output:**
```
NAME    READY   AGE
mongo   3/3     2m45s
```

---

## 📈 Complete Workflow Example

### 1. Check all nodes are running
```bash
kubectl get nodes
# Expected: 3 nodes, all Ready
```

### 2. View pods across nodes
```bash
kubectl get pods -n todo-app -o wide
# Expected: Pods distributed on worker1 and worker2
```

### 3. Pause all worker nodes
```bash
node-control.bat pause
```

### 4. Verify pods are evicted
```bash
kubectl get pods -n todo-app
# Expected: No pods on workers
```

### 5. Check nodes are cordoned
```bash
kubectl get nodes
# Expected: Workers show "SchedulingDisabled"
```

### 6. Resume all nodes
```bash
node-control.bat resume
```

### 7. Verify pods are redeployed
```bash
kubectl get pods -n todo-app -o wide
# Expected: Pods back on workers, distributed across nodes
```

---

## 🔧 Useful Kubectl Commands

### Node Operations
```bash
# List nodes
kubectl get nodes

# Node details
kubectl describe node <node-name>

# Node conditions
kubectl get nodes -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")]}'

# Drain node
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Uncordon node
kubectl uncordon <node-name>

# Cordon node (prevent new pods)
kubectl cordon <node-name>
```

### Pod Operations
```bash
# List pods with node assignment
kubectl get pods -n todo-app -o wide

# Pod details
kubectl describe pod <pod-name> -n todo-app

# Pod logs
kubectl logs <pod-name> -n todo-app

# Exec into pod
kubectl exec -it <pod-name> -n todo-app -- /bin/sh

# Watch pods in real-time
kubectl get pods -n todo-app -w
```

### Cluster Operations
```bash
# Cluster info
kubectl cluster-info

# Get contexts
kubectl config get-contexts

# Switch context
kubectl config use-context kind-todo-cluster

# Dump cluster info
kubectl cluster-info dump
```

---

## 📋 Summary Table

| Feature | Status | Details |
|---------|--------|---------|
| Control Plane | ✅ Running | todo-cluster-control-plane |
| Worker Node 1 | ✅ Running | todo-cluster-worker |
| Worker Node 2 | ✅ Running | todo-cluster-worker2 |
| Backend | ✅ Deployed | 2 replicas across workers |
| Frontend | ✅ Deployed | 2 replicas across workers |
| MongoDB | ✅ Deployed | 3 replicas (StatefulSet) |
| Services | ✅ Running | Backend, Frontend, Mongo |
| Pod Distribution | ✅ Balanced | Pods spread across 2 workers |

---

## 🎯 Quick Start Commands

```bash
# Show 3 nodes are running
kubectl get nodes

# Show pods across all nodes
kubectl get pods -n todo-app -o wide

# Pause nodes (drain workloads)
node-control.bat pause

# Resume nodes (redeploy workloads)
node-control.bat resume

# Full cluster status
node-control.bat status

# Stop cluster
node-control.bat stop
```

---

Your Kubernetes cluster is ready! All 3 nodes are operational and your to-do app is running across them.
