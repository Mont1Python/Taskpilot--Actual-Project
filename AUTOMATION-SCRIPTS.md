# TaskPilot - Automation Scripts Documentation

## Executive Summary

This document provides comprehensive documentation for all automation scripts used in the TaskPilot project. These scripts enable automated deployment, testing, monitoring, and infrastructure management across development, staging, and production environments.

---

## Table of Contents

1. [Overview](#overview)
2. [Deployment Scripts](#deployment-scripts)
3. [Kubernetes Management](#kubernetes-management)
4. [Ansible Automation](#ansible-automation)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Utilities](#monitoring--utilities)
7. [Usage Guide](#usage-guide)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Project Architecture

**TaskPilot** is a full-stack application with:
- **Frontend**: React.js (http://localhost:3000)
- **Backend**: Node.js Express API (http://localhost:5000)
- **Database**: MongoDB (mongodb://localhost:27017)
- **Orchestration**: Docker Compose + Kubernetes
- **Automation**: Ansible Playbooks
- **CI/CD**: GitHub Actions

### Automation Objectives

| Objective | Tool | Status |
|-----------|------|--------|
| Local development | Docker Compose | ✅ Active |
| Infrastructure as Code | Kubernetes YAML | ✅ Active |
| Configuration Management | Ansible | ✅ Active |
| Automated Deployment | GitHub Actions | ✅ Active |
| Health Monitoring | Built-in healthchecks | ✅ Active |

---

## Deployment Scripts

### 1. Docker Compose (`docker-compose.yml`)

**Purpose**: Orchestrate local development environment

**Services**:
- `mongo`: MongoDB database
- `backend`: Node.js API server
- `frontend`: React application
- `ansible-panel`: Ansible control panel

**Usage**:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Clean up volumes
docker-compose down -v
```

**Features**:
- Automatic service restart on failure
- Health checks for backend and frontend
- Volume persistence for MongoDB
- Network isolation between services

### 2. Dockerfiles

#### `backend/Dockerfile`
Multi-stage build for Node.js API
```dockerfile
Stage 1: Install dependencies in builder image
Stage 2: Copy only node_modules, run application
Result: Optimized production image (~200MB)
```

#### `frontend/Dockerfile`
Multi-stage build for React application
```dockerfile
Stage 1: Build React app with npm install --legacy-peer-deps
Stage 2: Serve built artifacts with serve package
Result: Production-ready React bundle
```

#### `Dockerfile` (Ansible Panel)
Single-stage build
```dockerfile
- Installs Ansible and OpenSSH client
- Serves web control panel on port 3000
- Mounts playbooks from host
```

---

## Kubernetes Management

### Kubernetes Manifests

#### `k8s/todo-app.yaml`

**Namespace**: `todo-app`

**Components**:

1. **MongoDB StatefulSet**
   - Replicas: 3 (production cluster)
   - Storage: 5GB PersistentVolume per replica
   - Service: Headless for cluster communication

2. **Backend Deployment**
   - Replicas: 2
   - Pod Anti-Affinity: Distribute across nodes
   - Health Checks: Readiness + Liveness probes
   - Resource Limits: 256MB memory, 500m CPU

3. **Frontend Deployment**
   - Replicas: 2
   - Pod Anti-Affinity: Distribute across nodes
   - Health Checks: HTTP readiness probe
   - Resource Limits: 256MB memory, 500m CPU

4. **Services**
   - Backend: ClusterIP (internal)
   - Frontend: NodePort (accessible externally on port 30000)
   - MongoDB: Headless (StatefulSet DNS)

### Deployment Commands

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/todo-app.yaml

# Check deployment status
kubectl get pods -n todo-app
kubectl get svc -n todo-app
kubectl get statefulset -n todo-app

# View logs
kubectl logs -n todo-app deployment/backend
kubectl logs -n todo-app deployment/frontend

# Port forward for local access
kubectl port-forward -n todo-app svc/frontend 3000:3000
kubectl port-forward -n todo-app svc/backend 5000:5000

# Delete deployment
kubectl delete -f k8s/todo-app.yaml
```

---

## Ansible Automation

### Ansible Configuration

**File**: `ansible.cfg`

```ini
[defaults]
inventory = ./inventory.ini          # Host inventory
become = False                       # No sudo for localhost
host_key_checking = False            # Allow new hosts
pipelining = True                    # Faster execution
log_path = /tmp/ansible.log          # Execution logs
```

### Ansible Inventory

**File**: `inventory.ini`

```ini
[all]
localhost ansible_connection=local

[kubernetes_master]
localhost ansible_connection=local
```

### Ansible Playbook

**File**: `playbooks/site.yml`

**Purpose**: Deployment verification and simulation

**Phases**:
1. System prerequisites
2. Kernel configuration
3. Container runtime installation
4. Kubernetes tools installation
5. Master node initialization
6. Worker nodes join
7. CNI deployment
8. Application deployment
9. Cluster verification

**Usage**:
```bash
# Execute playbook
ansible-playbook playbooks/site.yml

# Dry-run (check mode)
ansible-playbook playbooks/site.yml --check

# Verbose output
ansible-playbook playbooks/site.yml -v

# Specific hosts
ansible-playbook playbooks/site.yml -i inventory.ini
```

### Ansible Control Panel

**Web UI**: http://localhost:3001

**Features**:
- Execute Playbook button (Dry-run support)
- Landscape Monitoring (view all hosts)
- Deployment History tracking
- Real-time output streaming

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/ci-cd.yaml`

**Trigger Events**:
- Push to `main` branch
- Push to `develop` branch
- Pull requests to `main`/`develop`

### Pipeline Stages

#### Stage 1: Test
- Job: `test` (matrix: backend, frontend)
- Status: `continue-on-error: true` (non-blocking)
- Action: Run npm tests (optional)

#### Stage 2: Build
- Job: `build` (matrix: backend, frontend)
- Status: `continue-on-error: true` (non-blocking)
- Action: Build Docker images with Buildx
- Caching: GitHub Actions cache for layers

#### Stage 3: Deploy
- Job: `deploy` (only on main branch push)
- Status: `continue-on-error: true` (non-blocking)
- Action: Apply Kubernetes manifests
- Verification: Check pod status

### Workflow YAML Structure

```yaml
name: CI/CD
on: [push, pull_request]
env: [REGISTRY, NODE_VERSION]
jobs:
  test: [backend, frontend]          # Run tests
  build: [backend, frontend]         # Build Docker
  deploy: [kubectl apply]            # Deploy K8s
```

### Key Features

✅ **Independent Jobs**: Each service builds independently
✅ **Error Resilience**: `continue-on-error` prevents cascade failures
✅ **Caching**: GitHub Actions cache speeds up builds
✅ **Conditional Deploy**: Only deploys on main branch push
✅ **Artifact Push**: Pushes to container registry on success

---

## Monitoring & Utilities

### Health Checks

All services include health checks:

```dockerfile
# Backend
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/health

# Frontend
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000')"
```

### Docker Commands for Monitoring

```bash
# Check service health
docker ps --format "table {{.Names}}\t{{.Status}}"

# View service logs
docker logs -f <service-name>

# Check resource usage
docker stats

# Inspect service details
docker inspect <service-name>
```

### Kubernetes Monitoring

```bash
# Get all pods
kubectl get pods -n todo-app

# Get service endpoints
kubectl get svc -n todo-app

# Describe pod for troubleshooting
kubectl describe pod -n todo-app <pod-name>

# View pod logs
kubectl logs -n todo-app <pod-name>

# Get events
kubectl get events -n todo-app
```

---

## Usage Guide

### Local Development Workflow

#### 1. Start Services
```bash
docker-compose up -d
```

#### 2. Access Applications
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Ansible Panel: http://localhost:3001
- MongoDB: mongodb://localhost:27017

#### 3. Test APIs
```bash
# Backend health
curl http://localhost:5000/health

# Ansible execution
curl -X POST http://localhost:3001/api/apply \
  -H "Content-Type: application/json" \
  -d '{"playbook":"site.yml","dryRun":false}'
```

#### 4. Stop Services
```bash
docker-compose down
```

### Kubernetes Deployment Workflow

#### 1. Deploy Application
```bash
kubectl apply -f k8s/todo-app.yaml
```

#### 2. Wait for Rollout
```bash
kubectl rollout status deployment/backend -n todo-app
kubectl rollout status deployment/frontend -n todo-app
```

#### 3. Access Services
```bash
# Port forward
kubectl port-forward -n todo-app svc/frontend 3000:3000

# Get NodePort
kubectl get svc -n todo-app frontend
```

#### 4. Monitor Pods
```bash
kubectl get pods -n todo-app -w
```

### Ansible Automation Workflow

#### 1. Update Inventory
Edit `inventory.ini` with target hosts

#### 2. Run Playbook
```bash
ansible-playbook playbooks/site.yml
```

#### 3. Check Results
```bash
cat /tmp/ansible.log
```

#### 4. Use Web UI
- Open http://localhost:3001
- Click "Execute Playbook"
- Monitor output in real-time

---

## Troubleshooting

### Docker Issues

#### Problem: Port already in use
```bash
# Stop conflicting service
docker-compose down

# Or change port in docker-compose.yml
```

#### Problem: Container exits immediately
```bash
# Check logs
docker logs <service-name>

# Inspect container
docker inspect <service-name>
```

#### Problem: Out of disk space
```bash
# Clean up images and containers
docker system prune -a

# Remove volumes
docker system prune -a --volumes
```

### Kubernetes Issues

#### Problem: Pods not starting
```bash
# Get pod status
kubectl describe pod -n todo-app <pod-name>

# Check logs
kubectl logs -n todo-app <pod-name>

# Check events
kubectl get events -n todo-app
```

#### Problem: Services not accessible
```bash
# Check service endpoints
kubectl get endpoints -n todo-app

# Verify pod labels match selectors
kubectl get pods -n todo-app --show-labels
```

#### Problem: PersistentVolume issues
```bash
# Check PVC status
kubectl get pvc -n todo-app

# Describe PVC
kubectl describe pvc -n todo-app <pvc-name>
```

### Ansible Issues

#### Problem: Playbook execution fails
```bash
# Run in verbose mode
ansible-playbook playbooks/site.yml -v

# Check inventory
ansible-inventory -i inventory.ini --list

# Test connectivity
ansible all -i inventory.ini -m ping
```

#### Problem: SSH connection errors
```bash
# Check SSH config in ansible.cfg
ssh_args = -o ControlMaster=auto -o ControlPersist=60s

# Test SSH manually
ssh -i <key> <user>@<host>
```

### CI/CD Issues

#### Problem: GitHub Actions workflow fails
1. Check `.github/workflows/ci-cd.yaml` syntax
2. Verify branch protection rules
3. Check secrets are configured
4. Review action logs in GitHub UI

#### Problem: Docker build fails
1. Verify Dockerfile syntax
2. Check .dockerignore exclusions
3. Review build logs
4. Test locally with `docker build`

---

## Best Practices

### Development
- Always run `docker-compose up -d` before local development
- Use `docker logs` to debug issues
- Commit changes to git before CI/CD runs

### Deployment
- Test Kubernetes manifests locally first
- Use namespaces to isolate environments
- Monitor pod status after deployment
- Keep backups of PersistentVolumes

### Automation
- Use `--check` mode before running Ansible
- Test playbooks on staging first
- Monitor `/tmp/ansible.log` for errors
- Keep inventory.ini updated

### CI/CD
- Ensure all tests pass locally
- Push only from main branch for production
- Monitor GitHub Actions logs
- Document deployment procedures

---

## Maintenance

### Regular Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Check service health | Daily | `docker ps` |
| Review logs | Weekly | `docker logs` |
| Clean up resources | Monthly | `docker system prune` |
| Update dependencies | Quarterly | `npm update` |
| Backup database | Daily | K8s persistent volumes |

### Version Control

```bash
# Current versions used
- Node.js: 18
- Docker: Latest
- Kubernetes: 1.27+
- Ansible: Latest
- MongoDB: 6.0
```

---

## Support & Resources

### Documentation Files
- `DEPLOYMENT.md` - Deployment guide
- `README.md` - Project overview
- `.github/workflows/ci-cd.yaml` - CI/CD configuration

### External Links
- Docker: https://docs.docker.com
- Kubernetes: https://kubernetes.io/docs
- Ansible: https://docs.ansible.com
- GitHub Actions: https://docs.github.com/en/actions

### Contact
For issues or questions, refer to the project's GitHub Issues section.

---

## Appendix

### Quick Reference

```bash
# Docker Compose
docker-compose up -d              # Start
docker-compose down               # Stop
docker-compose logs -f            # View logs

# Kubernetes
kubectl apply -f k8s/todo-app.yaml               # Deploy
kubectl get pods -n todo-app                     # List pods
kubectl port-forward -n todo-app svc/frontend 3000:3000  # Port forward

# Ansible
ansible-playbook playbooks/site.yml              # Execute
ansible-playbook playbooks/site.yml --check      # Dry-run

# GitHub Actions
git push origin main              # Trigger CI/CD
```

### File Structure
```
TaskPilot/
├── .github/workflows/ci-cd.yaml      # GitHub Actions pipeline
├── docker-compose.yml                 # Docker Compose config
├── Dockerfile                         # Ansible panel image
├── backend/
│   └── Dockerfile                    # Backend image
├── frontend/
│   └── Dockerfile                    # Frontend image
├── k8s/
│   ├── todo-app.yaml                 # K8s manifests
│   └── taskpilot-app.yaml            # Alternative manifests
├── ansible/
│   ├── ansible.cfg                   # Ansible config
│   └── inventory.ini                 # Host inventory
└── playbooks/
    └── site.yml                      # Main playbook
```

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Status**: Complete ✅
