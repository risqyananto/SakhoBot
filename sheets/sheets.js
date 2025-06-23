const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = '14QXVJzWPSgOIsULb4dofDd8pjd9VwmFXMp0qZ8hxkfo'; // ID Spreadsheet
const PLAYER_SHEET = 'Players'; // Nama sheet untuk data pemain
const INVENTORY_SHEET = 'Inventory'; // Nama sheet untuk data inventory
const SHOP_SHEET = 'Shop'; // Nama sheet untuk daftar shop
const MONSTER_LIST_SHEET = 'MonsterList'; // Nama sheet untuk daftar monster
const WEEKLY_BOSS_SHEET = 'WeeklyBoss'; // Nama sheet untuk boss mingguan
const LEADERBOARD_SHEET = 'Leaderboard'; // Nama sheet untuk leaderboard
const SALES_SHEET = 'Sales'; // Nama sheet untuk market player
const TITLE_LIST_SHEET = 'TitleList'; // Nama sheet untuk title list

async function getSheet() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  return sheets;
}
// Fungsi untuk mendapatkan semua data pemain dari sheet Players
async function getAllPlayers() {
  try {
    const sheets = await getSheet();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Players!A2:M', // Ambil semua kolom dari A sampai M
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    // Mapping setiap baris menjadi object player
    const players = rows.map((player) => ({
      userId: player[0],
      username: player[1],
      level: parseInt(player[2], 10),
      exp: parseInt(player[3], 10),
      hp: parseInt(player[4], 10),
      maxHp: parseInt(player[5], 10),
      gold: parseInt(player[6], 10),
      weaponPower: parseInt(player[7], 10),
      armorPower: parseInt(player[8], 10),
      totalPower: parseInt(player[9], 10),
      title: player[10] || '',
      lastDaily: player[11] || '',
      cooldownHunt: player[12] || '',
    }));

    return players;
  } catch (error) {
    console.error('❌ Error getting all player data:', error);
    return [];
  }
}

// Fungsi untuk mendapatkan data pemain dari sheet Players
async function getPlayerData(userId) {
    try {
      const sheets = await getSheet();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `Players!A2:M`, // A2 sampai M (13 kolom sesuai struktur)
      });
  
      const rows = response.data.values;
      if (!rows || rows.length === 0) return null;
  
      // Mencari data pemain berdasarkan userId (kolom A / index 0)
      const player = rows.find(row => row[0] === userId.toString());
  
      return player ? {
        userId: player[0],
        username: player[1],
        level: parseInt(player[2], 10),
        exp: parseInt(player[3], 10),
        hp: parseInt(player[4], 10),
        maxHp: parseInt(player[5], 10),
        gold: parseInt(player[6], 10),
        weaponPower: parseInt(player[7], 10),
        armorPower: parseInt(player[8], 10),
        totalPower: parseInt(player[9], 10),
        title: player[10] || '',
        lastDaily: player[11] || '',
        cooldownHunt: player[12] || '',
      } : null;
    } catch (error) {
      console.error('❌ Error getting player data:', error);
      return null;
    }
  }
  // Fungsi untuk menghitung EXP yang dibutuhkan untuk naik level (sistem eksponensial)
function calculateEXPForLevel(level) {
  const baseEXP = 50;  // EXP dasar yang dibutuhkan untuk level pertama
  return Math.floor(baseEXP * Math.pow(level, 1.5)); // Menggunakan rumus eksponensial
}

// Fungsi untuk level-up player berdasarkan EXP yang didapatkan
async function levelUpPlayer(userId, gainedEXP) {
  const player = await getPlayerData(userId); // Ambil data player
  if (!player) return console.error('Player not found');
  
  let { level, exp } = player; // Ambil level dan EXP saat ini
  
  const requiredEXP = calculateEXPForLevel(level); // Hitung EXP yang dibutuhkan untuk level-up
  
  // Tambahkan EXP yang didapatkan ke EXP pemain
  exp += gainedEXP;
  
  // Cek apakah EXP cukup untuk naik level
  if (exp >= requiredEXP) {
    // Naikkan level pemain
    level++;
    exp = 0; // Reset EXP untuk level selanjutnya
    
    // Ambil title berdasarkan level
    const title = getPlayerTitle(level);
    
    // Perbarui data player di spreadsheet
    await updatePlayerData(userId, {
      userId: userId,
      username: player.username,  // Asumsikan kamu sudah mengambil username dari player
      level: level,
      exp: 0,  // EXP di-reset setelah naik level
      title: title,
      hp: player.hp,  // Asumsikan kamu memiliki data HP
      maxHp: player.maxHp,
      gold: player.gold,  // Asumsikan ada data gold
      weaponPower: player.weaponPower,
      armorPower: player.armorPower,
      totalPower: player.totalPower,
      lastDaily: player.lastDaily,
      cooldownHunt: player.cooldownHunt,
    });
    
    console.log(`Player ${userId} naik level ke ${level} dengan title: ${title}`);
    
    return `Selamat! Anda naik level ke ${level} dan mendapatkan title "${title}".`;
  } else {
    // Jika belum cukup EXP
    return `Anda membutuhkan ${requiredEXP - exp} EXP lagi untuk naik level.`;
  }
}

