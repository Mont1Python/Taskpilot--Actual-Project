@echo off
REM Kubernetes Dashboard Control Script for Windows

setlocal enabledelayedexpansion

set DASHBOARD_NS=kubernetes-dashboard
set DASHBOARD_VERSION=7.0.0

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

if "%1%"=="deploy" (
    call :deploy_dashboard
) else if "%1%"=="open" (
    call :open_dashboard
) else if "%1%"=="status" (
    call :check_status
) else if "%1%"=="token" (
    call :get_token
) else if "%1%"=="remove" (
    call :remove_dashboard
) else if "%1%"=="help" (
    call :show_help
) else (
    echo Unknown command: %1%
    call :show_help
    exit /b 1
)

exit /b 0

:deploy_dashboard
echo %BLUE%Deploying Kubernetes Dashboard%NC%
echo %YELLOW%Creating namespace...%NC%
kubectl create namespace %DASHBOARD_NS% --dry-run=client -o yaml ^| kubectl apply -f -
echo %YELLOW%Deploying dashboard v%DASHBOARD_VERSION%...%NC%
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v%DASHBOARD_VERSION%/aio/deploy/recommended.yaml
echo %YELLOW%Creating admin user...%NC%
kubectl create serviceaccount admin-user -n %DASHBOARD_NS% --dry-run=client -o yaml ^| kubectl apply -f -
kubectl create clusterrolebinding admin-user --clusterrole=cluster-admin --serviceaccount=%DASHBOARD_NS%:admin-user --dry-run=client -o yaml ^| kubectl apply -f -
echo %YELLOW%Waiting for dashboard...%NC%
timeout /t 30 /nobreak
echo %GREEN%Dashboard deployed successfully%NC%
call :check_status
exit /b 0

:open_dashboard
echo %BLUE%Opening Kubernetes Dashboard%NC%
call :deploy_dashboard
echo %YELLOW%Starting port-forward...%NC%
echo %BLUE%Dashboard available at: https://localhost:8443%NC%
echo %YELLOW%Getting access token...%NC%
call :get_token
echo %YELLOW%Starting proxy in new window...%NC%
start cmd /k kubectl port-forward -n %DASHBOARD_NS% svc/kubernetes-dashboard 8443:443
timeout /t 3 /nobreak
start https://localhost:8443
exit /b 0

:check_status
echo %BLUE%Dashboard Status%NC%
echo.
echo %BLUE%Pods:%NC%
kubectl get pods -n %DASHBOARD_NS%
echo.
echo %BLUE%Services:%NC%
kubectl get svc -n %DASHBOARD_NS%
exit /b 0

:get_token
echo %BLUE%Dashboard Access Token%NC%
echo.
echo %YELLOW%Admin User Token:%NC%
for /f "tokens=*" %%i in ('kubectl -n %DASHBOARD_NS% create token admin-user --duration=24h 2^>nul') do (
    echo %%i
)
echo.
echo %BLUE%Copy this token and use it to login at: https://localhost:8443%NC%
exit /b 0

:remove_dashboard
echo %BLUE%Removing Kubernetes Dashboard%NC%
echo %YELLOW%Deleting namespace...%NC%
kubectl delete namespace %DASHBOARD_NS% --ignore-not-found=true
echo %GREEN%Dashboard removed%NC%
exit /b 0

:show_help
echo.
echo %BLUE%Kubernetes Dashboard Control Script%NC%
echo.
echo Usage: k8s-dashboard.bat ^<command^>
echo.
echo Commands:
echo   deploy      Deploy Kubernetes Dashboard
echo   open        Deploy and open in browser
echo   status      Show dashboard status
echo   token       Get access token
echo   remove      Remove dashboard
echo   help        Show this help message
echo.
echo Examples:
echo   k8s-dashboard.bat deploy
echo   k8s-dashboard.bat open
echo   k8s-dashboard.bat token
echo.
exit /b 0
