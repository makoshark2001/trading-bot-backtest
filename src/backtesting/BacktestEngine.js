const { Logger } = require('../utils');
const _ = require('lodash');
const moment = require('moment');

class BacktestEngine {
    constructor(config = {}) {
        this.config = {
            initialBalance: config.initialBalance || 10000,
            commissionRate: config.commissionRate || 0.001, // 0.1%
            slippageRate: config.slippageRate || 0.0005, // 0.05%
            maxPositionSize: config.maxPositionSize || 0.1, // 10% of portfolio
            stopLossPercent: config.stopLossPercent || 0.05, // 5%
            takeProfitPercent: config.takeProfitPercent || 0.10, // 10%
            ...config
        };
        
        this.reset();
        
        Logger.info('BacktestEngine initialized', {
            initialBalance: this.config.initialBalance,
            commissionRate: this.config.commissionRate,
            slippageRate: this.config.slippageRate
        });
    }
    
    reset() {
        this.currentBalance = this.config.initialBalance;
        this.positions = {}; // { pair: { size, entryPrice, entryTime, type } }
        this.trades = [];
        this.equity = [this.config.initialBalance];
        this.timestamps = [];
        this.drawdowns = [];
        this.maxDrawdown = 0;
        this.peakEquity = this.config.initialBalance;
    }
    
    // Run backtest with historical data and strategies
    async runBacktest(pair, historicalData, strategies, mlPredictions = null) {
        try {
            Logger.info(`Starting backtest for ${pair}`, {
                dataPoints: historicalData.history.closes.length,
                hasMLPredictions: !!mlPredictions
            });
            
            this.reset();
            
            const { closes, highs, lows, volumes, timestamps } = historicalData.history;
            
            if (!closes || closes.length < 50) {
                throw new Error(`Insufficient historical data for ${pair}`);
            }
            
            // Process each time point
            for (let i = 1; i < closes.length; i++) {
                const currentPrice = closes[i];
                const currentTime = timestamps[i];
                
                // Get strategy signals for current point
                const signals = this.extractSignalsAtPoint(strategies, i);
                
                // Get ML prediction if available
                const mlSignal = mlPredictions ? this.extractMLSignalAtPoint(mlPredictions, i) : null;
                
                // Generate trading signal
                const tradingSignal = this.generateTradingSignal(signals, mlSignal);
                
                // Execute trades based on signal
                await this.processTradingSignal(pair, tradingSignal, currentPrice, currentTime, i);
                
                // Update portfolio metrics
                this.updatePortfolioMetrics(currentPrice, currentTime);
                
                // Check stop-loss and take-profit
                this.checkExitConditions(pair, currentPrice, currentTime);
            }
            
            // Close any remaining positions
            this.closeAllPositions(pair, closes[closes.length - 1], timestamps[timestamps.length - 1]);
            
            // Calculate final metrics
            const results = this.calculateResults();
            
            Logger.info(`Backtest completed for ${pair}`, {
                totalTrades: this.trades.length,
                finalBalance: this.currentBalance,
                totalReturn: results.totalReturn,
                sharpeRatio: results.sharpeRatio
            });
            
            return results;
            
        } catch (error) {
            Logger.error(`Backtest failed for ${pair}`, {
                error: error.message,
                pair
            });
            throw error;
        }
    }
    
    extractSignalsAtPoint(strategies, index) {
        const signals = {
            buy: 0,
            sell: 0,
            hold: 0,
            confidence: 0
        };
        
        let totalConfidence = 0;
        let signalCount = 0;
        
        // Note: In a real implementation, you'd need to recalculate indicators
        // up to the current point to avoid look-ahead bias
        Object.entries(strategies).forEach(([indicator, data]) => {
            if (data && !data.error && data.suggestion) {
                signalCount++;
                const confidence = data.confidence || 0;
                totalConfidence += confidence;
                
                if (data.suggestion === 'buy') {
                    signals.buy += confidence;
                } else if (data.suggestion === 'sell') {
                    signals.sell += confidence;
                } else {
                    signals.hold += confidence;
                }
            }
        });
        
        signals.confidence = signalCount > 0 ? totalConfidence / signalCount : 0;
        
        return signals;
    }
    
