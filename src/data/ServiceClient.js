const axios = require('axios');
const { Logger } = require('../utils');

class ServiceClient {
    constructor() {
        this.coreServiceUrl = process.env.CORE_SERVICE_URL || 'http://localhost:3000';
        this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:3001';
        
        this.coreClient = axios.create({
            baseURL: this.coreServiceUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        this.mlClient = axios.create({
            baseURL: this.mlServiceUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        Logger.info('ServiceClient initialized', {
            coreServiceUrl: this.coreServiceUrl,
            mlServiceUrl: this.mlServiceUrl
        });
    }
    
    // Get historical data and technical indicators from core service
    async getHistoricalData(pair) {
        try {
            Logger.debug(`Fetching historical data for ${pair}`);
            
            const response = await this.coreClient.get(`/api/pair/${pair}`);
            
            if (!response.data || !response.data.history) {
                throw new Error(`No historical data available for ${pair}`);
            }
            
            return response.data;
            
        } catch (error) {
            Logger.error(`Failed to fetch historical data for ${pair}`, {
                error: error.message,
                pair
            });
            throw error;
        }
    }
    
    // Get ML predictions from ML service
    async getMLPredictions(pair) {
        try {
            Logger.debug(`Fetching ML predictions for ${pair}`);
            
            const response = await this.mlClient.get(`/api/predictions/${pair}`);
            
            return response.data;
            
        } catch (error) {
            Logger.warn(`Failed to fetch ML predictions for ${pair}`, {
                error: error.message,
                pair
            });
            // Return null instead of throwing - ML predictions are optional
            return null;
        }
    }
    
    // Get all available pairs from core service
    async getAvailablePairs() {
        try {
            const response = await this.coreClient.get('/api/data');
            return response.data.pairs || [];
            
        } catch (error) {
            Logger.error('Failed to fetch available pairs', {
                error: error.message
            });
            throw error;
        }
    }
    
    // Health check for connected services
    async checkServicesHealth() {
        const health = {
            core: { status: 'unknown', error: null },
            ml: { status: 'unknown', error: null }
        };
        
        // Check core service
        try {
            await this.coreClient.get('/api/health');
            health.core.status = 'healthy';
        } catch (error) {
            health.core.status = 'unhealthy';
            health.core.error = error.message;
        }
        
        // Check ML service
        try {
            await this.mlClient.get('/api/health');
            health.ml.status = 'healthy';
        } catch (error) {
            health.ml.status = 'unhealthy';
            health.ml.error = error.message;
        }
        
        return health;
    }
}

module.exports = ServiceClient;