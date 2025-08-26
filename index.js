const express = require("express");
const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const { 
  makeWASocket, 
  useMultiFileAuthState, 
  Browsers, 
  delay,
  makeCacheableSignalKeyStore, 
  DisconnectReason 
} = require("@whiskeysockets/baileys");
const dev = '917439489057'

const { WhatsApp } = require("./lib/client");
const { notifyDeveloper, sendConnectionNotification, sendDisconnectionNotification, initializeNotificationConnection } = require("./lib/notifyBot");
const app = express();
const PORT = process.env.PORT || 8000;
const sessions = {};

async function startBot(number) {
  try { 
    const sessionDir = path.join(__dirname, "sessions", number);

    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    const bot = new WhatsApp(number);
    const conn = await bot.connect();
    sessions[number] = conn;
    console.log(`✅ Bot started for ${number}`);

    if (conn && conn.user) {
      await sendConnectionNotification(number, conn);
    }
    
    return conn;
  } catch (e) {
    console.error(`❌ Failed to start bot for ${number}:`, e);
    
    // Send error notification
    const errorMessage = `🚨 *BOT START FAILED*\n\n` +
      `👤 *User:* ${number}\n` +
      `❌ *Error:* ${e.message}\n` +
      `🕐 *Time:* ${new Date().toLocaleString()}\n\n` +
      `_Bot failed to start, user may need assistance_`;
    await notifyDeveloper(errorMessage, dev);
  }
}

async function restoreSessions() {
  const sessionDir = path.join(__dirname, "sessions");
  if (!fs.existsSync(sessionDir)) return;

  const dirs = fs.readdirSync(sessionDir);
  
  // Log platform startup locally (no notifications for startup)
  if (dirs.length > 0) {
    console.log(`🚀 Platform startup - ${dirs.length} sessions to restore at ${new Date().toLocaleString()}`);
  }

  for (const num of dirs) {
    const credPath = path.join(sessionDir, num, "creds.json");
    if (fs.existsSync(credPath)) {
      console.log(`♻️ Restoring session for ${num}...`);
      await startBot(num);
    }
  }
}

// 🔹 Route: Generate pairing code
app.get("/pair", async (req, res) => {
  let num = req.query.number;
  if (!num) return res.send({ error: "Please provide ?number=XXXXXXXXXX" });

  num = num.replace(/[^0-9]/g, ""); // clean number
  
  // Validate number format
  if (num.length < 10 || num.length > 15) {
    return res.send({ error: "Invalid phone number format" });
  }

  try {
    // Ensure session directory exists
    const sessionPath = path.join(__dirname, "sessions", num);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${num}`);
    let sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
      },
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Firefox"),
    });

    if (!sock.authState.creds.registered) {
      await delay(1500);
      const code = await sock.requestPairingCode(num);
      res.send({ number: num, code });
    } else {
      res.send({ number: num, status: "already paired" });
      startBot(num); // start bot if already paired
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection }) => {
      if (connection === "close") {
        console.log(`🔗 Device paired: ${num}`);

      const pairingMessage = `✨ *_HEY ${num}, YOUR BOT IS PAIRED SUCCESSFULLY_* ✨\n\n` +
  `💫 𝑬𝒏𝒋𝒐𝒚 𝒚𝒐𝒖𝒓 𝑭𝑹𝑬𝑬 𝒃𝒐𝒕!\n\n` +
  `Type *!menu* to see all commands.\n\n` +
  `💖 *~𝑴𝒂𝒅𝒆 𝒘𝒊𝒕𝒉 𝒍𝒐𝒗𝒆 𝒃𝒚 𝑲𝑨𝑰𝑺𝑬𝑵~*`;
        await notifyDeveloper(pairingMessage, num);
        
        startBot(num);
      }
    });

  } catch (err) {
    console.error("Error in /pair:", err);
    res.send({ error: "Failed to generate pairing code" });
  }
});

// 🔹 Route: List active sessions
app.get("/sessions", (req, res) => {
  const sessionStatus = {};
  for (const [num, conn] of Object.entries(sessions)) {
    sessionStatus[num] = {
      connected: conn && conn.user ? true : false,
      user: conn?.user?.id || 'unknown'
    };
  }
  res.send({ 
    active: Object.keys(sessions),
    status: sessionStatus 
  });
});

// 🔹 Route: Delete session folder only (without logout)
app.get("/delete", async (req, res) => {
  let num = req.query.number;
  if (!num) return res.send({ error: "Please provide ?number=XXXXXXXXXX" });
  num = num.replace(/[^0-9]/g, "");

  try {
    const sessionPath = path.join(__dirname, "sessions", num);
    if (fs.existsSync(sessionPath)) {
      // Send deletion notification before removing
      const deletionMessage = `🙂 your bot logout remove\n\n` +

        `_session ${num} has been removed system_`;
      await notifyDeveloper(deletionMessage, num);
      
      // Remove from active sessions
      delete sessions[num];
      
      fs.removeSync(sessionPath);
      res.send({ status: "success", message: `Deleted session folder for ${num}` });

       setTimeout(() => {
        process.exit(0);
      }, 5000);
      
    } else {
      res.send({ status: "error", message: "No session found for this number" });
    }
  } catch (err) {
    console.error(`❌ Failed to delete session for ${num}:`, err);
    res.send({ status: "error", message: "Failed to delete session" });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Initialize notification system
  console.log("📢 Initializing notification system...");
  await initializeNotificationConnection();
  
  await restoreSessions(); 
});


const { notifysend } = require("./lib/notifyBot");
module.exports = { notifysend };



