#!/usr/bin/env python3

"""
Kubernetes Cluster Quick Commands Wrapper
Simple interactive CLI for common Kubernetes operations
"""

import subprocess
import sys
import os
from pathlib import Path

NAMESPACE = "todo-app"
SCRIPTS_DIR = Path(__file__).parent

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def run_cmd(cmd, display=True):
    """Run a shell command"""
    try:
        if display:
            print(f"{Colors.CYAN}$ {cmd}{Colors.END}\n")
        result = subprocess.run(cmd, shell=True, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"{Colors.RED}Error: {e}{Colors.END}")
        return False

def print_menu():
    """Print main menu"""
    print(f"\n{Colors.HEADER}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}Kubernetes Cluster Management{Colors.END}")
    print(f"{Colors.HEADER}{'='*60}{Colors.END}\n")
    
    print(f"{Colors.BLUE}Cluster Control:{Colors.END}")
    print("  1. Start cluster")
    print("  2. Stop cluster")
    print("  3. Pause cluster (drain nodes)")
    print("  4. Resume cluster (uncordon nodes)")
    print("  5. Check cluster status")
    
    print(f"\n{Colors.BLUE}Dashboard:{Colors.END}")
    print("  6. Deploy dashboard")
    print("  7. Open dashboard in browser")
    print("  8. Get dashboard token")
    print("  9. Remove dashboard")
    
    print(f"\n{Colors.BLUE}Monitoring & Logs:{Colors.END}")
    print(" 10. Show pod status")
    print(" 11. Show pod logs (choose pod)")
    print(" 12. Follow pod logs (live)")
    print(" 13. Describe pod details")
    print(" 14. Show pod metrics")
    print(" 15. Show events")
    print(" 16. Troubleshoot pod")
    print(" 17. Real-time monitoring")
    
    print(f"\n{Colors.BLUE}Deployment:{Colors.END}")
    print(" 18. Deploy to-do app")
    print(" 19. Restart deployment")
    print(" 20. Check rollout status")
    
    print(f"\n{Colors.BLUE}Other:{Colors.END}")
    print("  0. Exit")
    print()

def get_pods():
    """Get list of pods in namespace"""
    result = subprocess.run(
        f"kubectl get pods -n {NAMESPACE} -o jsonpath='{{.items[*].metadata.name}}'",
        shell=True,
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        return result.stdout.split()
    return []

def select_pod():
    """Interactive pod selection"""
    pods = get_pods()
    if not pods:
        print(f"{Colors.RED}No pods found in namespace {NAMESPACE}{Colors.END}")
        return None
    
    print(f"\n{Colors.CYAN}Available pods:{Colors.END}")
    for i, pod in enumerate(pods, 1):
        print(f"  {i}. {pod}")
    
    try:
        choice = int(input("\nSelect pod number: ")) - 1
        if 0 <= choice < len(pods):
            return pods[choice]
        else:
            print(f"{Colors.RED}Invalid selection{Colors.END}")
            return None
    except ValueError:
        print(f"{Colors.RED}Invalid input{Colors.END}")
        return None

def select_deployment():
    """Interactive deployment selection"""
    result = subprocess.run(
        f"kubectl get deployment -n {NAMESPACE} -o jsonpath='{{.items[*].metadata.name}}'",
        shell=True,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"{Colors.RED}Failed to get deployments{Colors.END}")
        return None
    
    deployments = result.stdout.split()
    if not deployments:
        print(f"{Colors.RED}No deployments found{Colors.END}")
        return None
    
    print(f"\n{Colors.CYAN}Available deployments:{Colors.END}")
    for i, deploy in enumerate(deployments, 1):
        print(f"  {i}. {deploy}")
    
    try:
        choice = int(input("\nSelect deployment number: ")) - 1
        if 0 <= choice < len(deployments):
            return deployments[choice]
        else:
            print(f"{Colors.RED}Invalid selection{Colors.END}")
            return None
    except ValueError:
        print(f"{Colors.RED}Invalid input{Colors.END}")
        return None

def main():
    """Main interactive menu"""
    while True:
        print_menu()
        
        try:
            choice = input(f"{Colors.YELLOW}Enter choice (0-20): {Colors.END}").strip()
        except KeyboardInterrupt:
            print(f"\n{Colors.YELLOW}Exiting...{Colors.END}")
            sys.exit(0)
        
        if choice == "0":
            print(f"{Colors.YELLOW}Goodbye!{Colors.END}")
            sys.exit(0)
        
        elif choice == "1":
            run_cmd("bash k8s-control.sh start")
        
        elif choice == "2":
            run_cmd("bash k8s-control.sh stop")
        
        elif choice == "3":
            run_cmd("bash k8s-control.sh pause")
        
        elif choice == "4":
            run_cmd("bash k8s-control.sh resume")
        
        elif choice == "5":
            run_cmd("bash k8s-control.sh status")
        
        elif choice == "6":
            run_cmd("bash k8s-dashboard.sh deploy")
        
        elif choice == "7":
            run_cmd("bash k8s-dashboard.sh open")
        
        elif choice == "8":
            run_cmd("bash k8s-dashboard.sh token")
        
        elif choice == "9":
            run_cmd("bash k8s-dashboard.sh remove")
        
        elif choice == "10":
            run_cmd("bash k8s-monitor.sh pods")
        
        elif choice == "11":
            pod = select_pod()
            if pod:
                run_cmd(f"bash k8s-monitor.sh logs {pod}")
        
        elif choice == "12":
            pod = select_pod()
            if pod:
                run_cmd(f"bash k8s-monitor.sh logs-f {pod}")
        
        elif choice == "13":
            pod = select_pod()
            if pod:
                run_cmd(f"bash k8s-monitor.sh describe {pod}")
        
        elif choice == "14":
            run_cmd("bash k8s-monitor.sh metrics")
        
        elif choice == "15":
            run_cmd("bash k8s-monitor.sh events")
        
        elif choice == "16":
            pod = select_pod()
            if pod:
                run_cmd(f"bash k8s-monitor.sh troubleshoot {pod}")
        
        elif choice == "17":
            run_cmd("bash k8s-monitor.sh monitor")
        
        elif choice == "18":
            run_cmd("kubectl apply -f k8s/todo-app.yaml")
        
        elif choice == "19":
            deploy = select_deployment()
            if deploy:
                run_cmd(f"bash k8s-monitor.sh restart {deploy}")
        
        elif choice == "20":
            deploy = select_deployment()
            if deploy:
                run_cmd(f"kubectl rollout status deployment/{deploy} -n {NAMESPACE} --timeout=5m")
        
        else:
            print(f"{Colors.RED}Invalid choice. Please try again.{Colors.END}")
        
        input(f"\n{Colors.YELLOW}Press Enter to continue...{Colors.END}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Interrupted by user{Colors.END}")
        sys.exit(0)
