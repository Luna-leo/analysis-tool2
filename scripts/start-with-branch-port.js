#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');

// Get current git branch
function getCurrentBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    return branch;
  } catch (error) {
    console.error('Error getting git branch:', error.message);
    return null;
  }
}

// Determine port based on branch
function getPortForBranch(branch) {
  switch (branch) {
    case 'main':
      return 3000;
    case 'dev':
      return 3001;
    case 'feature/enhanced-upload-functionality':
      return 3003;
    default:
      // Default to 3000 for other branches
      return 3000;
  }
}

// Main execution
const branch = getCurrentBranch();
if (!branch) {
  console.warn('Could not determine git branch, using default port 3000');
}

const port = getPortForBranch(branch);
console.log(`🚀 Starting production server on branch '${branch}' with port ${port}`);

// Set up environment variables
const env = { ...process.env, PORT: port.toString() };

// Spawn next start process
const nextStart = spawn('npx', ['next', 'start'], {
  env,
  stdio: 'inherit',
  shell: true
});

// Handle process termination
nextStart.on('close', (code) => {
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  nextStart.kill('SIGINT');
});

process.on('SIGTERM', () => {
  nextStart.kill('SIGTERM');
});