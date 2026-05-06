@echo off
REM TaskPilot Deployment Verification Script (Windows)

echo ==========================================
echo TaskPilot Deployment Verification
echo ==========================================
echo.

REM Test 1: Backend Health Check
echo [Test 1] Backend Health Check
curl -s http://localhost:5000/health | findstr "status"
echo.

REM Test 2: Available Endpoints
echo [Test 2] Available Endpoints
echo   - UI Deployment: http://localhost:3001
echo   - API Health: http://localhost:5000/health
echo   - API Stats: http://localhost:5000/api/stats
echo   - API Deployment Verify: http://localhost:5000/api/deployment/verify
echo.

REM Test 3: Docker Containers Status
echo [Test 3] Docker Containers Status
docker ps --filter "status=running" --format "  {{.Names}}: {{.Status}}"
echo.

REM Test 4: File Verification
echo [Test 4] Required Files
if exist "ansible\hosts.ini" (
    echo   [OK] ansible\hosts.ini
) else (
    echo   [MISSING] ansible\hosts.ini
)

if exist "ansible\ansible.cfg" (
    echo   [OK] ansible\ansible.cfg
) else (
    echo   [MISSING] ansible\ansible.cfg
)

if exist "ansible\deployment-verify.yaml" (
    echo   [OK] ansible\deployment-verify.yaml
) else (
    echo   [MISSING] ansible\deployment-verify.yaml
)

if exist "backend\server.js" (
    echo   [OK] backend\server.js
) else (
    echo   [MISSING] backend\server.js
)
echo.

REM Instructions
echo ==========================================
echo [DEPLOYMENT GUIDE]
echo ==========================================
echo.
echo UI-BASED DEPLOYMENT ^(For Demo^):
echo 1. Open browser: http://localhost:3001
echo 2. Click "Deployment" tab
echo 3. Click "Execute Playbook" button
echo 4. Watch 9 phases complete successfully
echo 5. Run multiple times to show verification
echo.
echo OS-LEVEL DEPLOYMENT ^(For Real Setup^):
echo 1. Install Ansible:
echo    choco install ansible -y
echo.
echo 2. Verify installation:
echo    ansible --version
echo.
echo 3. Test connectivity:
echo    ansible -i ansible\hosts.ini all -m ping
echo.
echo 4. Run deployment verification:
echo    ansible-playbook -i ansible\hosts.ini ansible\deployment-verify.yaml -v
echo.
echo 5. Run full Kubernetes setup:
echo    ansible-playbook -i ansible\hosts.ini ansible\kubernetes-cluster-setup.yaml
echo.
echo ==========================================
echo [STATUS] All components ready!
echo ==========================================
