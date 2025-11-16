const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const pino = require("pino")
const chalk = require("chalk")
const readline = require("readline")
require("./settings") // load settings.js
const VanzHandler = require("./Vanz")

// deCode
const { jidDecode } = require("@whiskeysockets/baileys");

// Fix JID error
function safeDecodeJid(jid) {
    if (!jid) return jid;
    try {
        const decoded = jidDecode(jid);
        if (decoded && decoded.user) return decoded.user + "@s.whatsapp.net";
        return jid;
    } catch {
        return jid;
    }
}

// true = pairing code, false = QR
const usePairingCode = true

async function question(prompt) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    return new Promise(resolve => rl.question(prompt, ans => {
        rl.close()
        resolve(ans)
    }))
}
//koneksi WhatsApp 
async function connectToWhatsApp() {
    console.log(chalk.blue("🚀 Menghubungkan bot ke WhatsApp..."))

    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState("./VanzSesi")

    const vanz = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: !usePairingCode,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        version
    })

    if (usePairingCode && !vanz.authState.creds.registered) {
        const phoneNumber = await question(chalk.green("♣ Masukan Nomor Dengan Awalan 62xxx\n> "))
        const code = await vanz.requestPairingCode(phoneNumber.trim())
        console.log(chalk.cyan(`📩 Pairing Code: ${code}`))
    }

    vanz.ev.on("creds.update", saveCreds)

    vanz.ev.on("connection.update", ({ connection }) => {
        if (connection === "close") {
            console.log(chalk.red("❌ Koneksi terputus, mencoba ulang..."))
            connectToWhatsApp()
        } else if (connection === "open") {
            console.log(chalk.green("✅ Bot Berhasil Terhubung ke WhatsApp!"))
        }
    })

    // Create queue for anti-limit
    const queue = []

    vanz.sendWithQueue = async (msg) => {
        queue.push(msg)
        if (queue.length === 1) await processQueue()
    }

    async function processQueue() {
        if (!queue.length) return
        const msg = queue[0]
        try {
            await vanz.sendMessage(msg.jid, msg.message, msg.options)
        } catch {}
        queue.shift()
        if (queue.length > 0) await processQueue()
    }

    vanz.ev.on("messages.upsert", async (m) => {
        try {
            await VanzHandler(vanz, m, vanz)
        } catch (err) {
            console.log(chalk.red("⚠️ Error di file Vanz.js:"), err)
        }
    })
}


process.on("uncaughtException", async (err) => {
    console.log("❌ ERROR:", err);

    try {
        await vanz.sendMessage(config.owner[0] + "@s.whatsapp.net", {
            text: `⚠️ *Halo owner!*  
Ada error di script:

\`\`\`
${err.message}
\`\`\``
        });
    } catch {}
});

process.on("unhandledRejection", async (err) => {
    console.log("❌ PROMISE ERROR:", err);

    try {
        await vanz.sendMessage(config.owner[0] + "@s.whatsapp.net", {
            text: `⚠️ *Halo owner!*  
Ada error promise:

\`\`\`
${err}
\`\`\``
        });
    } catch {}
});

connectToWhatsApp()