// Fungsi untuk mengambil title berdasarkan level
function getPlayerTitle(level) {
  if (level >= 45) return 'Divine Martial Artist';
  if (level >= 40) return 'Legendary Martial Artist';
  if (level >= 35) return 'Martial King';
  if (level >= 30) return 'Great Elder';
  if (level >= 25) return 'Senior Elder';
  if (level >= 20) return 'Sect Leader Candidate';
  if (level >= 15) return 'Core Disciple';
  if (level >= 10) return 'Elite Disciple';
  if (level >= 5) return 'Inner Disciple';
  return 'Outer Disciple';
}

// Fungsi untuk mengupdate data player di spreadsheet
async function updatePlayerData(userId, data) {
  const sheets = await getSheet();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${PLAYER_SHEET}!A2:M`, // Ambil semua kolom sampai M
    });

    const rows = response.data.values;
    const headers = rows[0];

    // Cari baris player
    const userRowIndex = rows.findIndex(row => row[0] === userId.toString());

    // Jika user belum ada, tambahkan
    if (userRowIndex === -1) {
      const newRow = [
        data.userId,
        data.username || '',
        data.level || 1,
        data.exp || 0,
        data.hp || 100,
        data.maxHp || 100,
        data.gold || 50,
        data.weaponPower || 0,
        data.armorPower || 0,
        data.totalPower || 0,
        data.title || '',
        data.lastDaily || false,
        data.cooldownHunt || '',
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Players',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [newRow],
        },
      });

      return true;
    } else {
      // Update data row yang sesuai
      const updatedRow = [
        data.userId,          // A - ID
        data.username,        // B - Username
        data.level,           // C - Level
        data.exp,             // D - EXP
        data.hp,              // E - HP
        data.maxHp,           // F - MaxHP
        data.gold,            // G - Gold
        data.weaponPower,     // H - WeaponPower
        data.armorPower,      // I - ArmorPower
        data.totalPower,      // J - TotalPower
        data.title,           // K - Title
        data.lastDaily,       // L - LastDaily
        data.cooldownHunt || '', // M - CooldownHunt
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${PLAYER_SHEET}!A${userRowIndex + 2}:M${userRowIndex + 2}`,
        valueInputOption: 'RAW',
        resource: {
          values: [updatedRow], // Data yang akan diperbarui
        },
      });

      return true;
    }
  } catch (error) {
    console.error('Error in updatePlayerData:', error);
    return false;
  }
}

  
// Fungsi untuk mendapatkan inventory pemain
async function getInventoryData(playerId) {
  try {
    console.log("Player (" + playerId + ") mencoba mengakses inventory")
    const sheets = await getSheet();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${INVENTORY_SHEET}!A2:G`, // Kolom sesuai struktur Inventory
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return []; // Jika tidak ada data inventory

    // Mencari data inventory berdasarkan PlayerID
    const inventory = rows.filter(row => String(row[0]) === String(playerId));
    return inventory.map(item => ({
      itemId: item[1],
      itemName: item[2],
      type: item[3],
      power: item[4],
      quantity: item[5],
      class: item[6]
    }));
  } catch (error) {
    console.error('Error getting inventory data:', error);
    return []; // Jika ada error, kembalikan array kosong
  }
}

// Fungsi untuk mendapatkan data item dari shop
async function getShopItems() {
  try {
    const sheets = await getSheet();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHOP_SHEET}!A2:F`, // Kolom sesuai struktur Shop
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return []; // Jika tidak ada data di shop

    // Map data item shop
    return rows.map(item => ({
      itemId: item[0],
      name: item[1],
      type: item[2],
      description: item[3],
      price: item[4],
      power: item[5],
      effect: item[6],
    }));
  } catch (error) {
    console.error('Error getting shop items:', error);
    return []; // Jika ada error, kembalikan array kosong
  }
}

