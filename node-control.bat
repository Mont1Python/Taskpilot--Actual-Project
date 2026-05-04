@echo off
REM Kubernetes Node Management Script for Kind Cluster
REM Start, Pause, Resume, and Check Status of Kubernetes Nodes

setlocal enabledelayedexpansion

set CLUSTER_NAME=todo-cluster
set PATH=%PATH%;C:\Users\Mac\AppData\Local\Docker

REM Colors
set BLUE=[94m
set GREEN=[92m
set YELLOW=[93m
set RED=[91m
set NC=[0m

if "%1%"=="" (
    call :show_help
    exit /b 0
)

if "%1%"=="status" (
    call :status_nodes
) else if "%1%"=="start" (
    call :start_cluster
) else if "%1%"=="pause" (
    call :pause_nodes
) else if "%1%"=="resume" (
    call :resume_nodes
) else if "%1%"=="stop" (
    call :stop_cluster
) else if "%1%"=="help" (
    call :show_help
) else (
    echo Unknown command: %1%
    call :show_help
    exit /b 1
)

exit /b 0

:status_nodes
echo %BLUE%========================================%NC%
echo %BLUE%Kubernetes Cluster Status%NC%
echo %BLUE%========================================%NC%
echo.
echo %BLUE%Cluster Name: %CLUSTER_NAME%%NC%
echo.
echo %BLUE%Nodes:%NC%
kubectl get nodes -o wide
echo.
echo %BLUE%Pods in todo-app namespace:%NC%
kubectl get pods -n todo-app -o wide
echo.
echo %BLUE%Deployments:%NC%
kubectl get deployment -n todo-app
echo.
echo %BLUE%Services:%NC%
kubectl get svc -n todo-app
echo.
echo %BLUE%StatefulSets:%NC%
kubectl get statefulset -n todo-app
echo.
exit /b 0

:start_cluster
echo %BLUE%========================================%NC%
echo %BLUE%Starting Kubernetes Cluster%NC%
echo %BLUE%========================================%NC%
echo %YELLOW%Starting Kind cluster '%CLUSTER_NAME%'...%NC%
kind start cluster --name %CLUSTER_NAME% --wait 2m
if errorlevel 1 (
    echo %RED%Failed to start cluster%NC%
    exit /b 1
)
echo %GREEN%✓ Cluster started successfully%NC%
echo.
echo %YELLOW%Cluster is ready. Redeploying app...%NC%
kubectl apply -f k8s\todo-app.yaml
echo %GREEN%✓ App deployed%NC%
echo.
call :status_nodes
exit /b 0

:pause_nodes
echo %BLUE%========================================%NC%
echo %BLUE%Pausing Kubernetes Nodes (Drain)%NC%
echo %BLUE%========================================%NC%
echo %YELLOW%Getting worker nodes...%NC%
for /f "tokens=1" %%N in ('kubectl get nodes -o jsonpath={.items[*].metadata.name} ^| findstr "worker"') do (
    echo %YELLOW%Draining node: %%N%NC%
    kubectl drain %%N --ignore-daemonsets --delete-emptydir-data --grace-period=30 --force 2>nul
    if errorlevel 0 (
        echo %GREEN%✓ Node %%N drained%NC%
    ) else (
        echo %RED%✗ Failed to drain %%N%NC%
    )
)
echo.
echo %YELLOW%Checking node status...%NC%
kubectl get nodes -o wide
echo.
echo %GREEN%✓ Nodes paused - pods have been evicted%NC%
exit /b 0

:resume_nodes
echo %BLUE%========================================%NC%
echo %BLUE%Resuming Kubernetes Nodes (Uncordon)%NC%
echo %BLUE%========================================%NC%
echo %YELLOW%Getting worker nodes...%NC%
for /f "tokens=1" %%N in ('kubectl get nodes -o jsonpath={.items[*].metadata.name} ^| findstr "worker"') do (
    echo %YELLOW%Uncordoning node: %%N%NC%
    kubectl uncordon %%N
    if errorlevel 0 (
        echo %GREEN%✓ Node %%N uncordoned%NC%
    ) else (
        echo %RED%✗ Failed to uncordon %%N%NC%
    )
)
echo.
echo %YELLOW%Redeploying application...%NC%
kubectl apply -f k8s\todo-app.yaml
echo %YELLOW%Waiting for pods to be ready...%NC%
timeout /t 15 /nobreak
echo.
echo %YELLOW%Checking pod status...%NC%
kubectl get pods -n todo-app
echo.
echo %GREEN%✓ Nodes resumed and app redeployed%NC%
exit /b 0

:stop_cluster
echo %BLUE%========================================%NC%
echo %BLUE%Stopping Kubernetes Cluster%NC%
echo %BLUE%========================================%NC%
echo %YELLOW%Deleting Kind cluster '%CLUSTER_NAME%'...%NC%
kind delete cluster --name %CLUSTER_NAME%
if errorlevel 1 (
    echo %RED%Failed to delete cluster%NC%
    exit /b 1
)
echo %GREEN%✓ Cluster deleted%NC%
exit /b 0

:show_help
echo.
echo %BLUE%Kubernetes Node Management Script%NC%
echo.
echo Usage: node-control.bat ^<command^>
echo.
echo Commands:
echo   status      Show cluster and node status
echo   start       Start the Kubernetes cluster
echo   pause       Pause nodes ^(drain all pods^)
echo   resume      Resume nodes ^(uncordon and redeploy^)
echo   stop        Stop and delete cluster
echo   help        Show this help message
echo.
echo Examples:
echo   node-control.bat status
echo   node-control.bat start
echo   node-control.bat pause
echo   node-control.bat resume
echo   node-control.bat stop
echo.
exit /b 0
