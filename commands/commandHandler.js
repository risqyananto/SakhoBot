const { travelimpactmodel } = require('googleapis/build/src/apis/travelimpactmodel');
const { getPlayerData, updatePlayerData, getInventoryData, addItemToInventory, getShopData, getAllPlayers,renderLeaderboard,getMonsterList, getMonsterByTier, autoLevel, generateExpBar} = require('../sheets/sheets'); // Mengimpor fungsi dari sheets.js
const { battleBoss, calculatePlayerPower, generateItemDrop, renderInventoryLayout } = require('./functionHandler');


// Handler untuk /start
async function handleStart(ctx) {
    const userId = ctx.from.id;
    const player = await getPlayerData(userId);
    console.log(player)
    if (!player) {
        return ctx.reply('anda belum terdaftar sebagai member! gunakan /register untuk begabung!');
    }
    return ctx.reply(`Welcome back, ${ctx.from.first_name}! Choose an action:\n/daily - Claim Daily Rewards\n/stats - View Stats\n/inventory - Check Inventory\n/leaderboard - View Leaderboard\n/hunt - Hunt Monsters\n/boss - Fight Boss\n/shop - Official System Shop\n/market - Buy/Sell Item Player\n/commands - Menampilkan List Command Bot`);
}
async function handleCommands(ctx){
    const userId = ctx.from.id;
    const player = await getPlayerData(userId);
    console.log(player)
    if(!player){ return ctx.reply("anda belum terdaftar sebagai member! gunakan /register untuk begabung!")}
    return ctx.reply('COMING SOON')
}
// Handler untuk /daily
async function handleDaily(ctx) {
  const userId = ctx.from.id;
  const player = await getPlayerData(userId); // Ambil data player dari Google Sheets
  console.log("Player (" + userId + ") mencoba claim daily dengan status LastClaim (" + player.lastDaily + ")")
  if (!player) return ctx.reply('You are not registered yet!');

  // Mengecek apakah lastDaily player adalah false
  if (!player.lastDaily || player.lastDaily === 'FALSE') {
      // Jika lastDaily false, player bisa klaim hadiah harian
      const randomGold = Math.floor(Math.random() * 1000) + 1; // Gold acak antara 1-1000
      player.gold += randomGold; // Menambah gold pemain
      player.lastDaily = true; // Tandai lastDaily sebagai true karena sudah klaim

      // Update LastClaimed ke waktu sekarang
      const now = new Date();
      player.lastClaimed = now.toISOString();

      // Update data pemain di Google Sheets
      await updatePlayerData(userId, player); 
      return ctx.reply(`You claimed your daily reward! You received ${randomGold} gold. Current Gold: ${player.gold}`);
  } else if(!player.lastDaily || player.lastDaily === 'TRUE'){
      // Jika lastDaily true, pemain sudah klaim hadiah, harus menunggu 24 jam
      const lastClaimed = new Date(player.lastClaimed);
      const now = new Date();
      const diff = now - lastClaimed;

      if (diff >= 24 * 60 * 60 * 1000) { // Cek apakah sudah 24 jam
          // Jika sudah 24 jam, reset lastDaily ke false agar pemain bisa klaim lagi
          player.lastDaily = false;
          player.lastClaimed = now.toISOString(); // Update lastClaimed ke waktu sekarang

          await updatePlayerData(userId, player); // Update data pemain di Google Sheets
          return ctx.reply('You can claim your daily reward again!'); // Beri tahu pemain bisa klaim lagi
      } else {
          const remainingTime = (24 * 60 * 60 * 1000 - diff) / 1000; // Hitung sisa waktu dalam detik
          const hours = Math.floor(remainingTime / 3600);
          const minutes = Math.floor((remainingTime % 3600) / 60);
          const seconds = Math.floor(remainingTime % 60);
          return ctx.reply(`You can claim your daily reward in ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`);
      }
  }
}


// Handler untuk /stats
async function handleStats(ctx) {
  const userId = String(ctx.from.id);
  const player = await getPlayerData(userId);

  if (!player) {
    return ctx.reply('❌ Kamu belum terdaftar. Gunakan /register terlebih dahulu.');
  }

  const inventory = await getInventoryData(userId);
  const itemCount = inventory.length;

  const inventoryText = itemCount > 0
    ? `🎒 Inventory: ${itemCount} item`
    : `🎒 Inventory: Kamu tidak memiliki item di inventory.`;

  const statusMessage = `
📊 Stats kamu:
ID: ${player.userId}
Username: ${player.username}
Level: ${player.level}
EXP: ${player.exp}
HP: ${player.hp}/${player.maxHp}
Gold: ${player.gold}
Total Power: ${player.totalPower}
Title: ${player.title}
Inventory: ${inventoryText}
  `;

  ctx.reply(statusMessage);
}