    extractMLSignalAtPoint(mlPredictions, index) {
        // Simplified ML signal extraction
        // In practice, you'd need historical ML predictions
        if (!mlPredictions || !mlPredictions.predictions) {
            return null;
        }
        
        return {
            direction: mlPredictions.predictions.price_direction,
            confidence: mlPredictions.predictions.confidence || 0
        };
    }
    
    generateTradingSignal(signals, mlSignal) {
        let finalSignal = 'hold';
        let confidence = signals.confidence;
        
        // Combine technical analysis signals
        const buyScore = signals.buy;
        const sellScore = signals.sell;
        
        if (buyScore > sellScore && buyScore > 2.0) {
            finalSignal = 'buy';
        } else if (sellScore > buyScore && sellScore > 2.0) {
            finalSignal = 'sell';
        }
        
        // Enhance with ML signal if available
        if (mlSignal && mlSignal.confidence > 0.7) {
            if (mlSignal.direction === 'up' && finalSignal !== 'sell') {
                finalSignal = 'buy';
                confidence = Math.max(confidence, mlSignal.confidence);
            } else if (mlSignal.direction === 'down' && finalSignal !== 'buy') {
                finalSignal = 'sell';
                confidence = Math.max(confidence, mlSignal.confidence);
            }
        }
        
        return {
            action: finalSignal,
            confidence: confidence,
            buyScore: buyScore,
            sellScore: sellScore,
            mlSignal: mlSignal
        };
    }
    
    async processTradingSignal(pair, signal, price, timestamp, index) {
        const hasPosition = this.positions[pair];
        
        if (signal.action === 'buy' && !hasPosition && signal.confidence > 0.6) {
            await this.openPosition(pair, 'long', price, timestamp, signal.confidence);
        } else if (signal.action === 'sell' && !hasPosition && signal.confidence > 0.6) {
            await this.openPosition(pair, 'short', price, timestamp, signal.confidence);
        } else if (hasPosition && signal.action !== hasPosition.type) {
            // Close position if signal contradicts current position
            await this.closePosition(pair, price, timestamp, 'signal_change');
        }
    }
    
    async openPosition(pair, type, price, timestamp, confidence) {
        const positionSize = this.calculatePositionSize(confidence);
        const adjustedPrice = this.applySlippage(price, type);
        const commission = positionSize * adjustedPrice * this.config.commissionRate;
        
        if (positionSize + commission > this.currentBalance) {
            Logger.warn(`Insufficient balance for position`, {
                pair,
                required: positionSize + commission,
                available: this.currentBalance
            });
            return;
        }
        
        this.positions[pair] = {
            type: type,
            size: positionSize / adjustedPrice, // Number of units
            entryPrice: adjustedPrice,
            entryTime: timestamp,
            confidence: confidence
        };
        
        this.currentBalance -= (positionSize + commission);
        
        Logger.debug(`Opened ${type} position for ${pair}`, {
            price: adjustedPrice,
            size: positionSize,
            commission: commission,
            confidence: confidence
        });
    }
    
    async closePosition(pair, price, timestamp, reason = 'manual') {
        const position = this.positions[pair];
        if (!position) return;
        
        const adjustedPrice = this.applySlippage(price, position.type === 'long' ? 'sell' : 'buy');
        const positionValue = position.size * adjustedPrice;
        const commission = positionValue * this.config.commissionRate;
        
        let pnl = 0;
        if (position.type === 'long') {
            pnl = (adjustedPrice - position.entryPrice) * position.size;
        } else {
            pnl = (position.entryPrice - adjustedPrice) * position.size;
        }
        
        const netPnl = pnl - commission;
        this.currentBalance += positionValue - commission;
        
        // Record trade
        this.trades.push({
            pair: pair,
            type: position.type,
            entryPrice: position.entryPrice,
            exitPrice: adjustedPrice,
            entryTime: position.entryTime,
            exitTime: timestamp,
            size: position.size,
            pnl: netPnl,
            pnlPercent: (netPnl / (position.entryPrice * position.size)) * 100,
            commission: commission,
            reason: reason,
            confidence: position.confidence
        });
        
        delete this.positions[pair];
        
        Logger.debug(`Closed ${position.type} position for ${pair}`, {
            entryPrice: position.entryPrice,
            exitPrice: adjustedPrice,
            pnl: netPnl,
            reason: reason
        });
    }
    
