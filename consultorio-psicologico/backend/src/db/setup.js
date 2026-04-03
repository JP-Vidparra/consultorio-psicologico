const bcrypt = require('bcryptjs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../../database.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(function() {
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre      TEXT    NOT NULL,
      apellido    TEXT    NOT NULL DEFAULT '',
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      rol         TEXT    NOT NULL DEFAULT 'psicologo',
      activo      INTEGER NOT NULL DEFAULT 1,
      creado_en   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS pacientes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre        TEXT    NOT NULL,
      apellido      TEXT    NOT NULL,
      email         TEXT,
      telefono      TEXT,
      fecha_nac     TEXT,
      documento     TEXT,
      direccion     TEXT,
      notas         TEXT,
      activo        INTEGER NOT NULL DEFAULT 1,
      creado_por    INTEGER,
      creado_en     TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS planes (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre          TEXT    NOT NULL,
      num_sesiones    INTEGER NOT NULL,
      precio          REAL    NOT NULL,
      vigencia_dias   INTEGER NOT NULL DEFAULT 90,
      descripcion     TEXT,
      activo          INTEGER NOT NULL DEFAULT 1,
      creado_en       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS contratos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id     INTEGER NOT NULL,
      plan_id         INTEGER NOT NULL,
      profesional_id  INTEGER,
      sesiones_total  INTEGER NOT NULL,
      sesiones_usadas INTEGER NOT NULL DEFAULT 0,
      fecha_inicio    TEXT    NOT NULL DEFAULT (date('now','localtime')),
      fecha_vence     TEXT    NOT NULL,
      precio_pagado   REAL    NOT NULL,
      estado          TEXT    NOT NULL DEFAULT 'activo',
      notas           TEXT,
      creado_en       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS citas (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id     INTEGER NOT NULL,
      profesional_id  INTEGER NOT NULL,
      contrato_id     INTEGER,
      fecha           TEXT    NOT NULL,
      hora_inicio     TEXT    NOT NULL,
      hora_fin        TEXT    NOT NULL,
      estado          TEXT    NOT NULL DEFAULT 'programada',
      tipo            TEXT    NOT NULL DEFAULT 'sesion',
      notas_previas   TEXT,
      creado_en       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS notas_clinicas (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      cita_id         INTEGER,
      paciente_id     INTEGER NOT NULL,
      profesional_id  INTEGER NOT NULL,
      contenido       TEXT    NOT NULL,
      privada         INTEGER NOT NULL DEFAULT 0,
      creado_en       TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      actualizado_en  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS facturas (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      contrato_id     INTEGER NOT NULL,
      paciente_id     INTEGER NOT NULL,
      numero          TEXT    NOT NULL UNIQUE,
      monto           REAL    NOT NULL,
      estado          TEXT    NOT NULL DEFAULT 'pendiente',
      metodo_pago     TEXT,
      fecha_emision   TEXT    NOT NULL DEFAULT (date('now','localtime')),
      fecha_pago      TEXT,
      notas           TEXT,
      creado_en       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `, function(err) {
    if (err) { console.error('Error creando tablas:', err.message); return; }

    const hash = bcrypt.hashSync('Consultorio2024!', 10);
    db.run(
      "INSERT OR IGNORE INTO usuarios (nombre, apellido, email, password, rol) VALUES (?,?,?,?,?)",
      ['Administrador', '', 'admin@consultorio.com', hash, 'admin'],
      function(err) {
        if (!err && this.changes > 0) {
          console.log('\n  Usuario administrador creado:');
          console.log('  Email:      admin@consultorio.com');
          console.log('  Contrasena: Consultorio2024!\n');
        }
        console.log('Base de datos lista.');
        db.close();
      }
    );
  });
});
