#!/bin/bash

# Initialize Kind Kubernetes Cluster for To-Do App
# Creates a 3-node cluster (1 control-plane + 2 workers)

set -e

CLUSTER_NAME="${CLUSTER_NAME:-todo-cluster}"
CLUSTER_CONFIG="kind-cluster-config.yaml"

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

# Check if Kind is installed
check_kind() {
  if ! command -v kind &> /dev/null; then
    print_error "Kind is not installed."
    echo "Install from: https://kind.sigs.k8s.io/docs/user/quick-start/"
    exit 1
  fi
  print_success "Kind is installed"
}

# Check if Docker is running
check_docker() {
  if ! docker ps &> /dev/null; then
    print_error "Docker is not running"
    exit 1
  fi
  print_success "Docker is running"
}

# Create Kind cluster config
create_cluster_config() {
  print_info "Creating Kind cluster configuration..."
  
  cat > ${CLUSTER_CONFIG} << 'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: todo-cluster
nodes:
  - role: control-plane
    image: kindest/node:v1.27.0
    ports:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
  - role: worker
    image: kindest/node:v1.27.0
  - role: worker
    image: kindest/node:v1.27.0
networking:
  podSubnet: "10.244.0.0/16"
  serviceSubnet: "10.96.0.0/12"
EOF
  
  print_success "Cluster config created: ${CLUSTER_CONFIG}"
}

# Create cluster
create_cluster() {
  print_header "Creating Kind Cluster: $CLUSTER_NAME"
  
  print_info "This may take 2-5 minutes..."
  kind create cluster --config ${CLUSTER_CONFIG} --name ${CLUSTER_NAME} --wait 5m
  
  print_success "Cluster created successfully"
}

# Wait for cluster to be ready
wait_for_cluster() {
  print_info "Waiting for cluster to be ready..."
  
  kubectl wait --for=condition=Ready node --all --timeout=300s || true
  
  print_success "Cluster is ready"
}

# Deploy Flannel CNI
deploy_cni() {
  print_info "Deploying Flannel CNI..."
  
  kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
  
  print_success "Flannel CNI deployed"
}

# Verify cluster nodes
verify_nodes() {
  print_header "Cluster Nodes"
  
  kubectl get nodes -o wide
  
  print_success "All nodes are running"
}

# Deploy to-do app
deploy_app() {
  print_header "Deploying To-Do App"
  
  print_info "Applying Kubernetes manifests..."
  kubectl apply -f k8s/todo-app.yaml
  
  print_info "Waiting for deployments to be ready..."
  kubectl wait --for=condition=available --timeout=300s deployment/backend -n todo-app || true
  kubectl wait --for=condition=available --timeout=300s deployment/frontend -n todo-app || true
  
  print_success "To-Do app deployed"
}

# Show access information
show_access_info() {
  print_header "Access Your Application"
  
  echo -e "\n${BLUE}Frontend:${NC}"
  echo "  http://localhost:30000 (via NodePort)"
  echo "  or use port-forward:"
  echo "  kubectl port-forward -n todo-app svc/frontend 3000:3000"
  
  echo -e "\n${BLUE}Backend API:${NC}"
  echo "  http://localhost:5000"
  echo "  or use port-forward:"
  echo "  kubectl port-forward -n todo-app svc/backend 5000:5000"
  
  echo -e "\n${BLUE}Useful Commands:${NC}"
  echo "  kubectl get pods -n todo-app"
  echo "  kubectl logs -f deployment/backend -n todo-app"
  echo "  kubectl get svc -n todo-app -o wide"
  echo "  kubectl get all -n todo-app"
  
  echo -e "\n${BLUE}Stop Cluster:${NC}"
  echo "  kind delete cluster --name ${CLUSTER_NAME}"
  echo ""
}

# Check if cluster already exists
cluster_exists() {
  kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$" && return 0 || return 1
}

# Main
main() {
  print_header "Kind Kubernetes Cluster Setup"
  
  check_kind
  check_docker
  
  if cluster_exists; then
    print_info "Cluster '$CLUSTER_NAME' already exists"
    print_info "Switching context..."
    kubectl cluster-info --context=kind-${CLUSTER_NAME}
  else
    create_cluster_config
    create_cluster
    wait_for_cluster
    deploy_cni
    verify_nodes
  fi
  
  # Optional: Deploy app
  read -p "Deploy to-do app to cluster? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    deploy_app
  fi
  
  show_access_info
  print_success "Setup complete!"
}

main
