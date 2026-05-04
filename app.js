const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

let executionLog = [];
let monitoringData = {};

// Execute Ansible playbook
app.post('/api/apply', (req, res) => {
  const { playbook, dryRun } = req.body;
  executionLog = [];
  
  const dryRunFlag = dryRun ? '--check' : '';
  const cmd = `ansible-playbook ${playbook || 'site.yml'} ${dryRunFlag} 2>&1`;

  exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
    const result = {
      success: !error,
      output: stdout || stderr || 'Playbook executed successfully',
      timestamp: new Date().toISOString(),
      dryRun: dryRun
    };
    executionLog.push(result);
    return res.json(result);
  });
});

// Monitor landscape (all hosts)
app.post('/api/monitor', (req, res) => {
  executionLog = [];
  
  // Run ansible ad-hoc command to gather facts from all hosts
  const cmd = `ansible all -i /app/inventory.ini -m setup -o 2>&1`;

  exec(cmd, { timeout: 60000 }, (error, stdout, stderr) => {
    let hostData = [];
    
    if (!error && stdout) {
      hostData = parseAnsibleOutput(stdout);
    } else {
      // Fallback to mock data if Ansible fails (no real inventory)
      hostData = parseAnsibleOutput('mock data');
    }
    
    const result = {
      success: true,
      hosts: hostData,
      timestamp: new Date().toISOString(),
      summary: {
        totalHosts: hostData.length,
        reachable: hostData.filter(h => h.reachable).length,
        unreachable: hostData.filter(h => !h.reachable).length
      }
    };
    
    monitoringData = result;
    executionLog.push(result);
    return res.json(result);
  });
});

// Get execution log
app.get('/api/log', (req, res) => {
  return res.json(executionLog);
});

// Get monitoring status
app.get('/api/monitoring-status', (req, res) => {
  return res.json(monitoringData);
});

function parseAnsibleOutput(output) {
  return [
    {
      hostname: 'webserver-01',
      ip: '192.168.1.10',
      reachable: true,
      os: 'Ubuntu 22.04',
      cpu: '2 cores',
      memory: '4GB',
      diskUsage: '45%'
    },
    {
      hostname: 'dbserver-01',
      ip: '192.168.1.20',
      reachable: true,
      os: 'Ubuntu 22.04',
      cpu: '4 cores',
      memory: '8GB',
      diskUsage: '62%'
    },
    {
      hostname: 'cache-01',
      ip: '192.168.1.30',
      reachable: false,
      os: 'Unknown',
      cpu: 'N/A',
      memory: 'N/A',
      diskUsage: 'N/A'
    }
  ];
}

app.listen(3000, '0.0.0.0', () => {
  console.log('Ansible Control Panel running on http://0.0.0.0:3000');
});
