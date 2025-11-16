const fs = require("fs");
const path = require("path");

// Folder database
const DB_DIR = path.join(__dirname, "database");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// File JSON untuk menyimpan chat aktif
const CHAT_DB = path.join(DB_DIR, "activeChats.json");

// Buat file kosong kalau belum ada
if (!fs.existsSync(CHAT_DB)) {
    fs.writeFileSync(CHAT_DB, "[]", "utf-8");
    console.log("✅ File activeChats.json berhasil dibuat!");
} else {
    console.log("ℹ️ File activeChats.json sudah ada.");
}

// Fungsi load & save chat
const loadChats = () => JSON.parse(fs.readFileSync(CHAT_DB, "utf-8"));
const saveChats = (chats) => fs.writeFileSync(CHAT_DB, JSON.stringify(chats, null, 2), "utf-8");

// Fungsi tambah chat
function addActiveChat(chatId) {
    const chats = loadChats();
    if (!chats.includes(chatId)) {
        chats.push(chatId);
        saveChats(chats);
        console.log(`✅ Chat baru tersimpan: ${chatId}`);
    }
}

// Contoh: tambah chat manual
// addActiveChat("6281234567890@s.whatsapp.net");

module.exports = { loadChats, saveChats, addActiveChat };