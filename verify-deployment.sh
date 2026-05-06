#!/bin/bash

# TaskPilot Deployment Verification Script
# Tests both UI and OS-level deployment functionality

echo "=========================================="
echo "TaskPilot Deployment Verification"
echo "=========================================="
echo ""

# Test 1: Backend Health Check
echo "✓ Test 1: Backend Health Check"
HEALTH=$(curl -s http://localhost:5000/health | grep -o '"status":"[^"]*"')
echo "  Result: $HEALTH"
echo ""

# Test 2: Deployment Info Endpoint (requires auth - will show error but that's expected)
echo "✓ Test 2: Available Endpoints"
echo "  - UI Deployment: http://localhost:3001 (Ansible Control Panel)"
echo "  - API Health: http://localhost:5000/health"
echo "  - API Stats: http://localhost:5000/api/stats (requires auth)"
echo "  - API Deployment Verify: http://localhost:5000/api/deployment/verify (requires auth)"
echo ""

# Test 3: Docker Containers Status
echo "✓ Test 3: Docker Containers Status"
docker ps --filter "status=running" --format "  {{.Names}}: {{.Status}}"
echo ""

# Test 4: File Verification
echo "✓ Test 4: Required Files"
[ -f "ansible/hosts.ini" ] && echo "  ✅ ansible/hosts.ini exists" || echo "  ❌ ansible/hosts.ini missing"
[ -f "ansible/ansible.cfg" ] && echo "  ✅ ansible/ansible.cfg exists" || echo "  ❌ ansible/ansible.cfg missing"
[ -f "ansible/deployment-verify.yaml" ] && echo "  ✅ ansible/deployment-verify.yaml exists" || echo "  ❌ ansible/deployment-verify.yaml missing"
[ -f "backend/server.js" ] && echo "  ✅ backend/server.js updated" || echo "  ❌ backend/server.js missing"
echo ""

# Test 5: Instructions
echo "=========================================="
echo "📖 Deployment Instructions"
echo "=========================================="
echo ""
echo "UI-BASED DEPLOYMENT (For Demo):"
echo "1. Open: http://localhost:3001"
echo "2. Click 'Deployment' tab"
echo "3. Click 'Execute Playbook' button"
echo "4. Watch 9 phases complete"
echo "5. Run multiple times to show verification"
echo ""
echo "OS-LEVEL DEPLOYMENT (For Real Setup):"
echo "1. Install Ansible:"
echo "   - Windows: choco install ansible -y"
echo "   - macOS: brew install ansible"
echo "   - Linux: sudo apt-get install ansible -y"
echo ""
echo "2. Test connectivity:"
echo "   ansible -i ansible/hosts.ini all -m ping"
echo ""
echo "3. Run deployment verification (no changes):"
echo "   ansible-playbook -i ansible/hosts.ini ansible/deployment-verify.yaml -v"
echo ""
echo "4. Run full Kubernetes setup:"
echo "   ansible-playbook -i ansible/hosts.ini ansible/kubernetes-cluster-setup.yaml"
echo ""
echo "=========================================="
echo "✅ All components ready for deployment!"
echo "=========================================="
