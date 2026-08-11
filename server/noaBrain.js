/**
 * ============================================================================
 * 🧠 NOA AI ENGINE - MASTER BRAIN MODULE (server/noaBrain.js)
 * ============================================================================
 * מוח תפעולי וניהול מענה אינטליגנטי בזמן אמת ל-WhatsApp / SabanOS
 * ח. סבן חומרי בניין 1994 בע"מ
 * ============================================================================
 */

let parentModule;
try {
  parentModule = require('../noaBrain.js');
} catch (e) {
  // Fallback
}

if (parentModule && typeof parentModule.processInboundMessage === 'function') {
  module.exports = parentModule;
  module.exports.default = parentModule;
  module.exports.processInboundMessage = parentModule.processInboundMessage;
} else {
  module.exports = require('../noaBrain.js');
}
