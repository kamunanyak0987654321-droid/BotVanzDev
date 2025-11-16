// Vanz.js (Final Full Version)
const fs = require("fs");
const os = require("os");
const axios = require("axios");
const settings = require("./settings");
const { addActiveChat } = require("./chatDB");
const antilink = require("./antilink.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Load data sewa
let sewaData = {};
const sewaFile = "./sewa.json";
if (fs.existsSync(sewaFile)) {
    sewaData = JSON.parse(fs.readFileSync(sewaFile));
}

// Simpan sewa
function saveSewa() {
    fs.writeFileSync(sewaFile, JSON.stringify(sewaData, null, 2));
}

// Typing / recording
async function actTyping(vanz, chatId, type = "composing", duration = 2000) {
    try {
        if (typeof vanz.sendPresenceUpdate === "function") {
            await vanz.sendPresenceUpdate(type, chatId);
            await sleep(duration);
            await vanz.sendPresenceUpdate("paused", chatId).catch(() => {});
        }
    } catch (e) {}
}

module.exports = async (vanz, m) => {
    try {
        const msg = m.messages?.[0];
        if (!msg || !msg.message) return;

        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith("@g.us");
        const pushName = msg.pushName || "Tanpa Nama";
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || "";
        if (!body.startsWith(settings.prefix)) return;

        const parts = body.slice(settings.prefix.length).trim().split(/ +/);
        const command = (parts.shift() || "").toLowerCase();
        const args = parts;
        const text = args.join(" ");

        // Owner bebas
        const isOwner = settings.ownerNumber.includes(chatId.replace("@s.whatsapp.net", ""));

        // Cek sewa untuk chat pribadi
        const now = Date.now();
        if (!isGroup && !isOwner) {
            const userSewa = sewaData[chatId];
            if (userSewa && userSewa.expired > now) {
                // Masih aktif
            } else if (command !== "sewa3k" && command !== "sewa5k") {
                return vanz.sendMessage(chatId, { text: `⚠️ Anda harus menyewa bot dulu.\nKetik .sewa3k (1 bulan = 3k) atau .sewa5k (3 bulan = 5k) untuk akses.` });
            }
        }

        // Typing + recording
        await actTyping(vanz, chatId, "composing", 800);
        await actTyping(vanz, chatId, "recording", 1200);

        switch (command) {

            // ===== SEWA =====
            case "sewa3k":
            case "sewa5k": {
                const duration = command === "sewa3k" ? 30 * 24 * 60 * 60 * 1000 : 90 * 24 * 60 * 60 * 1000;
                const harga = command === "sewa3k" ? "3k" : "5k";
                const qrUrl = command === "sewa3k" 
                    ? "https://kamunanyak0987654321-droid.github.io/Foto_bot/sewa.jpg" 
                    : "https://example.com/qr_5k.jpg";

                sewaData[chatId] = { expired: Date.now() + duration };
                saveSewa();

                await vanz.sendMessage(chatId, { 
                    image: { url: qrUrl }, 
                    caption: `💳 Sewa ${harga} berhasil.\nMasa berlaku: ${duration/(24*60*60*1000)} hari.\nKalau gagal transfer kunjungi nomor ini: +62-895-3651-56485.` 
                });
            }
            break;

            // ===== MENU / ALLMENU =====
            case "menu":
            case "allmenu": {
                const botName = settings.namebot || "Vanz Botz";
                const ownerName = settings.ownerName || "Vanz";
                const ownerNumber = settings.ownerNumber || ["62895365156485"];

                const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
                const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
                const date = new Date();
                const hari = days[date.getDay()];
                const tanggal = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
                const jam = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;

                const teksMenu = `
Hai 👋 *${pushName}*!
Saya *${botName}*, siap bantu kamu 💫

📅 *${hari}, ${tanggal}*
⏰ *${jam}*

╭───⭓ *Utama* ⭓───╮
│ ⚡ ${settings.prefix}ping
│ 🤖 ${settings.prefix}ai <teks>
│ 🤖 ${settings.prefix}deepseek <teks>
│ 🤖 ${settings.prefix}statusapi <teks>
│ 🎞️ ${settings.prefix}brat <teks>
│ 🎞️ ${settings.prefix}bratvid <teks>
│ 🎵 ${settings.prefix}play <lagu>
│ 🎬 ${settings.prefix}ytmp4 <url>
│ 🌀 ${settings.prefix}sticker
│ 🖼️ ${settings.prefix}toimg
│ 🕒 ${settings.prefix}runtime
│ 👹 ${settings.prefix}menuspam
│ 💳 ${settings.prefix}menusewa
│ 📜 ${settings.prefix}allmenu
╰───────────────────────╯

╭───⭓ *Menu Group* ⭓───╮
│ 👥 ${settings.prefix}gc
│ 🔗 ${settings.prefix}antilink on/off
│ 🎵 ${settings.prefix}play
│ 🌀 ${settings.prefix}sticker
│ 🖼️ ${settings.prefix}toimg
│ 🕒 ${settings.prefix}runtime
│ 💳 ${settings.prefix}menusewa
│ 📜 ${settings.prefix}allmenu
╰───────────────────────╯

👑 *Owner:* ${ownerName}
📞 *Nomor:* ${ownerNumber[0] ? `wa.me/${ownerNumber[0]}` : '—'}
🤖 *Bot:* ${botName}
                `.trim();

                await vanz.sendMessage(chatId, {
                    image: { url: "https://kamunanyak0987654321-droid.github.io/Foto_bot/menu.jpg" },
                    caption: teksMenu
                });
                
                // Kirim audio dari URL
                const audioUrl = "https://kamunanyak0987654321-droid.github.io/Foto_bot/menu.mp3";
                await vanz.sendMessage(chatId, {
                    audio: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    ptt: false
                });
            }
            break;
            
            // ===== AI CHAT =====
// ===== AI CHAT =====
case "ai":
case "chat":
case "deepseek": {
    if (!text) {
        return await vanz.sendMessage(chatId, { 
            text: `🤖 Gunakan: ${settings.prefix}ai <pertanyaan>\nContoh: ${settings.prefix}ai buatkan program Python` 
        });
    }

    try {
        await vanz.sendMessage(chatId, { text: "🧠 AI sedang berpikir..." });
        
        // DeepSeek API Call
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                {
                    role: "user",
                    content: text
                }
            ],
            max_tokens: 2048,
            temperature: 0.7,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${settings.deepseekApikey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        if (response.data.choices && response.data.choices[0]) {
            const aiResponse = response.data.choices[0].message.content;
            
            // Potong response jika terlalu panjang untuk WhatsApp
            const chunkSize = 4000;
            if (aiResponse.length > chunkSize) {
                await vanz.sendMessage(chatId, { text: "📝 Response panjang, mengirim dalam beberapa bagian..." });
                
                for (let i = 0; i < aiResponse.length; i += chunkSize) {
                    const chunk = aiResponse.substring(i, i + chunkSize);
                    await vanz.sendMessage(chatId, { text: chunk });
                    await sleep(1000);
                }
            } else {
                await vanz.sendMessage(chatId, { text: aiResponse });
            }
        } else {
            throw new Error("Format response tidak valid");
        }

    } catch (error) {
        console.error("AI Error:", error.response?.data || error.message);
        
        let errorMessage = "❌ Gagal memproses permintaan AI.";
        if (error.response?.status === 401) {
            errorMessage = "❌ API Key DeepSeek tidak valid. Cek settings.js";
        } else if (error.response?.status === 429) {
            errorMessage = "❌ Terlalu banyak request. Coba lagi nanti.";
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = "❌ Timeout. Coba lagi dengan pertanyaan lebih pendek.";
        }
        
        await vanz.sendMessage(chatId, { text: errorMessage });
    }
}
break;

          // Harga API DEEPSEK 
          // Tambahkan command cek saldo di Vanz.js
case "apistatus": {
    try {
        await vanz.sendMessage(chatId, { text: "🔍 Mengecek status API..." });
        
        const response = await axios.get('https://api.deepseek.com/user/balance', {
            headers: {
                'Authorization': `Bearer ${settings.deepseekApikey}`,
                'Content-Type': 'application/json'
            }
        });
        
        const balance = response.data;
        await vanz.sendMessage(chatId, { 
            text: `💰 *Status API DeepSeek*\n\nSaldo: ${balance.available || 'Tidak tersedia'}\nDigunakan: ${balance.used || 'Tidak tersedia'}\nLimit: ${balance.total_limit || 'Tidak tersedia'}`
        });
    } catch (error) {
        await vanz.sendMessage(chatId, { 
            text: `❌ Gagal cek saldo: ${error.response?.data?.error?.message || error.message}` 
        });
    }
}
break;

            //Gemini
case "gemini": {
    if (!text) {
        return await vanz.sendMessage(chatId, { 
            text: `🤖 Gunakan: ${settings.prefix}ai <pertanyaan>` 
        });
    }

    try {
        await vanz.sendMessage(chatId, { text: "🧠 AI sedang berpikir..." });
        
        // Google Gemini API (Gratis)
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${settings.geminiApiKey}`, {
            contents: [{
                parts: [{
                    text: text
                }]
            }]
        }, {
            timeout: 30000
        });

        const aiResponse = response.data.candidates[0].content.parts[0].text;
        
        // Potong response untuk WhatsApp
        const chunkSize = 4000;
        if (aiResponse.length > chunkSize) {
            await vanz.sendMessage(chatId, { text: "📝 Response panjang, mengirim dalam beberapa bagian..." });
            for (let i = 0; i < aiResponse.length; i += chunkSize) {
                const chunk = aiResponse.substring(i, i + chunkSize);
                await vanz.sendMessage(chatId, { text: chunk });
                await sleep(1000);
            }
        } else {
            await vanz.sendMessage(chatId, { text: aiResponse });
        }

    } catch (error) {
        console.error("AI Error:", error.response?.data || error.message);
        await vanz.sendMessage(chatId, { 
            text: "❌ Gagal memproses AI. Coba lagi nanti." 
        });
    }
}
break;

            // ===== MENU SEWA =====
            case "menusewa": {
                const botName = "Vanz Botz";
                const ownerName = settings.ownerName || "Vanz";
                const ownerNumber = settings.ownerNumber[0] || "";

                const teksSewa = `
📌 *Menu Sewa Bot*

Hai 👋 *${pushName}*,
Untuk menggunakan bot ini di chat pribadi, kamu perlu menyewa terlebih dahulu.

💰 *Paket Sewa:*
1️⃣ 1 Bulan - 3k (ketik .sewa3k)
2️⃣ 3 Bulan - 5k (ketik .sewa5k)

⚠️ Setelah membayar, kirim kode/QR pembayaran agar bot mendeteksi sewa kamu.

📞 *Owner:* ${ownerName}
💳 *Kode QR / Pembayaran:* wa.me/${ownerNumber}

🤖 *Bot:* ${botName}
                `.trim();

                await actTyping(vanz, chatId, "composing", 1000);
                await actTyping(vanz, chatId, "recording", 1200);
                await vanz.sendMessage(chatId, { text: teksSewa });
            }
            break;

            // ===== PING =====
            case "ping": {
                const start = Date.now();
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;

                const uptime = process.uptime();
                const uptimeText = `${Math.floor(uptime/3600)} jam ${Math.floor((uptime%3600)/60)} menit ${Math.floor(uptime%60)} detik`;

                await actTyping(vanz, chatId, "composing", 500);
                await vanz.sendMessage(chatId, { text: "💻 Menghitung ping..." });
                const latency = Date.now() - start;

                const device = m.pushName ? "Android/iOS (WhatsApp)" : "Web/PC";

                const teksPing = `
🏷️ *Status Bot*
- RAM Digunakan: ${(usedMem/1024/1024).toFixed(2)} MB / ${(totalMem/1024/1024).toFixed(2)} MB
- Kecepatan kirim: ${latency} ms
- Runtime: ${uptimeText}
- Device: ${device}
                `;
                await vanz.sendMessage(chatId, { text: teksPing });
            }
            break;

            // ===== CREATE GROUP =====
            case "gc": {
                if (!text) return await vanz.sendMessage(chatId, { text: `⚠️ Gunakan: ${settings.prefix}gc <nama grup>` });
                try {
                    await vanz.sendMessage(chatId, { text: "🔄 Membuat grup..." });

                    // Buat grup langsung
                    const group = await vanz.groupCreate(text, []);
                    
                    // Dapatkan link
                    let inviteLink = "Link tidak tersedia";
                    try {
                        const inviteCode = await vanz.groupInviteCode(group.gid);
                        inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
                    } catch (e) {
                        console.log("Tidak bisa dapatkan link:", e);
                    }

                    await vanz.sendMessage(chatId, { 
                        text: `✅ Grup "${text}" berhasil dibuat!\n\n🔗 ${inviteLink}` 
                    });

                } catch (err) {
                    await vanz.sendMessage(chatId, { 
                        text: `❌ Gagal buat grup: ${err.message}` 
                    });
                }
            }
            break;

            // ===== PLAY MUSIC =====
            case "play":
            case "lagu":
            case "musik":
            case "starla": {
                const searchQuery = args.length > 0 ? args.join(' ') : 'Surat Cinta untuk Starla';
                
                console.log(`🎵 Request lagu: ${searchQuery}`);
                
                // Kirim info lagu
                await vanz.sendMessage(chatId, {
                    image: { 
                        url: 'https://i.ytimg.com/vi/3p9L1fT3Zy4/hqdefault.jpg' 
                    },
                    caption: `🎵 *SURAT CINTA UNTUK STARLA* - Virgoun\n\n🎤 *Penyanyi:* Virgoun\n🎸 *Genre:* Pop Rock\n📀 *Album:* Surat Cinta untuk Starla\n\n🔗 *YouTube:* https://youtu.be/3p9L1fT3Zy4\n\n💫 _Lagu romantis paling iconic_`
                });
                
                // Kirim lirik lagu
                const lirik = `
📜 *LIRIK SURAT CINTA UNTUK STARLA*

Bukan maksudku menyakiti dirimu
Ku pun tak pernah menginginkan semua ini
Kutinggalkan dirimu dengan air mata
Karena aku sayang padamu

*Reff:*
Surat cinta untuk Starla
Yang pernah mencintaiku
Maafkanlah kekasihku
Ku pergi tuk selamanya

Ku tahu kau tak mengerti
Apa yang ku rasakan
Percayalah sayangku ini
Bukan akhir cerita kita
                `.trim();
                
                await vanz.sendMessage(chatId, { text: lirik });
            }
            break;

            // ===== RVO =====
            case "rvo": {
                if (!m.quoted) return await vanz.sendMessage(chatId, { text: "⚠️ Reply ke pesan View Once dulu!" });
                
                const quoted = m.quoted.message;
                if (!quoted) return await vanz.sendMessage(chatId, { text: "❌ Pesan tidak valid!" });

                // Cek ViewOnce
                const viewOnce = quoted.viewOnceMessage || quoted.viewOnceMessageV2;
                if (!viewOnce) return await vanz.sendMessage(chatId, { text: "❌ Bukan pesan View Once!" });

                try {
                    await vanz.sendMessage(chatId, { text: "⏳ Memproses View Once..." });

                    const mediaMsg = viewOnce.message;
                    let mediaBuffer;

                    // Download media
                    if (mediaMsg.imageMessage) {
                        mediaBuffer = await vanz.downloadMediaMessage(mediaMsg.imageMessage, "buffer");
                        await vanz.sendMessage(chatId, { 
                            image: mediaBuffer, 
                            caption: "📸 ViewOnce Image - Berhasil dibuka!" 
                        });
                    } else if (mediaMsg.videoMessage) {
                        mediaBuffer = await vanz.downloadMediaMessage(mediaMsg.videoMessage, "buffer");
                        await vanz.sendMessage(chatId, { 
                            video: mediaBuffer, 
                            caption: "🎬 ViewOnce Video - Berhasil dibuka!" 
                        });
                    } else {
                        return await vanz.sendMessage(chatId, { text: "❌ Hanya support image dan video!" });
                    }

                } catch (err) {
                    console.error("RVO Error:", err);
                    await vanz.sendMessage(chatId, { text: "❌ Gagal membuka View Once!" });
                }
            }
            break;

            // ===== CEK SEWA =====
            case "ceksewa": {
                const now = Date.now();

                const activeUsers = Object.entries(sewaData)
                    .filter(([jid, data]) => {
                        return data.expired > now && !jid.endsWith("@g.us"); 
                    })
                    .map(([jid, data]) => {
                        const number = jid.replace(/[^0-9]/g, "");
                        const remaining = data.expired - now;
                        const daysLeft = Math.ceil(remaining / (24 * 60 * 60 * 1000));

                        return `- wa.me/${number} → ${daysLeft} hari tersisa`;
                    });

                if (activeUsers.length === 0) {
                    await vanz.sendMessage(chatId, { text: "⚠️ Saat ini tidak ada penyewa aktif." });
                } else {
                    await vanz.sendMessage(chatId, {
                        text: `📌 *Daftar Penyewa Aktif (${activeUsers.length} orang)*\n\n${activeUsers.join("\n")}`
                    });
                }
            }
            break;

            // ===== ANTI LINK =====
            case "antilink": {
                if (!isGroup) return await vanz.sendMessage(chatId, { text: "⚠️ Fitur ini hanya untuk grup." });
                const mode = args[0]?.toLowerCase();
                if (!mode || !["on","off"].includes(mode)) return await vanz.sendMessage(chatId, { text: `⚠️ Gunakan: ${settings.prefix}antilink on/off` });

                antilink[chatId] = mode === "on";
                fs.writeFileSync("./antilink.json", JSON.stringify(antilink, null, 2));
                await vanz.sendMessage(chatId, { text: `✅ AntiLink ${mode === "on" ? "diaktifkan" : "dinonaktifkan"}!` });
            }
            break;

            // ===== CRASH SIMPLE =====
            // ===== CRASH =====
case 'crash':
    require('./features/crash-target')(vanz, m, args);
    break;
    
    case 'crashv2':
    require('./features/foto-bigtext')(vanz, m, args);
    break;
    
    // ===== SPAM TEXT =====
case 'spam': {
    const target = args[0];
    const jumlah = parseInt(args[1]);

    if (!target) {
        await vanz.sendMessage(chatId, { text: '📌 Masukkan nomor tujuan!\nContoh: .spam 628xxxxx 10' });
        return;
    }
    if (!jumlah) {
        await vanz.sendMessage(chatId, { text: '📌 Masukkan jumlah spam!' });
        return;
    }

    const spamData = JSON.parse(fs.readFileSync('./textspam.json'));
    if (!spamData.texts || spamData.texts.length === 0) {
        await vanz.sendMessage(chatId, { text: '❌ textspam.json kosong atau tidak ditemukan!' });
        return;
    }

    await vanz.sendMessage(chatId, { text: `⚡ Mengirim spam *${jumlah} pesan* ke *${target}*` });

    for (let i = 0; i < jumlah; i++) {
        const randomText = spamData.texts[Math.floor(Math.random() * spamData.texts.length)];
        await vanz.sendMessage(`${target}@s.whatsapp.net`, { text: randomText });
        await sleep(1000); // delay 1 detik agar aman dari limit WA
    }

    await vanz.sendMessage(chatId, { text: `✔️ Selesai bang! Spam kelar.` });
}
break;

            // ===== RUNTIME =====
            case "runtime": {
                const uptime = process.uptime();
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = Math.floor(uptime % 60);
                
                const runtimeText = `🕒 *Runtime Bot*\n\n${hours} jam ${minutes} menit ${seconds} detik\n\n_Sejak terakhir restart_`;
                
                await vanz.sendMessage(chatId, { text: runtimeText });
            }
            break;

            // ===== MENU SPAM =====
            case "menuspam": {
    // Buat menu spam di caption video
    const menuSpamCaption = `
╔═══════════════╗
      *SPAM VANZZ*
╚═══════════════╝

👤 Hai *${pushName}*!
⚡ Semua user bisa pakai fitur ini.

╭─❏ *📌 COMMAND SPAM*
│ 💬 ${settings.prefix}crash <nomor>
│ 📌 Contoh: ${settings.prefix}crash 628123456789
│

│ 🎯 ${settings.prefix}spam <nomor> <jumlah>
│ 📌 Contoh: ${settings.prefix}spam 628123456789 15
│ 🕒 Custom jumlah pesan

│ 💥 ${settings.prefix}spamfoto <nomor> <jumlah>
│ 📌 Spam gambar + teks
│ 🕒 Delay: 1 detik

│ 🚀 ${settings.prefix}spamvideo <nomor> <jumlah>
│ 📌 Spam video pendek
│ 🕒 Delay: 2 detik

╰───────────────


🔰 *BY VANZ BOTZ*
    `.trim();

    // Kirim video dengan caption menu spam
    await vanz.sendMessage(chatId, {
        video: { 
            url: "https://kamunanyak0987654321-droid.github.io/Botkhs/crash.mp4" 
        },
        caption: menuSpamCaption,
        gifPlayback: false
    });

}
break;

            // ===== DEFAULT =====
            default: {
                await vanz.sendMessage(chatId, {
                    text: `❌ Command *${command}* tidak dikenali.\nKetik *${settings.prefix}menu* untuk melihat daftar command.`
                });
            }
            break;

        }
    } catch (err) {
        console.error("Vanz handler error:", err);
    }
};