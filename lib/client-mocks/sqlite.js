// Mock for better-sqlite3 in client-side builds
class Database {
  constructor() {
    throw new Error('SQLite cannot be used on the client side');
  }
}

module.exports = Database;
module.exports.default = Database;