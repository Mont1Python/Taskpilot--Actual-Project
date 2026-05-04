@echo off
REM Kubernetes Cluster Control Script for Windows

setlocal enabledelayedexpansion

set MASTER_IP=192.168.1.10
set WORKER1_IP=192.168.1.11
set WORKER2_IP=192.168.1.12
set MASTER_USER=ubuntu

REM Colors
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

if "%1%"=="" (
    call :show_help
    exit /b 0
)

if "%1%"=="start" (
    call :start_cluster
) else if "%1%"=="stop" (
    call :stop_cluster
) else if "%1%"=="pause" (
    call :pause_cluster
) else if "%1%"=="resume" (
    call :resume_cluster
) else if "%1%"=="status" (
    call :status_cluster
) else if "%1%"=="help" (
    call :show_help
) else (
    echo Unknown command: %1%
    call :show_help
    exit /b 1
)

exit /b 0

:start_cluster
echo %BLUE%Starting Kubernetes Cluster%NC%
echo %YELLOW%Opening Docker Desktop...%NC%
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
timeout /t 60 /nobreak
echo %GREEN%Kubernetes cluster started%NC%
kubectl get nodes
exit /b 0

:stop_cluster
echo %BLUE%Stopping Kubernetes Cluster%NC%
echo %YELLOW%Closing Docker Desktop...%NC%
taskkill /IM "Docker Desktop.exe" /F 2>nul
echo %GREEN%Kubernetes cluster stopped%NC%
exit /b 0

:pause_cluster
echo %BLUE%Pausing Kubernetes Cluster%NC%
echo %YELLOW%Draining worker nodes...%NC%
kubectl drain %WORKER1_IP% --ignore-daemonsets --delete-emptydir-data --grace-period=30
kubectl drain %WORKER2_IP% --ignore-daemonsets --delete-emptydir-data --grace-period=30
echo %GREEN%Cluster paused%NC%
exit /b 0

:resume_cluster
echo %BLUE%Resuming Kubernetes Cluster%NC%
echo %YELLOW%Uncordoning worker nodes...%NC%
kubectl uncordon %WORKER1_IP%
kubectl uncordon %WORKER2_IP%
echo %YELLOW%Redeploying app...%NC%
kubectl apply -f k8s/todo-app.yaml
kubectl rollout status deployment/backend -n todo-app --timeout=5m
kubectl rollout status deployment/frontend -n todo-app --timeout=5m
echo %GREEN%Cluster resumed%NC%
exit /b 0

:status_cluster
echo %BLUE%Kubernetes Cluster Status%NC%
echo.
echo %BLUE%Nodes:%NC%
kubectl get nodes -o wide
echo.
echo %BLUE%To-Do App Pods:%NC%
kubectl get pods -n todo-app -o wide
echo.
echo %BLUE%Services:%NC%
kubectl get svc -n todo-app -o wide
echo.
echo %BLUE%Deployments:%NC%
kubectl get deployment -n todo-app
echo.
echo %BLUE%Cluster Info:%NC%
kubectl cluster-info
exit /b 0

:show_help
echo.
echo %BLUE%Kubernetes Cluster Control Script%NC%
echo.
echo Usage: k8s-control.bat ^<command^>
echo.
echo Commands:
echo   start       Start Kubernetes cluster
echo   stop        Stop Kubernetes cluster
echo   pause       Pause cluster ^(drain nodes^)
echo   resume      Resume cluster ^(uncordon nodes^)
echo   status      Show cluster status
echo   help        Show this help message
echo.
echo Examples:
echo   k8s-control.bat start
echo   k8s-control.bat status
echo   k8s-control.bat stop
echo.
exit /b 0