    calculatePositionSize(confidence) {
        // Risk-based position sizing
        const baseSize = this.currentBalance * this.config.maxPositionSize;
        const confidenceMultiplier = Math.min(confidence * 2, 1); // Scale by confidence
        return baseSize * confidenceMultiplier;
    }
    
    applySlippage(price, side) {
        const slippage = this.config.slippageRate;
        if (side === 'buy' || side === 'long') {
            return price * (1 + slippage);
        } else {
            return price * (1 - slippage);
        }
    }
    
    updatePortfolioMetrics(currentPrice, timestamp) {
        // Calculate current equity (balance + position values)
        let positionValue = 0;
        Object.entries(this.positions).forEach(([pair, position]) => {
            const value = position.size * currentPrice; // Simplified - use current price for all pairs
            positionValue += value;
        });
        
        const currentEquity = this.currentBalance + positionValue;
        this.equity.push(currentEquity);
        this.timestamps.push(timestamp);
        
        // Update drawdown metrics
        if (currentEquity > this.peakEquity) {
            this.peakEquity = currentEquity;
        }
        
        const drawdown = (this.peakEquity - currentEquity) / this.peakEquity;
        this.drawdowns.push(drawdown);
        this.maxDrawdown = Math.max(this.maxDrawdown, drawdown);
    }
    
    checkExitConditions(pair, currentPrice, timestamp) {
        const position = this.positions[pair];
        if (!position) return;
        
        const currentPnl = position.type === 'long' 
            ? (currentPrice - position.entryPrice) / position.entryPrice
            : (position.entryPrice - currentPrice) / position.entryPrice;
        
        // Check stop-loss
        if (currentPnl <= -this.config.stopLossPercent) {
            this.closePosition(pair, currentPrice, timestamp, 'stop_loss');
            return;
        }
        
        // Check take-profit
        if (currentPnl >= this.config.takeProfitPercent) {
            this.closePosition(pair, currentPrice, timestamp, 'take_profit');
            return;
        }
    }
    
    closeAllPositions(pair, finalPrice, finalTimestamp) {
        if (this.positions[pair]) {
            this.closePosition(pair, finalPrice, finalTimestamp, 'backtest_end');
        }
    }
    
    calculateResults() {
        const finalEquity = this.equity[this.equity.length - 1] || this.config.initialBalance;
        const totalReturn = (finalEquity - this.config.initialBalance) / this.config.initialBalance;
        
        const winningTrades = this.trades.filter(t => t.pnl > 0);
        const losingTrades = this.trades.filter(t => t.pnl < 0);
        
        const winRate = this.trades.length > 0 ? winningTrades.length / this.trades.length : 0;
        const avgWin = winningTrades.length > 0 ? _.mean(winningTrades.map(t => t.pnl)) : 0;
        const avgLoss = losingTrades.length > 0 ? _.mean(losingTrades.map(t => t.pnl)) : 0;
        const profitFactor = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0;
        
        // Calculate Sharpe ratio (simplified)
        const returns = [];
        for (let i = 1; i < this.equity.length; i++) {
            returns.push((this.equity[i] - this.equity[i-1]) / this.equity[i-1]);
        }
        
        const avgReturn = _.mean(returns);
        const stdReturn = returns.length > 1 ? this.calculateStandardDeviation(returns) : 0;
        const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0; // Annualized
        
        return {
            // Performance Metrics
            initialBalance: this.config.initialBalance,
            finalBalance: finalEquity,
            totalReturn: totalReturn,
            totalReturnPercent: totalReturn * 100,
            
            // Risk Metrics
            maxDrawdown: this.maxDrawdown,
            maxDrawdownPercent: this.maxDrawdown * 100,
            sharpeRatio: sharpeRatio,
            
            // Trade Metrics
            totalTrades: this.trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: winRate,
            winRatePercent: winRate * 100,
            
            // Profit Metrics
            avgWin: avgWin,
            avgLoss: avgLoss,
            profitFactor: profitFactor,
            
            // Detailed Data
            trades: this.trades,
            equity: this.equity,
            timestamps: this.timestamps,
            drawdowns: this.drawdowns
        };
    }
    
    calculateStandardDeviation(values) {
        const mean = _.mean(values);
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquaredDiff = _.mean(squaredDiffs);
        return Math.sqrt(avgSquaredDiff);
    }
}

module.exports = BacktestEngine;