// Fungsi untuk mendapatkan data monster dan menampilkan dalam format HTML
async function getMonsterList() {
  try {
    const sheets = await getSheet();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MONSTER_LIST_SHEET}!A2:G`, // Kolom sesuai struktur MonsterList
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return 'Tidak ada data monster tersedia.'; // Jika tidak ada data monster

    // Format data monster menjadi string HTML
    let monsterListHtml = 'Daftar Monster:\n\n';
    rows.forEach(monster => {
      const idm = monster[0] // id mosnter
      const name = monster[1];  // Nama monster
      const attack = monster[3]; // Attack
      const hp = monster[2];     // HP
      const loot = monster[6];   // Loot
      const lootItems = loot ? loot.split(',').map(item => item.trim()) : ['Tidak ada loot'];

      // Format sesuai yang diminta: <nama monster> [attack/hp] [loot]
      monsterListHtml += `<code>(${idm}.) ${name} [${attack}/${hp}] [Loot: ${lootItems.join(', ')}]</code>\n`;
    });

    return monsterListHtml;
  } catch (error) {
    console.error('Error getting monster list:', error);
    return 'Terjadi kesalahan saat mengambil data monster.'; // Jika ada error
  }
}


// Fungsi untuk mendapatkan data Weekly Boss
async function getWeeklyBoss(week) {
  try {
    const sheets = await getSheet();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WEEKLY_BOSS_SHEET}!A2:H`, // Kolom sesuai struktur WeeklyBoss
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return null; // Jika tidak ada data boss mingguan

    // Mencari data boss berdasarkan minggu
    const boss = rows.find(row => row[0] === week); // Asumsikan kolom pertama adalah week
    return boss ? {
      week: boss[0],
      name: boss[1],
      hp: boss[2],
      attack: boss[3],
      expDrop: boss[4],
      goldDrop: boss[5],
      loot: boss[6],
      power: boss[7],
    } : null; // Jika boss tidak ditemukan, kembalikan null
  } catch (error) {
    console.error('Error getting weekly boss data:', error);
    return null; // Jika ada error, kembalikan null
  }
}

