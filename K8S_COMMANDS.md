# Kubernetes Management Commands

Quick reference for managing your Kubernetes cluster (1 master + 2 worker nodes).

## Quick Start Commands

### Using Bash Scripts

```bash
# Control cluster
chmod +x k8s-control.sh
./k8s-control.sh start      # Start cluster
./k8s-control.sh status     # Check status
./k8s-control.sh pause      # Pause (drain nodes)
./k8s-control.sh resume     # Resume (uncordon nodes)
./k8s-control.sh stop       # Stop cluster

# Dashboard
chmod +x k8s-dashboard.sh
./k8s-dashboard.sh deploy   # Deploy dashboard
./k8s-dashboard.sh open     # Deploy and open in browser
./k8s-dashboard.sh token    # Get access token
./k8s-dashboard.sh remove   # Remove dashboard

# Monitoring
chmod +x k8s-monitor.sh
./k8s-monitor.sh pods              # Show pod status
./k8s-monitor.sh logs <pod-name>   # View pod logs
./k8s-monitor.sh logs-f <pod>      # Follow pod logs (live)
./k8s-monitor.sh metrics           # Show resource usage
./k8s-monitor.sh troubleshoot <pod> # Troubleshoot pod
./k8s-monitor.sh monitor           # Real-time monitoring
```

### Using Interactive CLI (Recommended)

```bash
chmod +x k8s-cli.py
python3 k8s-cli.py          # Launch interactive menu
```

---

## Manual kubectl Commands

### Cluster Status

```bash
# Check nodes
kubectl get nodes -o wide
kubectl describe node <node-name>

# Check cluster info
kubectl cluster-info
kubectl get componentstatuses

# Check all resources
kubectl get all -n todo-app
```

### Pod Management

```bash
# List pods
kubectl get pods -n todo-app
kubectl get pods -n todo-app -o wide

# Pod details
kubectl describe pod <pod-name> -n todo-app
kubectl logs <pod-name> -n todo-app
kubectl logs -f <pod-name> -n todo-app          # Follow logs

# Execute in pod
kubectl exec -it <pod-name> -n todo-app -- /bin/sh

# Resource usage
kubectl top pods -n todo-app
kubectl top nodes
```

### Deployment Management

```bash
# Check deployments
kubectl get deployment -n todo-app
kubectl describe deployment backend -n todo-app

# Rollout
kubectl rollout status deployment/backend -n todo-app
kubectl rollout history deployment/backend -n todo-app
kubectl rollout restart deployment/backend -n todo-app

# Scale deployment
kubectl scale deployment backend --replicas=3 -n todo-app
```

### Services & Network

```bash
# List services
kubectl get svc -n todo-app
kubectl get endpoints -n todo-app

# Port forward
kubectl port-forward -n todo-app svc/frontend 3000:3000 &
kubectl port-forward -n todo-app svc/backend 5000:5000 &

# Describe service
kubectl describe svc backend -n todo-app
```

### Namespace & ConfigMaps

```bash
# Namespace operations
kubectl get ns
kubectl create namespace todo-app
kubectl delete namespace todo-app

# ConfigMaps
kubectl get configmap -n todo-app
kubectl describe configmap backend-config -n todo-app
```

### Events & Troubleshooting

```bash
# View events
kubectl get events -n todo-app --sort-by='.lastTimestamp'

# Troubleshoot node
kubectl describe node <node-name>
kubectl get nodes -o json | jq '.items[].status.conditions'

# Troubleshoot pod
kubectl describe pod <pod-name> -n todo-app
kubectl logs <pod-name> --previous -n todo-app        # Crashed pod
kubectl logs <pod-name> --all-containers -n todo-app  # All containers
```

### Deployment & Updates

```bash
# Deploy/Update
kubectl apply -f k8s/todo-app.yaml

# Check rollout
kubectl rollout status deployment/backend -n todo-app --timeout=5m

# Rollback
kubectl rollout undo deployment/backend -n todo-app
kubectl rollout undo deployment/backend -n todo-app --to-revision=1
```

---

## Dashboard Access

### Via Script
```bash
./k8s-dashboard.sh open
# Opens at: https://localhost:8443
```

### Manual Setup
```bash
# Deploy dashboard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v7.0.0/aio/deploy/recommended.yaml

# Create admin user
kubectl create serviceaccount admin-user -n kubernetes-dashboard
kubectl create clusterrolebinding admin-user --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:admin-user

# Get token
kubectl -n kubernetes-dashboard create token admin-user

# Start proxy
kubectl port-forward -n kubernetes-dashboard svc/kubernetes-dashboard 8443:443

# Access at: https://localhost:8443
```

---

## Common Scenarios

### Check All Running Pods
```bash
./k8s-monitor.sh pods
# or
kubectl get pods -n todo-app -o wide
```

### View Frontend Logs
```bash
./k8s-monitor.sh logs-f frontend-xxxxx
# or
kubectl logs -f deployment/frontend -n todo-app
```

### Troubleshoot Backend Pod
```bash
./k8s-monitor.sh troubleshoot backend-xxxxx
# Shows: status, events, logs, previous logs
```

### Scale Backend to 3 Replicas
```bash
kubectl scale deployment backend --replicas=3 -n todo-app
```

### Restart All Deployments
```bash
kubectl rollout restart deployment/backend -n todo-app
kubectl rollout restart deployment/frontend -n todo-app
```

### Monitor Resource Usage
```bash
./k8s-monitor.sh metrics
# or
kubectl top pods -n todo-app
kubectl top nodes
```

### Access Frontend from Outside Cluster
```bash
# Get NodePort
kubectl get svc frontend -n todo-app

# Access via: http://<worker-node-ip>:30000
```

### Access Backend Internally
```bash
# From within cluster:
kubectl exec -it <pod> -n todo-app -- curl http://backend.todo-app.svc.cluster.local:5000/health
```

---

## Troubleshooting Tips

### Pod Not Starting
```bash
kubectl describe pod <pod-name> -n todo-app    # Check events
kubectl logs <pod-name> -n todo-app             # Check logs
```

### Image Pull Errors
```bash
kubectl describe pod <pod-name> -n todo-app
# Check: ImagePullBackOff, image registry issues
```

### CrashLoopBackOff
```bash
kubectl logs <pod-name> --previous -n todo-app  # View crash logs
kubectl describe pod <pod-name> -n todo-app     # Check restart count
```

### Node Not Ready
```bash
kubectl describe node <node-name>
kubectl get nodes -o json | jq '.items[].status.conditions'
```

### Storage Issues (MongoDB)
```bash
kubectl get pvc -n todo-app
kubectl get pv
kubectl describe pvc mongo-storage-mongo-0 -n todo-app
```

---

## Environment Variables

Set these in your shell before running scripts:

```bash
export MASTER_IP="192.168.1.10"
export WORKER1_IP="192.168.1.11"
export WORKER2_IP="192.168.1.12"
export MASTER_USER="ubuntu"
export NAMESPACE="todo-app"
export DASHBOARD_VERSION="7.0.0"
```

---

## Requirements

- `kubectl` configured and connected to cluster
- `bash` or compatible shell (for `.sh` scripts)
- `python3` (for `k8s-cli.py`)
- SSH access to master/worker nodes (for start/stop commands)
- `watch` command (optional, for real-time monitoring)

---

For more help:
```bash
./k8s-control.sh help
./k8s-dashboard.sh help
./k8s-monitor.sh help
```
