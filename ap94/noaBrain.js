/**
 * ============================================================================
 * 🧠 NOA AI ENGINE - MASTER BRAIN MODULE (ap94/noaBrain.js)
 * ============================================================================
 * מוח תפעולי וניהול מענה אינטליגנטי בזמן אמת ל-WhatsApp / SabanOS
 * ח. סבן חומרי בניין 1994 בע"מ
 * ============================================================================
 */

let parentModule;
try {
  parentModule = require('../noaBrain.js');
} catch (e) {
  // Fallback if imported directly
}

if (parentModule && typeof parentModule.processInboundMessage === 'function') {
  module.exports = parentModule;
  module.exports.default = parentModule;
  module.exports.processInboundMessage = parentModule.processInboundMessage;
} else {
  // Standalone definition fallback
  const CONFIG = {
    SYSTEM_NAME: "SabanOS & Noa AI Engine",
    BUSINESS_NAME: 'ח. סבן חומרי בניין 1994 בע"מ',
    AI_NAME: "נועה AI",
    DEFAULT_PHONE: "972508861080",
  };

  function processInboundMessage(userMessage, options = {}) {
    const msgText = (userMessage || "").toString().trim();
    const lowerMsg = msgText.toLowerCase();

    const simpleGreetings = ["היי", "שלום", "אהלן", "בוקר טוב", "ערב טוב", "צהריים טובים", "מה שלומך", "היוש"];
    const isExactGreeting = simpleGreetings.some(g => lowerMsg === g || lowerMsg === g + "!" || lowerMsg === g + " נועה");

    if (isExactGreeting) {
      return {
        success: true,
        text: "שלום! 👋 במה אוכל לעזור לך היום בח. סבן?",
        source: "proportionality_rule",
        isSimpleGreeting: true
      };
    }

    return {
      success: true,
      text: "הודעתך התקבלה והועברה לצוות הלוגיסטיקה של ח. סבן. נחזור אליך בהקדם!",
      source: "smart_fallback"
    };
  }

  const noaBrainModule = {
    getSystemConfig: () => CONFIG,
    processInboundMessage
  };

  module.exports = noaBrainModule;
  module.exports.default = noaBrainModule;
  module.exports.processInboundMessage = processInboundMessage;
}
