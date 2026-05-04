# Ansible Kubernetes Cluster Setup - For MCA Project

Complete automated Kubernetes cluster setup using Ansible.

## 📋 Prerequisites

- 3 Ubuntu/Debian VMs (1 master, 2 workers)
- SSH access to all VMs
- Ansible installed on your local machine

### Install Ansible

**macOS:**
```bash
brew install ansible
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ansible -y
```

**Windows (WSL2):**
```bash
sudo apt-get install ansible -y
```

---

## 🔧 Configuration

### 1. Update Inventory

Edit `ansible/hosts.ini` with your VMs' IP addresses and SSH credentials:

```ini
[all]
master ansible_host=192.168.1.10 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa
worker1 ansible_host=192.168.1.11 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa
worker2 ansible_host=192.168.1.12 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa
```

### 2. Setup SSH Keys

Generate SSH keys for passwordless authentication:

```bash
# Generate SSH key (if not already done)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Copy key to all nodes
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@192.168.1.10
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@192.168.1.11
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@192.168.1.12
```

### 3. Test Connectivity

```bash
ansible -i ansible/hosts.ini all -m ping
```

Expected output:
```
master | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
worker1 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
worker2 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

---

## 🚀 Running the Playbook

### Run Full Setup

```bash
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml
```

### Run with Verbose Output (for troubleshooting)

```bash
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -v
```

### Run with Extra Verbosity

```bash
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -vvv
```

### Run Specific Phase Only

```bash
# Run only system prerequisites
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml --tags "prerequisites"

# Run only container runtime installation
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml --tags "container-runtime"

# Run only Kubernetes installation
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml --tags "kubernetes"
```

### Run on Specific Hosts

```bash
# Run only on master
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -l master

# Run only on workers
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -l workers
```

---

## 📊 Playbook Phases

The playbook executes in 9 phases:

### Phase 1: System Prerequisites
- Updates system packages
- Installs required dependencies (curl, git, vim, etc.)

### Phase 2: Kernel Configuration
- Loads overlay and br_netfilter modules
- Configures sysctl parameters for Kubernetes

### Phase 3: Container Runtime Installation
- Adds Docker repository
- Installs containerd 1.6.19
- Configures and starts containerd service

### Phase 4: Kubernetes Installation
- Adds Kubernetes repository
- Installs kubeadm, kubelet, kubectl v1.27.0
- Starts and enables kubelet service
- Disables swap

### Phase 5: Master Node Initialization
- Initializes Kubernetes cluster
- Deploys Flannel CNI
- Generates worker join token
- Waits for control plane to be ready

### Phase 6: Worker Node Join
- Joins worker nodes to the cluster
- Verifies connectivity

### Phase 7: Kubernetes Dashboard (Optional)
- Deploys Kubernetes Dashboard
- Creates admin user

### Phase 8: Application Deployment
- Creates todo-app namespace
- Deploys application manifests
- Waits for all pods to be ready

### Phase 9: Cluster Verification
- Displays final cluster status
- Shows access instructions

---

## ✅ Expected Output

After successful playbook execution:

```
====================================
KUBERNETES CLUSTER STATUS
====================================
NAME                         STATUS   ROLES           AGE    VERSION
master                       Ready    control-plane   5m42s  v1.27.0
worker1                      Ready    <none>          2m30s  v1.27.0
worker2                      Ready    <none>          2m25s  v1.27.0

=========================================
SETUP COMPLETE!
=========================================

Your Kubernetes cluster is ready!

Master Node: 192.168.1.10
Worker Nodes: 192.168.1.11, 192.168.1.12

To access the cluster:
  scp root@192.168.1.10:/root/.kube/config ~/.kube/config

To view cluster status:
  kubectl get nodes
  kubectl get pods -n todo-app

To access the application:
  kubectl port-forward -n todo-app svc/frontend 3000:3000
  kubectl port-forward -n todo-app svc/backend 5000:5000

=========================================
```

---

## 🔍 Verify Cluster After Setup

### Check Nodes
```bash
kubectl get nodes -o wide
```

### Check Pods
```bash
kubectl get pods -n todo-app -o wide
```

### Check Deployments
```bash
kubectl get deployment -n todo-app
```

### Check Services
```bash
kubectl get svc -n todo-app
```

### View Cluster Info
```bash
kubectl cluster-info
```

---

## 🐛 Troubleshooting

### Nodes Not Ready
```bash
# Check node status
kubectl describe node master

# View kubelet logs
ssh ubuntu@192.168.1.10 sudo journalctl -u kubelet -n 50
```

### Pod Stuck in Pending
```bash
# Check pod details
kubectl describe pod <pod-name> -n todo-app

# Check pod logs
kubectl logs <pod-name> -n todo-app

# Check available resources
kubectl describe nodes
```

### Connection Refused
```bash
# Test SSH connectivity
ansible -i ansible/hosts.ini all -m ping

# Check SSH keys
ssh-add ~/.ssh/id_rsa
ssh -v ubuntu@192.168.1.10
```

### Playbook Fails Midway
```bash
# Run playbook again (idempotent)
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml

# Or run from specific task
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml --start-at-task="Initialize Kubernetes cluster"
```

---

## 📈 Performance Tuning

### Increase Ansible Timeout
```bash
export ANSIBLE_TIMEOUT=600
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml
```

### Parallel Execution
```bash
# Run on 5 hosts in parallel
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -f 5
```

---

## 🔐 Security Notes

- Generate strong SSH keys
- Use SSH key authentication (not password)
- Restrict firewall rules to cluster nodes only
- Enable RBAC on Kubernetes
- Use network policies for pod communication
- Enable audit logging

---

## 📝 Variables Reference

Edit `ansible/hosts.ini` to customize:

```ini
[all:vars]
kubernetes_version=1.27.0
pod_network_cidr=10.244.0.0/16
service_cidr=10.96.0.0/12
container_runtime=containerd
project_name="To-Do List Application"
environment=production
```

---

## 🎯 Quick Reference Commands

```bash
# Full setup
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml

# Check playbook syntax
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml --syntax-check

# Dry run (no changes)
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml --check

# Verbose output
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml -v

# List all tasks
ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml --list-tasks
```

---

## 📞 Support

For issues or questions, check:
- Ansible documentation: https://docs.ansible.com/
- Kubernetes documentation: https://kubernetes.io/docs/
- Project README: README.md

---

Your Kubernetes cluster is now fully automated! 🚀