// Handler untuk /inventory
async function handleInventory(ctx) {
    const userId = ctx.from.id;
    const player = await getPlayerData(userId);

    if (!player) return ctx.reply('You are not registered yet!');

    const inventory = await getInventoryData(userId);
    console.log(inventory)
    if (!inventory || inventory.length === 0) {
      return ctx.reply('🎒 Kamu tidak memiliki item di inventory.');
    }
 
    const invMessage = renderInventoryLayout(inventory || []);

    await ctx.reply(invMessage, { parse_mode: 'HTML' });
}

async function handleRegister(ctx) {
  const userId = ctx.from.id;
  const username = ctx.from.username;

  try {
    // Mengecek apakah pemain sudah terdaftar
    const player = await getPlayerData(userId);

    if (player) {
      // Jika sudah terdaftar, beri pesan bahwa pemain sudah terdaftar
      return ctx.reply(`Player with username @${username} is already registered.`);
    }

    // Jika belum terdaftar, buat data pemain baru
    const newPlayerData = {
      userId: userId,
      username: username,
      level: 1,
      exp: 0,
      hp: 100,
      maxHp: 100,
      gold: 50,
      weaponPower: 10,
      armorPower: 5,
      totalPower: 15,
      title: 'Outer Disciple',
      lastDaily: false,
      cooldownHunt: '0', // Misalnya cooldown 0 berarti siap berburu
    };

    // Menambahkan pemain baru ke Google Sheets
    const result = await updatePlayerData(userId, newPlayerData);

    if (result) {
      // Kirimkan pesan kalau data berhasil ditambahkan
      ctx.reply(`Player @${username} successfully registered!`);
    } else {
        
      ctx.reply('Something went wrong while registering the player.');
    }
  } catch (error) {
    console.error('Error registering player:', error);
    ctx.reply('Failed to register the player.');
  }
}
async function handleAdd(ctx) {
  const userId = ctx.from.id
 itemId = 213
 itemName = "Heavenly Sword"
 type = 'Weapon'
 power = 10000
 quantity = 1
  await addItemToInventory(userId, itemId, itemName, type, power, quantity)
  ctx.reply(`Item ${itemName} added to inventory!`);
}

async function handleLeaderboard(ctx){
  const userId = ctx.from.id;
    const player = await getPlayerData(userId);

    if (!player) return ctx.reply('You are not registered yet!');
  const leaderboard = await renderLeaderboard();
  ctx.reply(leaderboard, { parse_mode: 'HTML' });
}
async function handleMonsterList(ctx){
  const userId = ctx.from.id;
  const player = await getPlayerData(userId);

  if (!player) return ctx.reply('You are not registered yet!');

  const listMonster = await getMonsterList();
  ctx.reply(listMonster, { parse_mode: 'HTML' });
}
async function handleBalance(ctx){
    const userId = ctx.from.id;
    const player = await getPlayerData(userId);
    if (!player) return ctx.reply('Kamu belum terdaftar. Gunakan /register.');
    const getBalance = player.gold;
    ctx.reply(`Anda memiliki ${getBalance} Gold didalam saku anda`)
  
}
async function handleHunt(ctx) {
  try {
    const userId = ctx.from.id;

    const player = await getPlayerData(userId);
    if (!player) return ctx.reply('Kamu belum terdaftar. Gunakan /register.');
    player.userId = userId;

    const playerLevel = player.level;
    const playerHP = player.hp;
    const playerAttack = player.weaponPower;
    const playerDefense = player.armorPower;

    console.log(`Player Level: ${playerLevel} | HP: ${playerHP} | Attack: ${playerAttack} | Defense: ${playerDefense}`);

    const monsters = await getMonsterByTier(playerLevel);
    if (!monsters.length) return ctx.reply('Tidak ada monster untuk levelmu.');

    const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
    const [id, name, monsterHP, monsterAttack, monsterGold, monsterExp, lootItems] = randomMonster;

    const playerPower = playerHP + playerAttack + playerDefense;
    const monsterPower = parseInt(monsterHP) + parseInt(monsterAttack);

    // Helper function
    const generateRandomNumber = () => Math.floor(100000 + Math.random() * 900000);
    function getRandomClass() {
      const classes = ['F', 'F+', 'E-' ,'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S-', 'S', 'S+', 'SS', 'SS+', 'SSS+'];
      return classes[Math.floor(Math.random() * classes.length)];
    }
    if (playerPower >= monsterPower) {
      // Menang
      const goldEarned = parseInt(monsterGold);
      const expEarned = parseInt(monsterExp);

      const lootOptions = lootItems.split(',');
      const randomLoot = lootOptions[Math.floor(Math.random() * lootOptions.length)].trim();
      console.log(`Player ${userId} mendapatkan ${randomLoot}`)
      // Update object player dulu
      player.gold += goldEarned;
      player.exp += expEarned;

      console.log(`${player.userId} EXP baru: ${player.exp}, Gold baru: ${player.gold}`);

      // Cek apakah naik level
      const leveledUp = await autoLevel(player);

      // Update database setelah semua perubahan
      await updatePlayerData(userId, {
        gold: player.gold,
        exp: player.exp,
        level: player.level,
        hp: player.hp,
        weaponPower: player.weaponPower,
        armorPower: player.armorPower,
      });

      if (leveledUp) {
        await ctx.reply(`🎉 Selamat! Kamu naik ke Level ${player.level}!\n🔥 Stat kamu ikut bertambah!`);
      }

      // Tambahkan loot ke inventory
      const itemId = generateRandomNumber();
      const itemClass = getRandomClass()
      const itemName = randomLoot;
      const quantity = 1
      console.log(`Menambahkan item ke inventory: [${itemId}] ${itemName} x${quantity} dan class : ${itemClass}`);
      await addItemToInventory(userId, itemId, randomLoot, 'Raw', 0, 1, itemClass);
      const expBar = generateExpBar(player.exp, player.level * 100);

      await ctx.reply(`🏆 Kamu menang melawan *${name}*!
+💰 Gold: ${goldEarned}
+✨ EXP: ${expEarned}
🎁 Loot: ${randomLoot}


✨ EXP Progress:
${expBar}
`, { parse_mode: 'Markdown' });

    } else {
      await ctx.reply(`💀 Kamu kalah melawan *${name}*...\nCoba lagi untuk menjadi lebih kuat!`, { parse_mode: 'Markdown' });
    }

  } catch (error) {
    console.error('Error di handleHunt:', error);
    ctx.reply('Terjadi kesalahan saat berburu.');
  }
}

