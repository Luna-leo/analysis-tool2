// Mock for DuckDB in client-side builds
class Database {
  constructor() {
    throw new Error('DuckDB cannot be used on the client side');
  }
}

module.exports = { Database };