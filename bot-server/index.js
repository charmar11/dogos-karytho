require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const admin = require('firebase-admin');
const { handleVentas, handleGastos, handleCorte, handleStart } = require('./commands');

// Initialize Firebase
let serviceAccount;
try {
  let saData = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saData) {
    saData = saData.trim();
    // Si no empieza con '{', asumimos que es Base64 (método a prueba de errores)
    if (!saData.startsWith('{')) {
      console.log('📦 Detectado formato Base64, decodificando...');
      saData = Buffer.from(saData, 'base64').toString('utf8');
    }
    const saObj = JSON.parse(saData);
    console.log('✅ JSON parseado correctamente.');

    // Extraer campos con sanitización agresiva
    const projectId = saObj.project_id || saObj.projectId;
    const clientEmail = (saObj.client_email || saObj.clientEmail || '').trim();
    let privateKey = saObj.private_key || saObj.privateKey || '';

    if (privateKey) {
      console.log('🔑 Sanatizando Private Key (RSA Standard)...');
      // Extraer solo el contenido base64
      const core = privateKey
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\\n/g, '')
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .replace(/\s+/g, '');
      
      // Re-formatear con saltos exactos (64 chars)
      const matches = core.match(/.{1,64}/g);
      privateKey = `-----BEGIN PRIVATE KEY-----\n${matches.join('\n')}\n-----END PRIVATE KEY-----\n`;
    }

    serviceAccount = {
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey
    };
    
    console.log('🚀 Configuración de credenciales lista.');
    console.log('📌 Project:', serviceAccount.projectId);
    console.log('📌 Email:', serviceAccount.clientEmail);
  } else {
    serviceAccount = require('./service-account.json');
  }
} catch (err) {
  console.error('❌ Error fatal al cargar la Service Account:', err.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

// Initialize Telegram Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Global Middleware for Authorization
bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id.toString();
  if (!chatId) return;

  const whitelistSnap = await db.ref('config/telegram/whitelist').once('value');
  const whitelist = whitelistSnap.val() || [];

  if (whitelist.includes(chatId) || ctx.message?.text === '/start') {
    return next();
  }
  
  console.log(`🚫 Bloqueado acceso de: ${chatId}`);
  ctx.reply('⚠️ No estás autorizado para usar este bot.');
});

// Bot Commands
bot.start((ctx) => handleStart(ctx, db));
bot.command('ventas', (ctx) => handleVentas(ctx, db));
bot.command('gastos', (ctx) => handleGastos(ctx, db));
bot.command('corte', (ctx) => handleCorte(ctx, db));
bot.help((ctx) => ctx.reply('Comandos disponibles:\n/ventas - Resumen de hoy\n/gastos - Gastos registrados\n/corte - Estado del corte actual'));

// HTTP Server for Notifications
const app = express();
app.use(express.json());

app.post('/notify', async (req, res) => {
  const { secret, type, message, sucursalId } = req.body;

  if (secret !== process.env.NOTIFY_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Find chat_id for this sucursal
    const mappingsSnap = await db.ref('config/telegram/mappings').once('value');
    const mappings = mappingsSnap.val() || {};
    
    // Find all chatIds mapped to this sucursalId
    const targetChatIds = Object.keys(mappings).filter(id => mappings[id] === sucursalId);

    if (targetChatIds.length === 0) {
      console.log(`⚠️ No mapping found for sucursal: ${sucursalId}`);
      return res.status(404).json({ error: 'No mapping found' });
    }

    for (const chatId of targetChatIds) {
      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📡 Notifier server running on port ${PORT}`);
  bot.launch().then(() => console.log('🤖 Bot results: LIVE'));
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
