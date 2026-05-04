#!/bin/bash

# Kubernetes Monitoring and Logs Script
# View logs, metrics, and troubleshoot pods

set -e

NAMESPACE="todo-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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
    print_error "kubectl is not installed."
    exit 1
  fi
}

# Show logs for a specific pod
show_pod_logs() {
  local pod=$1
  local follow=${2:-false}
  
  if [ -z "$pod" ]; then
    print_error "Pod name required"
    exit 1
  fi
  
  print_header "Pod Logs: $pod"
  
  if [ "$follow" = "true" ]; then
    kubectl logs -f "$pod" -n ${NAMESPACE}
  else
    kubectl logs "$pod" -n ${NAMESPACE}
  fi
}

# Show logs for deployment
show_deployment_logs() {
  local deployment=$1
  local follow=${2:-false}
  
  if [ -z "$deployment" ]; then
    print_error "Deployment name required"
    exit 1
  fi
  
  print_header "Deployment Logs: $deployment"
  
  if [ "$follow" = "true" ]; then
    kubectl logs -f "deployment/$deployment" -n ${NAMESPACE} --all-containers=true
  else
    kubectl logs "deployment/$deployment" -n ${NAMESPACE} --all-containers=true
  fi
}

# Describe pod details
describe_pod() {
  local pod=$1
  
  if [ -z "$pod" ]; then
    print_error "Pod name required"
    exit 1
  fi
  
  print_header "Pod Details: $pod"
  kubectl describe pod "$pod" -n ${NAMESPACE}
}

# Show pod resource usage
show_pod_metrics() {
  print_header "Pod Resource Usage"
  
  if ! kubectl top pods -n ${NAMESPACE} &>/dev/null; then
    print_error "Metrics Server not available. Install with:"
    echo "  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
    return 1
  fi
  
  kubectl top pods -n ${NAMESPACE}
}

# Show node resource usage
show_node_metrics() {
  print_header "Node Resource Usage"
  
  if ! kubectl top nodes &>/dev/null; then
    print_error "Metrics Server not available."
    return 1
  fi
  
  kubectl top nodes
}

# Show pod events
show_events() {
  print_header "Cluster Events"
  
  kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp'
}

# Show pod status
show_pod_status() {
  print_header "Pod Status"
  
  kubectl get pods -n ${NAMESPACE} -o wide
  
  echo -e "\n${BLUE}Pod Readiness:${NC}"
  kubectl get pods -n ${NAMESPACE} -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}'
}

# Exec into pod
exec_into_pod() {
  local pod=$1
  local cmd=${2:-/bin/sh}
  
  if [ -z "$pod" ]; then
    print_error "Pod name required"
    exit 1
  fi
  
  print_header "Executing into pod: $pod"
  print_info "Command: $cmd"
  
  kubectl exec -it "$pod" -n ${NAMESPACE} -- $cmd
}

# Get pod IP and connections
show_pod_network() {
  print_header "Pod Network Information"
  
  echo -e "${BLUE}Pod IPs:${NC}"
  kubectl get pods -n ${NAMESPACE} -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.podIP}{"\n"}{end}'
  
  echo -e "\n${BLUE}Services:${NC}"
  kubectl get svc -n ${NAMESPACE} -o wide
  
  echo -e "\n${BLUE}Endpoints:${NC}"
  kubectl get endpoints -n ${NAMESPACE}
}

# Restart a deployment
restart_deployment() {
  local deployment=$1
  
  if [ -z "$deployment" ]; then
    print_error "Deployment name required"
    exit 1
  fi
  
  print_header "Restarting Deployment: $deployment"
  
  kubectl rollout restart deployment/$deployment -n ${NAMESPACE}
  kubectl rollout status deployment/$deployment -n ${NAMESPACE} --timeout=5m
  
  print_success "Deployment restarted"
}

# Show all resources in namespace
show_all_resources() {
  print_header "All Resources in $NAMESPACE"
  
  kubectl get all -n ${NAMESPACE} -o wide
}

