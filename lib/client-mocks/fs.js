// Mock for fs module in client-side builds
module.exports = {
  promises: {
    mkdir: () => Promise.reject(new Error('fs not available on client')),
    readdir: () => Promise.reject(new Error('fs not available on client')),
    access: () => Promise.reject(new Error('fs not available on client')),
  }
};