## 🌐 Access Your Application

Your to-do app is running on Kubernetes! Here are the access URLs:

---

## ✅ Direct Access (Easy Way)

### Frontend (To-Do UI)
```
URL: http://localhost:3000
NodePort: 30000
```

**Command to port-forward:**
```bash
kubectl port-forward -n todo-app svc/frontend 3000:3000
```

Then open: **http://localhost:3000** in your browser

---

### Backend API
```
URL: http://localhost:5000
Port: 5000
```

**Command to port-forward:**
```bash
kubectl port-forward -n todo-app svc/backend 5000:5000
```

**Test API:**
```bash
curl http://localhost:5000/api/todos
curl http://localhost:5000/health
```

---

## 🔍 Service Details

### Frontend Service
- **Type:** NodePort
- **Cluster IP:** 10.96.241.73
- **Port:** 3000
- **NodePort:** 30000
- **Replicas:** 2 (running on worker nodes)

### Backend Service
- **Type:** ClusterIP
- **Cluster IP:** 10.96.172.235
- **Port:** 5000
- **Replicas:** 2 (running on worker nodes)

### MongoDB Service
- **Type:** ClusterIP (Headless)
- **Port:** 27017
- **Replicas:** 3 StatefulSet

---

## 🎯 Access Commands

### Start Port Forwarding (in separate terminals)
```bash
# Terminal 1 - Frontend
kubectl port-forward -n todo-app svc/frontend 3000:3000

# Terminal 2 - Backend
kubectl port-forward -n todo-app svc/backend 5000:5000
```

### View Service Information
```bash
# Get all services
kubectl get svc -n todo-app

# Get detailed service info
kubectl describe svc frontend -n todo-app
kubectl describe svc backend -n todo-app

# Get service endpoints
kubectl get endpoints -n todo-app
```

---

## 📊 Your Cluster Architecture

```
┌─────────────────────────────────────────────────────┐
│       Kind Kubernetes Cluster (todo-cluster)        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │   Control Plane (Master Node)               │   │
│  │   todo-cluster-control-plane                │   │
│  │   IP: 172.20.0.3                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────┬──────────────────────┐   │
│  │   Worker Node 1      │   Worker Node 2      │   │
│  │   (todo-cluster-     │   (todo-cluster-     │   │
│  │    worker)           │    worker2)          │   │
│  │ IP: 172.20.0.4       │ IP: 172.20.0.2       │   │
│  │                      │                      │   │
│  │ ┌──────────────────┐ │ ┌──────────────────┐ │   │
│  │ │ Backend Pod      │ │ │ Backend Pod      │ │   │
│  │ │ 10.244.2.8       │ │ │ 10.244.1.4       │ │   │
│  │ └──────────────────┘ │ └──────────────────┘ │   │
│  │                      │                      │   │
│  │ ┌──────────────────┐ │ ┌──────────────────┐ │   │
│  │ │ Frontend Pod     │ │ │ Frontend Pod     │ │   │
│  │ │ 10.244.2.9       │ │ │ 10.244.1.5       │ │   │
│  │ └──────────────────┘ │ └──────────────────┘ │   │
│  │                      │                      │   │
│  │ ┌──────────────────┐ │ ┌──────────────────┐ │   │
│  │ │ MongoDB-0        │ │ │ MongoDB-1&2      │ │   │
│  │ │ 10.244.2.10      │ │ │ 10.244.1.7,9     │ │   │
│  │ └──────────────────┘ │ └──────────────────┘ │   │
│  │                      │                      │   │
│  └──────────────────────┴──────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘

        │
        ├─► Frontend Service (NodePort :30000)
        │       ↓
        ├─► http://localhost:3000
        │
        ├─► Backend Service (ClusterIP :5000)
        │       ↓
        └─► http://localhost:5000/api
```

---

## 🚀 Quick Start to Access App

### Option 1: Using kubectl port-forward (Recommended)
```bash
# In one terminal - Forward frontend
kubectl port-forward -n todo-app svc/frontend 3000:3000

# In another terminal - Forward backend (optional)
kubectl port-forward -n todo-app svc/backend 5000:5000
```

Then open:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/todos

### Option 2: Using NodePort directly
The frontend service is configured as NodePort (30000), so you can also access it via:
```bash
# Find a worker node IP
kubectl get nodes -o wide

# Access at: http://<worker-node-ip>:30000
```

---

## 📋 All Access URLs Summary

| Service | Access URL | Type | Port |
|---------|-----------|------|------|
| Frontend (UI) | http://localhost:3000 | Port-forward | 3000 |
| Frontend (Direct) | http://localhost:30000 | NodePort | 30000 |
| Backend API | http://localhost:5000/api | Port-forward | 5000 |
| Backend Health | http://localhost:5000/health | Port-forward | 5000 |
| MongoDB | localhost:27017 | Internal | 27017 |
| Kubernetes API | https://localhost:6443 | Internal | 6443 |

---

## ✨ Test the Application

### Add a To-Do Item (via API)
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Todo","description":"Test from API"}'
```

### Get All To-Dos
```bash
curl http://localhost:5000/api/todos
```

### Check Backend Health
```bash
curl http://localhost:5000/health
```

---

## 🔗 View Running Resources

```bash
# All pods
kubectl get pods -n todo-app -o wide

# All services
kubectl get svc -n todo-app

# All deployments
kubectl get deployment -n todo-app

# All resources
kubectl get all -n todo-app
```

---

**Start accessing your application now!** 🎉
