#!/bin/bash

# Kubernetes Node Management Script for Kind Cluster
# Start, Pause, Resume, and Check Status of Kubernetes Nodes

CLUSTER_NAME="todo-cluster"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

status_nodes() {
  print_header "Kubernetes Cluster Status"
  
  echo -e "\n${BLUE}Cluster Name: $CLUSTER_NAME${NC}"
  
  echo -e "\n${BLUE}Nodes:${NC}"
  kubectl get nodes -o wide
  
  echo -e "\n${BLUE}Pods in todo-app namespace:${NC}"
  kubectl get pods -n todo-app -o wide
  
  echo -e "\n${BLUE}Deployments:${NC}"
  kubectl get deployment -n todo-app
  
  echo -e "\n${BLUE}Services:${NC}"
  kubectl get svc -n todo-app
  
  echo -e "\n${BLUE}StatefulSets:${NC}"
  kubectl get statefulset -n todo-app
}

start_cluster() {
  print_header "Starting Kubernetes Cluster"
  
  print_info "Starting Kind cluster '$CLUSTER_NAME'..."
  kind start cluster --name ${CLUSTER_NAME} --wait 2m
  
  if [ $? -eq 0 ]; then
    print_success "Cluster started successfully"
  else
    print_error "Failed to start cluster"
    return 1
  fi
  
  echo ""
  print_info "Cluster is ready. Redeploying app..."
  kubectl apply -f k8s/todo-app.yaml
  print_success "App deployed"
  
  echo ""
  status_nodes
}

pause_nodes() {
  print_header "Pausing Kubernetes Nodes (Drain)"
  
  print_info "Getting worker nodes..."
  
  for node in $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}' | grep worker); do
    echo ""
    print_info "Draining node: $node"
    kubectl drain $node --ignore-daemonsets --delete-emptydir-data --grace-period=30 --force 2>/dev/null
    if [ $? -eq 0 ]; then
      print_success "Node $node drained"
    else
      print_error "Failed to drain $node"
    fi
  done
  
  echo ""
  print_info "Checking node status..."
  kubectl get nodes -o wide
  
  echo ""
  print_success "Nodes paused - pods have been evicted"
}

resume_nodes() {
  print_header "Resuming Kubernetes Nodes (Uncordon)"
  
  print_info "Getting worker nodes..."
  
  for node in $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}' | grep worker); do
    echo ""
    print_info "Uncordoning node: $node"
    kubectl uncordon $node
    if [ $? -eq 0 ]; then
      print_success "Node $node uncordoned"
    else
      print_error "Failed to uncordon $node"
    fi
  done
  
  echo ""
  print_info "Redeploying application..."
  kubectl apply -f k8s/todo-app.yaml
  
  print_info "Waiting for pods to be ready..."
  sleep 15
  
  echo ""
  print_info "Checking pod status..."
  kubectl get pods -n todo-app
  
  echo ""
  print_success "Nodes resumed and app redeployed"
}

stop_cluster() {
  print_header "Stopping Kubernetes Cluster"
  
  print_info "Deleting Kind cluster '$CLUSTER_NAME'..."
  kind delete cluster --name ${CLUSTER_NAME}
  
  if [ $? -eq 0 ]; then
    print_success "Cluster deleted"
  else
    print_error "Failed to delete cluster"
    return 1
  fi
}

show_help() {
  cat << EOF
${BLUE}Kubernetes Node Management Script${NC}

Usage: $0 <command>

Commands:
  status      Show cluster and node status
  start       Start the Kubernetes cluster
  pause       Pause nodes (drain all pods)
  resume      Resume nodes (uncordon and redeploy)
  stop        Stop and delete cluster
  help        Show this help message

Examples:
  $0 status
  $0 start
  $0 pause
  $0 resume
  $0 stop

EOF
}

case "${1:-help}" in
  status)
    status_nodes
    ;;
  start)
    start_cluster
    ;;
  pause)
    pause_nodes
    ;;
  resume)
    resume_nodes
    ;;
  stop)
    stop_cluster
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
