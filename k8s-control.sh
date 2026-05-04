#!/bin/bash

# Kubernetes Cluster Control Script
# Commands: start, stop, pause, resume, status

set -e

MASTER_IP="${MASTER_IP:-192.168.1.10}"
WORKER1_IP="${WORKER1_IP:-192.168.1.11}"
WORKER2_IP="${WORKER2_IP:-192.168.1.12}"
MASTER_USER="${MASTER_USER:-ubuntu}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if kubectl is installed
check_kubectl() {
  if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Install it first."
    exit 1
  fi
  print_success "kubectl is installed"
}

# Start Kubernetes cluster
start_cluster() {
  print_header "Starting Kubernetes Cluster"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    print_info "Starting Docker Desktop Kubernetes (macOS)..."
    open /Applications/Docker.app
    sleep 30
    kubectl cluster-info
    print_success "Kubernetes cluster started on Docker Desktop"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_info "Starting kubelet on all nodes..."
    ssh ${MASTER_USER}@${MASTER_IP} "sudo systemctl start kubelet" 2>/dev/null || print_error "Failed to start kubelet on master"
    ssh ${MASTER_USER}@${WORKER1_IP} "sudo systemctl start kubelet" 2>/dev/null || print_error "Failed to start kubelet on worker1"
    ssh ${MASTER_USER}@${WORKER2_IP} "sudo systemctl start kubelet" 2>/dev/null || print_error "Failed to start kubelet on worker2"
    sleep 10
    kubectl get nodes
    print_success "Kubernetes cluster started"
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    print_info "Starting Docker Desktop Kubernetes (Windows)..."
    powershell -Command "Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'"
    timeout 60 powershell -Command "while (-not (& kubectl cluster-info 2>$null)) { Start-Sleep -Seconds 5 }"
    print_success "Kubernetes cluster started on Docker Desktop"
  fi
}

# Stop Kubernetes cluster
stop_cluster() {
  print_header "Stopping Kubernetes Cluster"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    print_info "Stopping Docker Desktop Kubernetes (macOS)..."
    pkill -f "Docker.app" || print_error "Failed to stop Docker Desktop"
    print_success "Kubernetes cluster stopped"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_info "Stopping kubelet on all nodes..."
    ssh ${MASTER_USER}@${MASTER_IP} "sudo systemctl stop kubelet" 2>/dev/null || print_error "Failed to stop kubelet on master"
    ssh ${MASTER_USER}@${WORKER1_IP} "sudo systemctl stop kubelet" 2>/dev/null || print_error "Failed to stop kubelet on worker1"
    ssh ${MASTER_USER}@${WORKER2_IP} "sudo systemctl stop kubelet" 2>/dev/null || print_error "Failed to stop kubelet on worker2"
    print_success "Kubernetes cluster stopped"
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    print_info "Stopping Docker Desktop Kubernetes (Windows)..."
    powershell -Command "Stop-Process -Name 'Docker Desktop' -Force -ErrorAction SilentlyContinue"
    print_success "Kubernetes cluster stopped"
  fi
}

# Pause Kubernetes (drain nodes)
pause_cluster() {
  print_header "Pausing Kubernetes Cluster (Draining Nodes)"
  
  print_info "Draining worker1..."
  kubectl drain ${WORKER1_IP} --ignore-daemonsets --delete-emptydir-data --grace-period=30 || print_error "Failed to drain worker1"
  
  print_info "Draining worker2..."
  kubectl drain ${WORKER2_IP} --ignore-daemonsets --delete-emptydir-data --grace-period=30 || print_error "Failed to drain worker2"
  
  print_success "Cluster paused (all pods evicted from workers)"
}

# Resume Kubernetes (uncordon nodes)
resume_cluster() {
  print_header "Resuming Kubernetes Cluster (Uncordoning Nodes)"
  
  print_info "Uncordoning worker1..."
  kubectl uncordon ${WORKER1_IP} || print_error "Failed to uncordon worker1"
  
  print_info "Uncordoning worker2..."
  kubectl uncordon ${WORKER2_IP} || print_error "Failed to uncordon worker2"
  
  print_info "Redeploying to-do app..."
  kubectl apply -f k8s/todo-app.yaml
  kubectl rollout status deployment/backend -n todo-app --timeout=5m || print_error "Backend rollout failed"
  kubectl rollout status deployment/frontend -n todo-app --timeout=5m || print_error "Frontend rollout failed"
  
  print_success "Cluster resumed and app redeployed"
}

# Show cluster status
status_cluster() {
  print_header "Kubernetes Cluster Status"
  
  echo -e "\n${BLUE}Nodes:${NC}"
  kubectl get nodes -o wide
  
  echo -e "\n${BLUE}Namespaces:${NC}"
  kubectl get ns
  
  echo -e "\n${BLUE}To-Do App Pods:${NC}"
  kubectl get pods -n todo-app -o wide
  
  echo -e "\n${BLUE}To-Do App Services:${NC}"
  kubectl get svc -n todo-app -o wide
  
  echo -e "\n${BLUE}To-Do App Deployments:${NC}"
  kubectl get deployment -n todo-app
  
  echo -e "\n${BLUE}MongoDB StatefulSet:${NC}"
  kubectl get statefulset -n todo-app
  
  echo -e "\n${BLUE}Cluster Info:${NC}"
  kubectl cluster-info
}

# Show help
show_help() {
  cat << EOF
${BLUE}Kubernetes Cluster Control Script${NC}

Usage: $0 <command> [options]

Commands:
  start              Start Kubernetes cluster
  stop               Stop Kubernetes cluster
  pause              Pause cluster (drain nodes)
  resume             Resume cluster (uncordon nodes)
  status             Show cluster status
  help               Show this help message

Examples:
  $0 start
  $0 status
  $0 pause
  $0 resume
  $0 stop

Environment Variables:
  MASTER_IP          Master node IP (default: 192.168.1.10)
  WORKER1_IP         Worker1 node IP (default: 192.168.1.11)
  WORKER2_IP         Worker2 node IP (default: 192.168.1.12)
  MASTER_USER        SSH user for nodes (default: ubuntu)

EOF
}

# Main command handler
case "${1:-status}" in
  start)
    check_kubectl
    start_cluster
    status_cluster
    ;;
  stop)
    check_kubectl
    stop_cluster
    ;;
  pause)
    check_kubectl
    pause_cluster
    ;;
  resume)
    check_kubectl
    resume_cluster
    ;;
  status)
    check_kubectl
    status_cluster
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    print_error "Unknown command: $1"
    show_help
    exit 1
    ;;
esac
