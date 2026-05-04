#!/bin/bash

# Kubernetes Dashboard Control Script
# Deploy, access, and manage Kubernetes Dashboard

set -e

DASHBOARD_NS="kubernetes-dashboard"
DASHBOARD_VERSION="${DASHBOARD_VERSION:-7.0.0}"

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
}

# Deploy Kubernetes Dashboard
deploy_dashboard() {
  print_header "Deploying Kubernetes Dashboard"
  
  print_info "Creating kubernetes-dashboard namespace..."
  kubectl create namespace ${DASHBOARD_NS} --dry-run=client -o yaml | kubectl apply -f - || true
  
  print_info "Deploying dashboard (v${DASHBOARD_VERSION})..."
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v${DASHBOARD_VERSION}/aio/deploy/recommended.yaml
  
  print_info "Waiting for dashboard pod to be ready (this may take 30-60 seconds)..."
  kubectl rollout status deployment/kubernetes-dashboard -n ${DASHBOARD_NS} --timeout=2m || true
  
  print_success "Dashboard deployed successfully"
}

# Check dashboard status
check_dashboard_status() {
  print_header "Dashboard Status"
  
  echo -e "\n${BLUE}Dashboard Pod:${NC}"
  kubectl get pods -n ${DASHBOARD_NS}
  
  echo -e "\n${BLUE}Dashboard Service:${NC}"
  kubectl get svc -n ${DASHBOARD_NS}
}

# Create admin user
create_admin_user() {
  print_header "Creating Dashboard Admin User"
  
  # Create service account
  kubectl create serviceaccount admin-user -n ${DASHBOARD_NS} --dry-run=client -o yaml | kubectl apply -f - || true
  
  # Create cluster role binding
  kubectl create clusterrolebinding admin-user --clusterrole=cluster-admin --serviceaccount=${DASHBOARD_NS}:admin-user --dry-run=client -o yaml | kubectl apply -f - || true
  
  print_success "Admin user created"
}

# Get dashboard token
get_dashboard_token() {
  print_header "Dashboard Access Token"
  
  echo -e "\n${YELLOW}Admin User Token:${NC}\n"
  kubectl -n ${DASHBOARD_NS} create token admin-user --duration=24h 2>/dev/null || \
  kubectl -n ${DASHBOARD_NS} describe secret $(kubectl -n ${DASHBOARD_NS} get secret -o name | grep admin-user) | grep token: | awk '{print $2}'
  
  echo -e "\n${BLUE}To login, copy the token above and use it in the dashboard login page.${NC}\n"
}

# Start port-forward proxy
start_proxy() {
  print_header "Starting Dashboard Proxy"
  
  check_dashboard_status
  
  # Check if port 8443 is already in use
  if lsof -Pi :8443 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    print_error "Port 8443 is already in use. Kill the process first:"
    echo "  lsof -ti:8443 | xargs kill -9"
    exit 1
  fi
  
  print_info "Starting port-forward on port 8443..."
  print_info "Dashboard will be available at: https://localhost:8443"
  print_info "Press Ctrl+C to stop the proxy"
  
  kubectl port-forward -n ${DASHBOARD_NS} svc/kubernetes-dashboard 8443:443
}

# Open dashboard in browser
open_dashboard() {
  print_header "Opening Kubernetes Dashboard"
  
  # Check if dashboard is running
  DASH_POD=$(kubectl get pods -n ${DASHBOARD_NS} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  if [ -z "$DASH_POD" ]; then
    print_error "Dashboard pod not found. Deploy it first with: $0 deploy"
    exit 1
  fi
  
  # Start port-forward in background
  print_info "Starting port-forward in background..."
  kubectl port-forward -n ${DASHBOARD_NS} svc/kubernetes-dashboard 8443:443 >/dev/null 2>&1 &
  PROXY_PID=$!
  sleep 3
  
  # Open browser
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open https://localhost:8443
    print_success "Dashboard opened in default browser (macOS)"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open https://localhost:8443 2>/dev/null || print_info "Dashboard available at: https://localhost:8443"
    print_success "Dashboard opened in default browser (Linux)"
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    start https://localhost:8443
    print_success "Dashboard opened in default browser (Windows)"
  else
    print_info "Dashboard available at: https://localhost:8443"
  fi
  
  print_info "Proxy running with PID: $PROXY_PID"
  print_info "To stop: kill $PROXY_PID"
  
  # Get and display token
  get_dashboard_token
}

# Remove dashboard
remove_dashboard() {
  print_header "Removing Kubernetes Dashboard"
  
  print_info "Deleting dashboard namespace..."
  kubectl delete namespace ${DASHBOARD_NS} --ignore-not-found=true
  
  print_success "Dashboard removed"
}

# Show help
show_help() {
  cat << EOF
${BLUE}Kubernetes Dashboard Control Script${NC}

Usage: $0 <command> [options]

Commands:
  deploy              Deploy Kubernetes Dashboard
  open                Deploy and open dashboard in browser with proxy
  proxy               Start port-forward proxy for dashboard
  status              Show dashboard status
  token               Get dashboard access token
  admin-user          Create admin user for dashboard
  remove              Remove Kubernetes Dashboard
  help                Show this help message

Examples:
  $0 deploy           # Deploy dashboard
  $0 open             # Deploy and open in browser
  $0 status           # Check dashboard status
  $0 token            # Get access token
  $0 remove           # Remove dashboard

Notes:
  - Dashboard will be available at: https://localhost:8443
  - Requires kubectl configured and connected to cluster
  - First time access requires accepting self-signed SSL certificate

Environment Variables:
  DASHBOARD_VERSION   Dashboard version (default: 7.0.0)

EOF
}

# Main command handler
case "${1:-help}" in
  deploy)
    check_kubectl
    deploy_dashboard
    create_admin_user
    check_dashboard_status
    ;;
  open)
    check_kubectl
    deploy_dashboard
    create_admin_user
    sleep 5
    open_dashboard
    ;;
  proxy)
    check_kubectl
    start_proxy
    ;;
  status)
    check_kubectl
    check_dashboard_status
    ;;
  token)
    check_kubectl
    get_dashboard_token
    ;;
  admin-user)
    check_kubectl
    create_admin_user
    print_success "Admin user created"
    ;;
  remove)
    check_kubectl
    remove_dashboard
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
