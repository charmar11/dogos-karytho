const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Cargar service account
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://dogos-karytho-default-rtdb.firebaseio.com'
});

const db = admin.database();

async function init() {
  console.log('🚀 Iniciando configuración de Telegram en Firebase...');
  
  const telegramConfig = {
    mappings: {
      "8430984805": "matriz"
    },
    whitelist: [
      "8430984805"
    ]
  };

  try {
    await db.ref('config/telegram').set(telegramConfig);
    console.log('✅ Configuración guardada exitosamente.');
    console.log('Mapping: 8430984805 -> matriz');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al guardar:', error);
    process.exit(1);
  }
}

init();