async function addItemToInventory(userId, itemId, itemName, type, power, quantity, itemclass) {
  try {
    const sheets = await getSheet();
    
    // Ambil data inventory sekarang
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${INVENTORY_SHEET}!A2:G`,
    });

    const rows = response.data.values || [];

    // Cari apakah item yang sama (berdasarkan itemId) sudah ada untuk player tersebut
    const itemIndex = rows.findIndex(
      row => row[0] === String(userId) && row[1] === String(itemId)
    );

    if (itemIndex !== -1) {
      // Item sudah ada → update quantity
      const currentQuantity = parseInt(rows[itemIndex][5] || '1', 10);
      const newQuantity = currentQuantity + quantity;
      const updateRange = `${INVENTORY_SHEET}!F${itemIndex + 2}`; // +2 karena A2 adalah baris awal

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: updateRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[newQuantity]],
        },
      });
    } else {
      // Item belum ada → tambahkan baris baru
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${INVENTORY_SHEET}!A:G`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            userId,
            itemId,
            itemName,
            type,
            power,
            quantity,
            itemclass
          ]],
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error adding item to inventory:', error);
    return false;
  }
}
async function renderLeaderboard() {
  try {
    const sheets = await getSheet();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${PLAYER_SHEET}!A2:L`, // Kolom sesuai struktur Players
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return '📊 <b>Leaderboard Kosong</b>\nBelum ada pemain yang terdaftar.';
    }

    // Sort berdasarkan level tertinggi
    rows.sort((a, b) => b[2] - a[2]); // Asumsikan level ada di kolom 3 (indeks 2)

    // Ambil data dan format menjadi string untuk leaderboard
    let leaderboard = '📊 <b>Leaderboard</b>\n\n';
    rows.forEach((row, index) => {
      const playerName = row[1];  // Asumsikan nama ada di kolom 2 (indeks 1)
      const playerLevel = row[2]; // Asumsikan level ada di kolom 3 (indeks 2)
      const playerTitle = row[10]; // Asumsikan title ada di kolom 11 (indeks 10)
      
      leaderboard += `<code>${index + 1}. ${playerName} (${playerTitle}) - Level ${playerLevel}</code>\n`;
    });

    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard data:', error);
    return '📊 <b>Leaderboard Error</b>\nTerjadi kesalahan saat mengambil data leaderboard.';
  }
}


      
async function autoUpdatePlayerTitles() {
  try {
    const sheets = await getSheet();

    // Ambil data player (sampai kolom M)
    const playerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Player!A2:M',
    });

    const players = playerRes.data.values;

    // Ambil data title list
    const titleRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'TitleList!A2:C',
    });

    const titleList = titleRes.data.values;

    // Buat array update
    const updates = [];

    players.forEach((player, index) => {
      const level = parseInt(player[2]); // Kolom C = Level
      let matchedTitle = 'Tanpa Gelar';

      for (const row of titleList) {
        const levelMin = parseInt(row[0]);
        const levelMax = parseInt(row[1]);
        const title = row[2];

        if (level >= levelMin && level <= levelMax) {
          matchedTitle = title;
          break;
        }
      }

      if (player[10] !== matchedTitle) {
        updates.push({
          range: `Player!K${index + 2}`, // Kolom K = Title
          values: [[matchedTitle]],
        });
      }
    });

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: 'RAW',
          data: updates,
        },
      });
      console.log(`✅ ${updates.length} Title player berhasil diperbarui.`);
    } else {
      console.log('Semua Title sudah sesuai, tidak ada perubahan.');
    }
  } catch (error) {
    console.error('Gagal update Title player:', error);
  }
}
function getTierFromLevel(level) {
  return Math.min(10, Math.ceil(level / 10));
}

async function getMonsterByTier(level) {
  const sheets = await getSheet();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MONSTER_LIST_SHEET}!A2:G`, // Ambil data A2 sampai G
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return [];

  // Hitung Tier berdasarkan Level
  const tier = Math.min(Math.floor((level - 1) / 10) + 1, 10); // Level 1-10 -> Tier 1, 11-20 -> Tier 2, dst

  const monsters = rows.filter(row => {
    const id = parseInt(row[0]); // ID monster
    const monsterTier = Math.min(Math.floor((id - 1) / 10) + 1, 10); // ID 1-10 -> Tier 1, dst
    return monsterTier === tier;
  });

  return monsters;
}
async function autoLevel(player) {
  let leveledUp = false;

  const expNeeded = player.level * 100; // contoh exp perlu 100 x level

  while (player.exp >= expNeeded) {
    player.exp -= expNeeded; // kurangi exp
    player.level += 1;       // naik level
    leveledUp = true;

    // Bonus stat setiap naik level
    player.hp += 10;
    player.weaponPower += 2;
    player.armorPower += 2;

    console.log(`Naik ke level ${player.level}! Bonus: +10 HP, +2 Attack, +2 Defense`);
  }

  return leveledUp;
}

function generateExpBar(currentExp, expNeeded, barLength = 10) {
  const progress = Math.min(currentExp / expNeeded, 1); // biar maksimal 100%
  const filledBars = Math.round(progress * barLength);
  const emptyBars = barLength - filledBars;

  const filled = '▰'.repeat(filledBars);
  const empty = '▱'.repeat(emptyBars);

  return `${filled}${empty} (${Math.floor(progress * 100)}%)`;
}

async function getShopData() {
  try {
    const sheets = await getSheet();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Shop!A2:H', // Asumsi data dimulai dari baris 2 (di atasnya ada header)
    });

    const rows = response.data.values;
    const shopData = [];

    // Parsing data dan masukkan ke dalam array shopData
    rows.forEach(row => {
      const [ItemId, ItemName, Type, Power, Quantity, Class, Level, Price] = row;
      shopData.push({
        ItemId,
        ItemName,
        Type,
        Power,
        Quantity,
        Class,
        Level,
        Price
      });
    });

    return shopData;
  } catch (error) {
    console.error('Error di getShopData:', error);
    throw new Error('Terjadi kesalahan saat mengambil data dari Google Sheets.');
  }
}

module.exports = {
  getAllPlayers,
  getPlayerData,
  updatePlayerData,
  getInventoryData,
  getShopItems,
  getMonsterList,
  getWeeklyBoss,
  addItemToInventory,
  renderLeaderboard,
  autoUpdatePlayerTitles,
  getMonsterByTier,
  autoLevel,
  generateExpBar,
  getShopData
};
