// functions/functionHandler.js

// Fungsi untuk logika perhitungan pertempuran boss
async function battleBoss(player, boss) {
    // Misalnya, perhitungan sederhana dengan power
    const playerPower = player.power;
    const bossPower = boss.power;
    
    if (playerPower >= bossPower) {
        const chanceToWin = Math.random(); // Kemungkinan menang
        if (chanceToWin <= 0.5) {
            return {
                result: 'win',
                message: `Congratulations! You defeated the Boss!`
            };
        } else {
            return {
                result: 'lose',
                message: `Unfortunately, you lost against the Boss. Try again later!`
            };
        }
    } else {
        return {
            result: 'lose',
            message: `Your power is too low to fight this boss. Increase your power first!`
        };
    }
}

// Fungsi untuk menghitung power berdasarkan level dan peralatan
function calculatePlayerPower(player) {
    let basePower = player.level * 10; // Setiap level memberikan 10 power
    player.inventory.forEach(item => {
        if (item === 'Sword') basePower += 15; // Misalnya, pedang menambah 15 power
        if (item === 'Armor') basePower += 20; // Armor menambah 20 power
    });
    return basePower;
}

// Fungsi untuk melakukan perhitungan damage saat hunting
function calculateDamage(player, monster) {
    const playerPower = calculatePlayerPower(player);
    const monsterPower = monster.power;
    
    // Perhitungan damage
    if (playerPower > monsterPower) {
        return `You deal ${playerPower - monsterPower} damage to the monster!`;
    } else {
        return `The monster overpowers you. Try again after leveling up!`;
    }
}

// Fungsi untuk perhitungan item drops saat berburu
function generateItemDrop(monster) {
    // Misalnya, monster memiliki 20% chance untuk drop item spesial
    const dropChance = Math.random();
    if (dropChance <= 0.2) {
        return 'Special Item: Dragon Scale';
    } else {
        return 'Common Item: Monster Fang';
    }
}
function renderInventoryLayout(items) {
    if (!items || items.length === 0) {
      return '🎒 <b>Inventory Kamu Kosong</b>\nKamu belum memiliki item apapun.';
    }
  
    const rows = [];
    for (let i = 0; i < items.length; i += 6) {
      const rowItems = items.slice(i, i + 6)
        .map(item => `🔹${item.itemId} ${item.itemName}(${item.class}) * ${item.quantity}\n`);
      rows.push(rowItems.join(' '));
    }
  
    return `🎒 <b>Inventory Kamu (${items.length} item)</b>\n\n<code>` + rows.join('\n') + "</code>\n\nGunakan /sellitem {idItem} untuk menjual item kepada sistem.\nNote: Sistem akan membeli setengah harga dari harga awal.";
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

      
  

module.exports = {
    battleBoss,
    calculatePlayerPower,
    calculateDamage,
    generateItemDrop,
    renderInventoryLayout
};
