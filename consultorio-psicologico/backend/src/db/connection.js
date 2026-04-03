const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database.db');

let _db;
function getDb() {
  if (!_db) {
    _db = new sqlite3.Database(DB_PATH);
    _db.run('PRAGMA journal_mode = WAL');
    _db.run('PRAGMA foreign_keys = ON');
  }
  return _db;
}

function run(sql, params) {
  params = params || [];
  return new Promise(function(resolve, reject) {
    getDb().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params) {
  params = params || [];
  return new Promise(function(resolve, reject) {
    getDb().get(sql, params, function(err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params) {
  params = params || [];
  return new Promise(function(resolve, reject) {
    getDb().all(sql, params, function(err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise(function(resolve, reject) {
    getDb().exec(sql, function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { run, get, all, exec };
