const express = require('express');
const path = require('path');
const { Logger } = require('../utils');
const ServiceClient = require('../data/ServiceClient');
const BacktestEngine = require('../backtesting/BacktestEngine');

class BacktestServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3002;
        this.serviceClient = new ServiceClient();
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // CORS for development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/api/health', async (req, res) => {
            try {
                const servicesHealth = await this.serviceClient.checkServicesHealth();
                
                res.json({
                    status: 'healthy',
                    timestamp: Date.now(),
                    services: servicesHealth
                });
            } catch (error) {
                res.status(500).json({
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        });
        
        // Run backtest for a specific pair
        this.app.post('/api/backtest/:pair', async (req, res) => {
            try {
                const { pair } = req.params;
                const config = req.body || {};
                
                Logger.info(`Starting backtest for ${pair}`, { config });
                
                // Get historical data and strategies
                const historicalData = await this.serviceClient.getHistoricalData(pair);
                
                // Get ML predictions (optional)
                const mlPredictions = await this.serviceClient.getMLPredictions(pair);
                
                // Run backtest
                const backtestEngine = new BacktestEngine(config);
                const results = await backtestEngine.runBacktest(
                    pair, 
                    historicalData, 
                    historicalData.strategies,
                    mlPredictions
                );
                
                res.json({
                    pair,
                    results,
                    config,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                Logger.error(`Backtest failed for ${req.params.pair}`, {
                    error: error.message,
                    pair: req.params.pair
                });
                
                res.status(500).json({
                    error: error.message,
                    pair: req.params.pair,
                    timestamp: Date.now()
                });
            }
        });
        
        // Run backtests for all available pairs
        this.app.post('/api/backtest/all', async (req, res) => {
            try {
                const config = req.body || {};
                
                Logger.info('Starting backtests for all pairs', { config });
                
                const pairs = await this.serviceClient.getAvailablePairs();
                const results = {};
                
                for (const pair of pairs) {
                    try {
                        Logger.info(`Running backtest for ${pair}`);
                        
                        const historicalData = await this.serviceClient.getHistoricalData(pair);
                        const mlPredictions = await this.serviceClient.getMLPredictions(pair);
                        
                        const backtestEngine = new BacktestEngine(config);
                        results[pair] = await backtestEngine.runBacktest(
                            pair,
                            historicalData,
                            historicalData.strategies,
                            mlPredictions
                        );
                        
                    } catch (error) {
                        Logger.error(`Backtest failed for ${pair}`, { error: error.message });
                        results[pair] = { error: error.message };
                    }
                }
                
                res.json({
                    results,
                    config,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                Logger.error('Batch backtest failed', { error: error.message });
                
                res.status(500).json({
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        });
        
        // Get available pairs
        this.app.get('/api/pairs', async (req, res) => {
            try {
                const pairs = await this.serviceClient.getAvailablePairs();
                res.json({ pairs });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, (err) => {
                if (err) {
                    return reject(err);
                }
                
                Logger.info(`Backtest Server running at http://localhost:${this.port}`);
                console.log(`🚀 Backtest Service available at: http://localhost:${this.port}`);
                console.log(`📊 API endpoints:`);
                console.log(`   POST /api/backtest/:pair - Run backtest for specific pair`);
                console.log(`   POST /api/backtest/all - Run backtests for all pairs`);
                console.log(`   GET /api/health - Service health check`);
                
                resolve();
            });
        });
    }
    
    async stop() {
        if (this.server) {
            this.server.close();
            Logger.info('Backtest Server stopped');
        }
    }
}

module.exports = BacktestServer;