async function handleShop(ctx) {
  try {
    // Ambil data Shop dari Google Sheets
    const shopData = await getShopData();

    // Kirim pesan dengan format sederhana
    let shopMessage = '🛒 RhysBot OFFICIAL Shop\n\n<code>';

    shopData.forEach(item => {
      const { ItemId, ItemName, Class, Power, Price } = item;
      shopMessage += `/buy ${ItemId} ${ItemName}(${Class}/${Power}) - ${Price} Gold\n`;
    });
    shopMessage += `</code>`
    // Kirim pesan ke user
    await ctx.reply(shopMessage, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error di handleShop:', error);
    ctx.reply('Terjadi kesalahan saat membuka toko.');
  }
}

async function resetDailyStatus() {
  try {
    const players = await getAllPlayers(); // Ambil semua player dari Sheets

    for (const player of players) {
      await updatePlayerData(player.userId, { lastDaily: false });
      console.log(`Reset LastDaily untuk userId: ${player.userId}`);
    }

    console.log('✅ Reset harian selesai.');
  } catch (error) {
    console.error('❌ Gagal reset harian:', error);
  }
}

async function handleBuy(ctx) {
  const testMessage = `<a href="https://facebook.com">Facebook</a>`;
  await ctx.reply(testMessage, { parse_mode: 'HTML' });
}
async function handleMarket(ctx){
  return ctx.reply('coming soon')
}
async function handleBuyMarket(ctx){
  return ctx.reply('coming soon')
}
async function handleSellMarket(ctx){
  return ctx.reply('coming soon')
}
async function handleDonate(ctx){
  ctx.reply(
    `<b>Support This Bot!</b>\n\n` +
    `If you enjoy using this bot and want to support its development, consider making a small donation!\n\n` +
    `<a href="https://trakteer.id/rhys.id/tip">☕ Donate via Trakteer</a>\n\n` +
    `Your support helps keep this bot running and improving. Thank you so much! ❤️`,
    { parse_mode: 'HTML' });
}
module.exports = {
    handleStart,
    handleCommands,
    handleDaily,
    handleStats,
    handleInventory,
    handleRegister,
    handleAdd,
    handleLeaderboard,
    handleMonsterList,
    handleHunt,
    handleBalance,
    handleShop,
    resetDailyStatus,
    handleBuy,
    handleMarket,
    handleBuyMarket,
    handleSellMarket,
    handleDonate
};
