require('dotenv').config();
const axios = require('axios');

async function runBacktest() {
    const baseUrl = `http://localhost:${process.env.PORT || 3002}`;
    
    // Configuration for backtest
    const config = {
        initialBalance: 10000,
        commissionRate: 0.001,  // 0.1%
        slippageRate: 0.0005,   // 0.05%
        maxPositionSize: 0.15,  // 15% of portfolio
        stopLossPercent: 0.05,  // 5% stop loss
        takeProfitPercent: 0.10 // 10% take profit
    };
    
    try {
        console.log('🚀 Running comprehensive backtest...');
        console.log('Configuration:', config);
        
        // Get available pairs
        const pairsResponse = await axios.get(`${baseUrl}/api/pairs`);
        const pairs = pairsResponse.data.pairs;
        
        console.log(`\n📊 Found ${pairs.length} pairs: ${pairs.join(', ')}`);
        
        // Run backtest for each pair
        const results = {};
        
        for (const pair of pairs) {
            try {
                console.log(`\n🔄 Running backtest for ${pair}...`);
                
                const response = await axios.post(
                    `${baseUrl}/api/backtest/${pair}`, 
                    config
                );
                
                results[pair] = response.data.results;
                
                console.log(`✅ ${pair} completed:`, {
                    return: (response.data.results.totalReturnPercent || 0).toFixed(2) + '%',
                    trades: response.data.results.totalTrades,
                    winRate: (response.data.results.winRatePercent || 0).toFixed(1) + '%'
                });
                
            } catch (error) {
                console.error(`❌ ${pair} failed:`, error.message);
                results[pair] = { error: error.message };
            }
        }
        
        // Display summary
        console.log('\n📈 BACKTEST SUMMARY');
        console.log('='.repeat(50));
        
        const successfulResults = Object.entries(results).filter(([_, result]) => !result.error);
        
        if (successfulResults.length > 0) {
            // Calculate portfolio metrics
            let totalReturn = 0;
            let totalTrades = 0;
            let totalWins = 0;
            
            successfulResults.forEach(([pair, result]) => {
                totalReturn += result.totalReturnPercent || 0;
                totalTrades += result.totalTrades || 0;
                totalWins += result.winningTrades || 0;
            });
            
            const avgReturn = totalReturn / successfulResults.length;
            const avgWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
            
            console.log(`📊 Portfolio Metrics:`);
            console.log(`   Average Return: ${avgReturn.toFixed(2)}%`);
            console.log(`   Total Trades: ${totalTrades}`);
            console.log(`   Overall Win Rate: ${avgWinRate.toFixed(1)}%`);
            console.log(`   Successful Pairs: ${successfulResults.length}/${pairs.length}`);
            
            console.log(`\n🏆 Best Performers:`);
            successfulResults
                .sort((a, b) => (b[1].totalReturnPercent || 0) - (a[1].totalReturnPercent || 0))
                .slice(0, 3)
                .forEach(([pair, result], index) => {
                    console.log(`   ${index + 1}. ${pair}: ${(result.totalReturnPercent || 0).toFixed(2)}%`);
                });
        }
        
        // Show detailed results for each pair
        console.log(`\n📋 Detailed Results:`);
        Object.entries(results).forEach(([pair, result]) => {
            if (result.error) {
                console.log(`❌ ${pair}: ERROR - ${result.error}`);
            } else {
                console.log(`✅ ${pair}:`);
                console.log(`   Return: ${(result.totalReturnPercent || 0).toFixed(2)}%`);
                console.log(`   Trades: ${result.totalTrades || 0}`);
                console.log(`   Win Rate: ${(result.winRatePercent || 0).toFixed(1)}%`);
                console.log(`   Max Drawdown: ${(result.maxDrawdownPercent || 0).toFixed(2)}%`);
                console.log(`   Sharpe Ratio: ${(result.sharpeRatio || 0).toFixed(3)}`);
            }
        });
        
        console.log('\n🎉 Backtest completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Backtest failed:', error.message);
        process.exit(1);
    }
}

// Run the backtest
runBacktest();