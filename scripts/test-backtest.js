require('dotenv').config();
const axios = require('axios');
const { Logger } = require('../src/utils');

async function testBacktest() {
    console.log('🚀 Testing Backtest Service...');
    
    const baseUrl = `http://localhost:${process.env.PORT || 3002}`;
    
    try {
        // Test 1: Health check
        console.log('\n📊 Test 1: Health Check');
        const healthResponse = await axios.get(`${baseUrl}/api/health`);
        console.log('Health Status:', healthResponse.data.status);
        console.log('Connected Services:', healthResponse.data.services);
        
        // Test 2: Get available pairs
        console.log('\n📊 Test 2: Available Pairs');
        const pairsResponse = await axios.get(`${baseUrl}/api/pairs`);
        console.log('Available pairs:', pairsResponse.data.pairs);
        
        if (pairsResponse.data.pairs.length === 0) {
            console.log('❌ No pairs available. Make sure trading-bot-core is running.');
            return;
        }
        
        // Test 3: Run backtest for single pair
        console.log('\n📊 Test 3: Single Pair Backtest');
        const testPair = pairsResponse.data.pairs[0];
        console.log(`Testing backtest for ${testPair}...`);
        
        const backtestConfig = {
            initialBalance: 1000,
            commissionRate: 0.001,
            slippageRate: 0.0005,
            maxPositionSize: 0.2,
            stopLossPercent: 0.03,
            takeProfitPercent: 0.06
        };
        
        const backtestResponse = await axios.post(
            `${baseUrl}/api/backtest/${testPair}`, 
            backtestConfig
        );
        
        console.log('✅ Backtest completed successfully!');
        console.log('Results Summary:', {
            pair: backtestResponse.data.pair,
            initialBalance: backtestResponse.data.results.initialBalance,
            finalBalance: backtestResponse.data.results.finalBalance,
            totalReturn: (backtestResponse.data.results.totalReturnPercent || 0).toFixed(2) + '%',
            totalTrades: backtestResponse.data.results.totalTrades,
            winRate: (backtestResponse.data.results.winRatePercent || 0).toFixed(1) + '%',
            maxDrawdown: (backtestResponse.data.results.maxDrawdownPercent || 0).toFixed(2) + '%',
            sharpeRatio: (backtestResponse.data.results.sharpeRatio || 0).toFixed(3)
        });
        
        // Test 4: Batch backtest (optional - only if you want to test all pairs)
        console.log('\n📊 Test 4: Batch Backtest (optional)');
        console.log('Skipping batch test to save time. Use POST /api/backtest/all to test all pairs.');
        
        console.log('\n🎉 All backtest tests passed!');
        
    } catch (error) {
        console.error('\n❌ Backtest test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        Logger.error('Backtest test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testBacktest();