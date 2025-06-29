#!/usr/bin/env node

// Test script to verify port assignment based on branch
const { execSync } = require('child_process');

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
      return 3000;
  }
}

// Test the configuration
const branch = getCurrentBranch();
const port = getPortForBranch(branch);

console.log('=== Branch-based Port Configuration Test ===');
console.log(`Current branch: ${branch}`);
console.log(`Assigned port: ${port}`);
console.log('');
console.log('Branch -> Port mapping:');
console.log('  main                                      -> 3000');
console.log('  dev                                       -> 3001');
console.log('  feature/enhanced-upload-functionality     -> 3003');
console.log('  other                                     -> 3000 (default)');