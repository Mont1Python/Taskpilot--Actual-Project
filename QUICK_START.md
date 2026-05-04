# ⚡ Quick Reference - Application & Cluster Management

## 🌐 APPLICATION ACCESS URLS

### Frontend (To-Do UI) - **PRIMARY ACCESS**
```
http://localhost:3000
```
**Command to access:**
```bash
kubectl port-forward -n todo-app svc/frontend 3000:3000
```
Then open: `http://localhost:3000`

### Backend API
```
http://localhost:5000/api/todos
```
**Command to access:**
```bash
kubectl port-forward -n todo-app svc/backend 5000:5000
```

### Health Check
```
http://localhost:5000/health
```

---

## 📊 VIEW CLUSTER STATUS

```bash
# Quick status (ALL 3 NODES)
kubectl get nodes

# Detailed node info
kubectl get nodes -o wide

# Running pods
kubectl get pods -n todo-app -o wide

# Services and access points
kubectl get svc -n todo-app

# All resources
kubectl get all -n todo-app
```

---

## ⏸️ PAUSE/RESUME NODES

### Pause (Drain Workloads)
```bash
node-control.bat pause
```

### Resume (Redeploy)
```bash
node-control.bat resume
```

### Check Status After
```bash
kubectl get pods -n todo-app
```

---

## 🤖 ANSIBLE PLAYBOOK (for VMs)

### Setup Instructions

1. **Update Inventory**
```bash
nano ansible/hosts.ini
```
Set your 3 VM IPs (master, worker1, worker2)

2. **Test SSH Connection**
```bash
ansible -i ansible/hosts.ini all -m ping
```

3. **Run Full Automation**
```bash
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml
```

4. **Dry Run (Check Only)**
```bash
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml --check
```

5. **Verbose Output**
```bash
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -v
```

---

## 📈 WHAT THE PLAYBOOK DOES

✅ Phase 1: System prerequisites
✅ Phase 2: Kernel configuration
✅ Phase 3: Container runtime (containerd)
✅ Phase 4: Kubernetes installation
✅ Phase 5: Master node setup
✅ Phase 6: Worker nodes join
✅ Phase 7: CNI deployment (Flannel)
✅ Phase 8: Application deployment
✅ Phase 9: Cluster verification

**Time:** 10-15 minutes for 3-node cluster

---

## 📋 API TESTING

### Get All To-Dos
```bash
curl http://localhost:5000/api/todos
```

### Add New To-Do
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","description":"Task details"}'
```

### Check Backend Health
```bash
curl http://localhost:5000/health
```

---

## 🔍 TROUBLESHOOTING

### Pods Not Starting?
```bash
kubectl describe pod <pod-name> -n todo-app
kubectl logs <pod-name> -n todo-app
```

### Node Not Ready?
```bash
kubectl describe node <node-name>
```

### Services Not Accessible?
```bash
kubectl get endpoints -n todo-app
kubectl describe svc frontend -n todo-app
```

---

## 📁 KEY FILES

| File | Purpose |
|------|---------|
| `ACCESS_APPLICATION.md` | How to access the app |
| `COMPLETE_SETUP.md` | Full cluster setup guide |
| `PROJECT_PRESENTATION.md` | Presentation material |
| `ansible/kubernetes-cluster-setup.yaml` | Main Ansible playbook |
| `ansible/hosts.ini` | VM inventory |
| `k8s/todo-app.yaml` | K8s manifests |
| `node-control.bat` | Windows node manager |

---

## 🎯 FOR YOUR PRESENTATION

Show these commands:

1. **Show Cluster**
```bash
kubectl get nodes -o wide
```

2. **Show Pods**
```bash
kubectl get pods -n todo-app -o wide
```

3. **Access App**
```bash
kubectl port-forward -n todo-app svc/frontend 3000:3000
# Open: http://localhost:3000
```

4. **Pause Demo**
```bash
node-control.bat pause
kubectl get pods -n todo-app
```

5. **Resume Demo**
```bash
node-control.bat resume
kubectl get pods -n todo-app
```

6. **Show Playbook**
```bash
cat ansible/kubernetes-cluster-setup.yaml
```

---

## 📊 CURRENT CLUSTER STATE

```
✓ 3 Nodes: 1 Master + 2 Workers (ALL READY)
✓ 7 Pods: 2 Backend + 2 Frontend + 3 MongoDB
✓ 3 Services: Backend, Frontend, MongoDB
✓ 2 Deployments: Backend, Frontend
✓ 1 StatefulSet: MongoDB with persistent storage
```

---

## ⚙️ MANAGE NODES

### Start
```bash
node-control.bat start
```

### Stop
```bash
node-control.bat stop
```

### Check Status
```bash
node-control.bat status
```

---

## 🚀 EVERYTHING READY!

Your application is:
- ✅ Running on 3-node Kubernetes cluster
- ✅ Accessible at http://localhost:3000
- ✅ Automated with Ansible playbook
- ✅ Built with Docker multi-stage builds
- ✅ Managed with kubectl and scripts

**Ready for presentation!** 🎓
