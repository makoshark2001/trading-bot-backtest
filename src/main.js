require('dotenv').config();
const BacktestServer = require('./api/BacktestServer');
const { Logger } = require('./utils');

async function main() {
    try {
        Logger.info('🚀 Starting Trading Bot Backtest Service...');
        
        const server = new BacktestServer();
        await server.start();
        
        Logger.info('✅ Trading Bot Backtest Service started successfully');
        
    } catch (error) {
        Logger.error('❌ Failed to start Trading Bot Backtest Service', { 
            error: error.message 
        });
        console.error('Fatal error:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

main();