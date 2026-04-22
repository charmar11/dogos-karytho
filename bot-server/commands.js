const handleStart = async (ctx, db) => {
  const chatId = ctx.chat.id.toString();
  ctx.reply(`👋 ¡Hola! Tu Chat ID es: <code>${chatId}</code>\n\nSi no puedes usar los comandos, asegúrate de que este ID esté en la lista blanca de Firebase.`, { parse_mode: 'HTML' });
};

const handleVentas = async (ctx, db) => {
  const chatId = ctx.chat.id.toString();
  try {
    const mappingsSnap = await db.ref('config/telegram/mappings').once('value');
    const branchId = mappingsSnap.val()?.[chatId];

    if (!branchId) return ctx.reply('❌ No tienes una sucursal asignada.');

    const today = new Date().toISOString().split('T')[0];
    const branchSnap = await db.ref(`sucursales/${branchId}`).once('value');
    const branch = branchSnap.val();

    if (!branch) return ctx.reply('❌ No se encontró información de la sucursal.');

    const sales = Object.values(branch.sales || {}).filter(s => s.timestamp?.startsWith(today));
    const totalVentas = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const count = sales.length;

    let msg = `📊 <b>Resumen de Ventas - ${branch.config?.name || branchId}</b>\n`;
    msg += `📅 Fecha: ${today}\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `💰 Total: <b>$${totalVentas.toLocaleString()}</b>\n`;
    msg += `🛒 Tickets: <b>${count}</b>\n`;
    msg += `🎟️ Promedio: <b>$${count > 0 ? (totalVentas / count).toFixed(2) : 0}</b>\n`;
    
    ctx.reply(msg, { parse_mode: 'HTML' });
  } catch (err) {
    console.error(err);
    ctx.reply('❌ Error al obtener ventas.');
  }
};

const handleGastos = async (ctx, db) => {
  const chatId = ctx.chat.id.toString();
  try {
    const mappingsSnap = await db.ref('config/telegram/mappings').once('value');
    const branchId = mappingsSnap.val()?.[chatId];

    const today = new Date().toISOString().split('T')[0];
    const branchSnap = await db.ref(`sucursales/${branchId}/gastos`).once('value');
    const gastosData = branchSnap.val() || {};
    
    const gastos = Object.values(gastosData).filter(g => g.date?.startsWith(today));
    const total = gastos.reduce((sum, g) => sum + (g.amount || 0), 0);

    let msg = `💸 <b>Gastos de Hoy</b>\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    if (gastos.length === 0) {
      msg += `<i>No hay gastos registrados.</i>\n`;
    } else {
      gastos.forEach(g => {
        msg += `• ${g.desc || 'Gasto'}: <b>$${g.amount}</b>\n`;
      });
      msg += `━━━━━━━━━━━━━━━\n`;
      msg += `💰 Total Gastos: <b>$${total}</b>`;
    }
    
    ctx.reply(msg, { parse_mode: 'HTML' });
  } catch (err) {
    ctx.reply('❌ Error al obtener gastos.');
  }
};

const handleCorte = async (ctx, db) => {
  const chatId = ctx.chat.id.toString();
  try {
    const mappingsSnap = await db.ref('config/telegram/mappings').once('value');
    const branchId = mappingsSnap.val()?.[chatId];

    const branchSnap = await db.ref(`sucursales/${branchId}`).once('value');
    const branch = branchSnap.val();

    // Lógica simplificada de corte basada en ventas vs gastos
    const today = new Date().toISOString().split('T')[0];
    const sales = Object.values(branch.sales || {}).filter(s => s.timestamp?.startsWith(today));
    const gastos = Object.values(branch.gastos || {}).filter(g => g.date?.startsWith(today));
    
    const totalBruto = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalGastos = gastos.reduce((sum, g) => sum + (g.amount || 0), 0);
    const neto = totalBruto - totalGastos;

    let msg = `✂️ <b>Estado de Caja (Estimado)</b>\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `➕ Ventas: <code>$${totalBruto}</code>\n`;
    msg += `➖ Gastos: <code>$${totalGastos}</code>\n`;
    msg += `💰 <b>Efectivo Ideal: $${neto}</b>\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `⚠️ <i>Este es un cálculo en tiempo real, no un cierre fiscal.</i>`;

    ctx.reply(msg, { parse_mode: 'HTML' });
  } catch (err) {
    ctx.reply('❌ Error al calcular corte.');
  }
};

module.exports = { handleVentas, handleGastos, handleCorte, handleStart };
