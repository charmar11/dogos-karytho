const getTodayLocal = () => {
  // Ajuste para Culiacán (GMT-7)
  const options = { timeZone: 'America/Mazatlan', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('fr-CA', options); // fr-CA gives YYYY-MM-DD
  return formatter.format(new Date());
};

const getAssignedBranches = async (chatId, db) => {
  const mappingsSnap = await db.ref('config/telegram/mappings').once('value');
  const mapping = mappingsSnap.val()?.[chatId];
  if (!mapping) return [];
  
  if (mapping === 'all') {
    const sucursalesSnap = await db.ref('sucursales').once('value');
    return Object.keys(sucursalesSnap.val() || {});
  }
  
  return Array.isArray(mapping) ? mapping : [mapping];
};

const handleStart = async (ctx, db) => {
  const chatId = ctx.chat.id.toString();
  ctx.reply(`👋 ¡Hola! Tu Chat ID es: <code>${chatId}</code>\n\nSi eres administrador, asegúrate de estar configurado para ver todas las sucursales.`, { parse_mode: 'HTML' });
};

const handleVentas = async (ctx, db) => {
  const chatId = ctx.chat.id.toString();
  try {
    const branchIds = await getAssignedBranches(chatId, db);
    if (branchIds.length === 0) return ctx.reply('❌ No tienes sucursales asignadas.');

    const today = getTodayLocal();
    let totalGlobal = 0;
    let globalCount = 0;
    let breakdown = '';

    for (const id of branchIds) {
      const snap = await db.ref(`sucursales/${id}`).once('value');
      const data = snap.val();
      if (!data) continue;

      // Soportar campo timestamp o date
      const sales = Object.values(data.sales || {}).filter(s => 
        (s.timestamp?.startsWith(today)) || (s.date === today)
      );
      
      const totalBranch = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const countBranch = sales.length;

      totalGlobal += totalBranch;
      globalCount += countBranch;
      
      const name = data.config?.name || id;
      breakdown += `• ${name}: <b>$${totalBranch.toLocaleString()}</b> (<i>${countBranch} tks</i>)\n`;
    }

    let msg = `📊 <b>Ventas Totales - Hoy</b>\n`;
    msg += `📅 Fecha: ${today}\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `💰 TOTAL GLOBAL: <b>$${totalGlobal.toLocaleString()}</b>\n`;
    msg += `🛒 Tickets Totales: <b>${globalCount}</b>\n\n`;
    msg += `<b>Desglose:</b>\n${breakdown}`;
    
    ctx.reply(msg, { parse_mode: 'HTML' });
  } catch (err) {
    console.error(err);
    ctx.reply('❌ Error al obtener ventas.');
  }
};

const handleGastos = async (ctx, db) => {
  const chatId = ctx.chat.id.toString();
  try {
    const branchIds = await getAssignedBranches(chatId, db);
    if (branchIds.length === 0) return ctx.reply('❌ No tienes sucursales asignadas.');

    const today = getTodayLocal();
    let totalGlobal = 0;
    let breakdown = '';

    for (const id of branchIds) {
      const snap = await db.ref(`sucursales/${id}`).once('value');
      const data = snap.val();
      if (!data) continue;

      // Soportar fecha/date y monto/amount
      const gastos = Object.values(data.gastos || {}).filter(g => 
        (g.fecha === today) || (g.date === today) || (g.timestamp?.startsWith(today))
      );
      
      const totalBranch = gastos.reduce((sum, g) => sum + (g.monto || g.amount || 0), 0);
      
      totalGlobal += totalBranch;

      const name = data.config?.name || id;
      breakdown += `• ${name}: <b>$${totalBranch.toLocaleString()}</b>\n`;
      
      // Detalle de gastos si hay pocos
      if (branchIds.length === 1 && gastos.length > 0) {
        gastos.forEach(g => {
          breakdown += `  - ${g.desc || 'Sin desc'}: $${(g.monto || g.amount)}\n`;
        });
      }
    }

    let msg = `💸 <b>Gastos Totales - Hoy</b>\n`;
    msg += `📅 Fecha local: ${today}\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `💰 TOTAL GASTOS: <b>$${totalGlobal.toLocaleString()}</b>\n\n`;
    msg += breakdown ? `<b>Desglose:</b>\n${breakdown}` : `<i>No se encontraron gastos en ninguna sucursal.</i>`;
    
    ctx.reply(msg, { parse_mode: 'HTML' });
  } catch (err) {
    console.error(err);
    ctx.reply('❌ Error al obtener gastos.');
  }
};

const handleCorte = async (ctx, db) => {
  const chatId = ctx.chat.id.toString();
  try {
    const branchIds = await getAssignedBranches(chatId, db);
    if (branchIds.length === 0) return ctx.reply('❌ No tienes sucursales asignadas.');

    const today = getTodayLocal();
    let msg = `✂️ <b>Corte Estimado (Red Global)</b>\n`;
    msg += `📅 Fecha: ${today}\n`;
    msg += `━━━━━━━━━━━━━━━\n\n`;

    for (const id of branchIds) {
      const snap = await db.ref(`sucursales/${id}`).once('value');
      const data = snap.val();
      if (!data) continue;

      const sales = Object.values(data.sales || {}).filter(s => 
        (s.timestamp?.startsWith(today)) || (s.date === today)
      );
      const gastos = Object.values(data.gastos || {}).filter(g => 
        (g.fecha === today) || (g.date === today) || (g.timestamp?.startsWith(today))
      );
      
      const v = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const g = gastos.reduce((sum, g) => sum + (g.monto || g.amount || 0), 0);
      const name = data.config?.name || id;

      msg += `📍 <b>${name}</b>\n`;
      msg += `  Ventas: $${v.toLocaleString()}\n`;
      msg += `  Gastos: $${g.toLocaleString()}\n`;
      msg += `  <b>Neto: $${(v - g).toLocaleString()}</b>\n\n`;
    }

    msg += `⚠️ <i>Estimación en tiempo real.</i>`;
    ctx.reply(msg, { parse_mode: 'HTML' });
  } catch (err) {
    ctx.reply('❌ Error al calcular corte.');
  }
};

module.exports = { handleVentas, handleGastos, handleCorte, handleStart };