# Real-time monitoring
monitor_pods() {
  print_header "Real-Time Pod Monitoring (Press Ctrl+C to exit)"
  
  watch -n 2 'kubectl get pods -n '${NAMESPACE}' -o wide && echo "" && kubectl top pods -n '${NAMESPACE}' 2>/dev/null || echo "Metrics unavailable"'
}

# Troubleshoot pod
troubleshoot_pod() {
  local pod=$1
  
  if [ -z "$pod" ]; then
    print_error "Pod name required"
    exit 1
  fi
  
  print_header "Troubleshooting Pod: $pod"
  
  echo -e "\n${CYAN}1. Pod Status:${NC}"
  kubectl get pod "$pod" -n ${NAMESPACE} -o wide
  
  echo -e "\n${CYAN}2. Pod Events:${NC}"
  kubectl describe pod "$pod" -n ${NAMESPACE} | tail -20
  
  echo -e "\n${CYAN}3. Container Logs:${NC}"
  kubectl logs "$pod" -n ${NAMESPACE} --all-containers=true --tail=50
  
  echo -e "\n${CYAN}4. Previous Logs (if crashed):${NC}"
  kubectl logs "$pod" -n ${NAMESPACE} --previous --all-containers=true 2>/dev/null || echo "No previous logs"
}

# Show help
show_help() {
  cat << EOF
${BLUE}Kubernetes Monitoring & Logs Script${NC}

Usage: $0 <command> [pod-name]

Commands:
  pods                Show all pod status
  events              Show cluster events
  network             Show pod network information
  metrics             Show pod resource usage (requires Metrics Server)
  node-metrics        Show node resource usage
  logs <pod>          Show pod logs
  logs-f <pod>        Follow pod logs (live)
  deploy-logs <name>  Show deployment logs
  deploy-logs-f <nm>  Follow deployment logs
  describe <pod>      Show detailed pod information
  exec <pod> [cmd]    Execute command in pod (default: /bin/sh)
  restart <deploy>    Restart a deployment
  troubleshoot <pod>  Troubleshoot a failing pod
  all                 Show all resources in namespace
  monitor             Real-time monitoring (requires 'watch' command)
  help                Show this help message

Examples:
  $0 pods
  $0 logs backend-xyz-123
  $0 logs-f frontend-abc-456
  $0 deploy-logs backend
  $0 describe backend-xyz-123
  $0 exec backend-xyz-123
  $0 exec backend-xyz-123 'curl localhost:5000/health'
  $0 restart backend
  $0 troubleshoot backend-xyz-123
  $0 metrics
  $0 monitor

Environment Variables:
  NAMESPACE           Kubernetes namespace (default: todo-app)

EOF
}

# Main command handler
case "${1:-help}" in
  pods)
    check_kubectl
    show_pod_status
    ;;
  events)
    check_kubectl
    show_events
    ;;
  network)
    check_kubectl
    show_pod_network
    ;;
  metrics)
    check_kubectl
    show_pod_metrics
    ;;
  node-metrics)
    check_kubectl
    show_node_metrics
    ;;
  logs)
    check_kubectl
    show_pod_logs "$2" false
    ;;
  logs-f)
    check_kubectl
    show_pod_logs "$2" true
    ;;
  deploy-logs)
    check_kubectl
    show_deployment_logs "$2" false
    ;;
  deploy-logs-f)
    check_kubectl
    show_deployment_logs "$2" true
    ;;
  describe)
    check_kubectl
    describe_pod "$2"
    ;;
  exec)
    check_kubectl
    exec_into_pod "$2" "${3:-/bin/sh}"
    ;;
  restart)
    check_kubectl
    restart_deployment "$2"
    ;;
  troubleshoot)
    check_kubectl
    troubleshoot_pod "$2"
    ;;
  all)
    check_kubectl
    show_all_resources
    ;;
  monitor)
    check_kubectl
    monitor_pods
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
