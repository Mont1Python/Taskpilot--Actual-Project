@echo off
REM Initialize Kind Kubernetes Cluster for To-Do App
REM Creates a 3-node cluster (1 control-plane + 2 workers)

setlocal enabledelayedexpansion

set CLUSTER_NAME=todo-cluster
set CLUSTER_CONFIG=kind-cluster-config.yaml

REM Colors
set BLUE=[94m
set GREEN=[92m
set YELLOW=[93m
set NC=[0m

echo %BLUE%========================================%NC%
echo %BLUE%Kind Kubernetes Cluster Setup%NC%
echo %BLUE%========================================%NC%
echo.

REM Check if Kind is installed
where kind >nul 2>nul
if errorlevel 1 (
    echo %BLUE%Kind is not installed.%NC%
    echo Install from: https://kind.sigs.k8s.io/docs/user/quick-start/
    exit /b 1
)
echo %GREEN%✓ Kind is installed%NC%

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo %BLUE%Docker is not running%NC%
    exit /b 1
)
echo %GREEN%✓ Docker is running%NC%
echo.

REM Check if cluster already exists
kind get clusters 2>nul | findstr /i "%CLUSTER_NAME%" >nul
if not errorlevel 1 (
    echo %YELLOW%Cluster '%CLUSTER_NAME%' already exists%NC%
    echo %YELLOW%Switching context...%NC%
    kubectl cluster-info --context=kind-%CLUSTER_NAME%
    goto :skip_create
)

REM Create cluster config
echo %YELLOW%Creating Kind cluster configuration...%NC%
(
echo kind: Cluster
echo apiVersion: kind.x-k8s.io/v1alpha4
echo name: %CLUSTER_NAME%
echo nodes:
echo   - role: control-plane
echo     image: kindest/node:v1.27.0
echo     ports:
echo       - containerPort: 80
echo         hostPort: 80
echo       - containerPort: 443
echo         hostPort: 443
echo   - role: worker
echo     image: kindest/node:v1.27.0
echo   - role: worker
echo     image: kindest/node:v1.27.0
echo networking:
echo   podSubnet: "10.244.0.0/16"
echo   serviceSubnet: "10.96.0.0/12"
) > %CLUSTER_CONFIG%

echo %GREEN%✓ Cluster config created: %CLUSTER_CONFIG%%NC%
echo.

REM Create cluster
echo %BLUE%Creating Kind Cluster: %CLUSTER_NAME%%NC%
echo %YELLOW%This may take 2-5 minutes...%NC%
echo.

kind create cluster --config %CLUSTER_CONFIG% --name %CLUSTER_NAME% --wait 5m
if errorlevel 1 (
    echo %BLUE%Failed to create cluster%NC%
    exit /b 1
)

echo %GREEN%✓ Cluster created successfully%NC%
echo.

REM Deploy Flannel CNI
echo %YELLOW%Deploying Flannel CNI...%NC%
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

echo %GREEN%✓ Flannel CNI deployed%NC%
echo.

:skip_create

REM Show cluster status
echo %BLUE%Cluster Nodes:%NC%
kubectl get nodes -o wide
echo.

echo %GREEN%✓ Cluster is ready!%NC%
echo.

echo %BLUE%========================================%NC%
echo %BLUE%Access Your Application%NC%
echo %BLUE%========================================%NC%
echo.
echo %BLUE%Frontend:%NC%
echo   http://localhost:30000 ^(via NodePort^)
echo   or port-forward: kubectl port-forward -n todo-app svc/frontend 3000:3000
echo.
echo %BLUE%Backend API:%NC%
echo   http://localhost:5000
echo   or port-forward: kubectl port-forward -n todo-app svc/backend 5000:5000
echo.
echo %BLUE%Useful Commands:%NC%
echo   kubectl get pods -n todo-app
echo   kubectl logs -f deployment/backend -n todo-app
echo   kubectl get svc -n todo-app -o wide
echo.
echo %BLUE%Deploy app:%NC%
echo   kubectl apply -f k8s/todo-app.yaml
echo.
echo %BLUE%Stop cluster:%NC%
echo   kind delete cluster --name %CLUSTER_NAME%
echo.

echo %GREEN%✓ Setup complete!%NC%

pause
