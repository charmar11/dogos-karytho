import { ref, get } from 'firebase/database';
import { db } from '../firebase/config';

/**
 * TelegramService
 * Redirects notifications to the standalone Bot Server.
 */
class TelegramService {
  constructor() {
    this.serverUrl = import.meta.env.VITE_BOT_SERVER_URL || 'http://localhost:3000';
    this.notifySecret = import.meta.env.VITE_NOTIFY_SECRET || 'dogos_karytho_2024_secret';
  }

  /**
   * Fetches the current branch ID from localStorage.
   */
  getBranchId() {
    return localStorage.getItem('current_sucursal_id') || 'default';
  }

  /**
   * Generic method to send a notification to the Bot Server.
   */
  async notify(type, sucursal_id, message) {
    try {
      const response = await fetch(`${this.serverUrl}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: this.notifySecret,
          type,
          sucursal_id,
          message
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to notify Bot Server:', error);
      return false;
    }
  }

  /**
   * Alert: First sale of the day.
   */
  async notifyFirstSale(branchName) {
    const message = `🚀 <b>¡PRIMERA VENTA!</b>\nLa sucursal <b>${branchName.toUpperCase()}</b> ha registrado su primera venta. ¡Puesto abierto y operando! ✅`;
    return this.notify('first_sale', this.getBranchId(), message);
  }

  /**
   * Alert: Goal threshold (50%).
   */
  async notifyGoalThreshold(branchName, pct) {
    const message = `🎯 <b>¡META AL ${pct}%!</b>\nLa sucursal <b>${branchName.toUpperCase()}</b> ya llegó a la mitad de su meta diaria. 🔥`;
    return this.notify('goal_threshold', this.getBranchId(), message);
  }

  /**
   * Alert: Corte de Caja.
   */
  async sendCorteReport(corteData) {
    const { branchName, person, totalBruto, gastosTotal, neto } = corteData;
    const message = `
📊 <b>REPORTE DE CORTE</b>
━━━━━━━━━━━━━━━━━━
📍 <b>Sucursal:</b> ${branchName.toUpperCase()}
👤 <b>Responsable:</b> ${person}
💰 <b>Venta:</b> <code>$${totalBruto.toLocaleString()}</code>
💸 <b>Gastos:</b> <code>$${gastosTotal.toLocaleString()}</code>
━━━━━━━━━━━━━━━━━━
💵 <b>Efectivo: $${neto.toLocaleString()}</b>
━━━━━━━━━━━━━━━━━━
✅ <i>Corte enviado exitosamente.</i>
    `.trim();

    return this.notify('corte', this.getBranchId(), message);
  }

  /**
   * Generic Alert.
   */
  async sendAlert(title, details) {
    const message = `⚠️ <b>ALERTA: ${title}</b>\n${details}`;
    return this.notify('alert', this.getBranchId(), message);
  }
}

const telegramService = new TelegramService();
export default telegramService;
ecio:* $${price.toFixed(2)}
${products ? `🍔 *Productos:* ${products}` : ''}
${notes ? `📝 *Notas:* ${notes}` : ''}
━━━━━━━━━━━━━━━━━━━━
✅ *Evento guardado exitosamente*
    `.trim();

    return this.sendMessage(message);
  }
}

const telegramService = new TelegramService();
export default telegramService;
