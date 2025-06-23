// index.js

const { Telegraf } = require('telegraf');
const { handleStart, resetDailyStatus, handleCommands, handleDaily, handleStats, handleDonate, handleBuy, handleMarket, handleBuyMarket, handleSellMarket, handleInventory, handleRegister, handleBalance, handleShop, handleAdd, handleLeaderboard, handleMonsterList, handleHunt} = require('./commands/commandHandler'); // Mengimpor handler
const cron = require('node-cron')
const { autoUpdatePlayerTitles } = require('./sheets/sheets');
const bot = new Telegraf('7783365165:AAH3ASxL-stQ_0I33JaRX6mR9KlGSGxlIIM'); // Ganti dengan token bot Anda

// Setup Command Bot
bot.start(handleStart); // Menangani perintah /start
bot.command('help', handleStart);
bot.command('menu', handleStart);
bot.command('commands', handleCommands);
bot.command('balance', handleBalance);
bot.command('add', handleAdd);
bot.command('daily', handleDaily); // Menangani perintah /daily
bot.command('stats', handleStats); // Menangani perintah /stats
bot.command('inventory', handleInventory); // Menangani perintah /inventory
bot.command('leaderboard', handleLeaderboard);
bot.command('monster', handleMonsterList);
bot.command('hunt', handleHunt);
bot.command('shop', handleShop);
bot.command('buy', handleBuy);
bot.command('market', handleMarket);
bot.command('sellm', handleSellMarket);
bot.command('buym', handleBuyMarket);
bot.command('resetdaily', resetDailyStatus);
bot.command('donate', handleDonate);
bot.command('register', handleRegister); // Menangani perintah /register

cron.schedule('0 0 * * *', () => {
   console.log('⏰ Menjalankan resetDailyStatus()...');
   resetDailyStatus();
 });
console.log("Bot Menyala!")
bot.launch()
   .then(() => console.log('Bot Menyala nih wi'))
   .catch(err => console.error('Bot failed to launch:', err));
