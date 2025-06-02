# trading-bot-backtest - Development Guide

**Repository**: https://github.com/makoshark2001/trading-bot-backtest  
**Port**: 3002  
**Priority**: 3 (Depends on trading-bot-core + trading-bot-ml)

## 🎯 Service Purpose

Historical strategy testing and validation service providing comprehensive backtesting capabilities, performance analytics, and risk management validation. Integrates with both core technical analysis and ML predictions.

## 💬 Chat Instructions for Claude

```
I'm building the backtesting service that tests trading strategies using historical data. This service integrates with both trading-bot-core (technical analysis) and trading-bot-ml (predictions) to validate strategy performance.

Key requirements:
- Historical strategy testing with realistic simulation
- Performance metrics (Sharpe ratio, drawdown, etc.)
- Integration with core service (port 3000) and ML service (port 3001)
- RESTful API on port 3002
- Advanced analytics and reporting
- Support for both technical-only and ML-enhanced strategies

The core and ML services are already running. I need to build a comprehensive backtesting engine.
```

## 📋 Implementation To-Do List

### ✅ Phase 3A: Project Setup & Service Integration

- [ ] **Project Infrastructure**
  - [ ] Initialize Node.js project: `npm init -y`
  - [ ] Install dependencies:
    ```bash
    npm install express axios lodash winston cors dotenv moment
    npm install --save-dev jest nodemon
    ```
  - [ ] Create folder structure:
    ```
    src/
    ├── server/
    ├── backtest/
    ├── analytics/
    ├── services/
    ├── routes/
    └── utils/
    config/
    logs/
    tests/
    ```

- [ ] **Service Integration**
  - [ ] File: `src/services/ServiceClient.js` - Integration with core + ML services
  - [ ] Health monitoring for both dependent services
  - [ ] Fallback mechanisms when services unavailable
  - [ ] Test connectivity with core (3000) and ML (3001)

### ✅ Phase 3B: Backtesting Engine Core

- [ ] **Portfolio Management**
  - [ ] File: `src/backtest/PortfolioManager.js` - Portfolio state tracking
  - [ ] Position tracking (long/short, entry/exit)
  - [ ] Cash management and balance tracking
  - [ ] P&L calculation (realized and unrealized)
  - [ ] Trade history and equity curve generation

- [ ] **Trading Simulation**
  - [ ] File: `src/backtest/BacktestEngine.js` - Main backtesting engine
  - [ ] Trade execution simulation with commissions
  - [ ] Slippage modeling for realistic results
  - [ ] Position sizing with risk management
  - [ ] Stop-loss and take-profit implementation
  - [ ] Order types (market, limit, stop)

- [ ] **Signal Integration**
  - [ ] File: `src/backtest/SignalProcessor.js` - Signal combination logic
  - [ ] Technical signal processing from core service
  - [ ] ML signal integration from ML service
  - [ ] Signal confidence weighting
  - [ ] Ensemble decision making (technical + ML)

### ✅ Phase 3C: Performance Analytics Engine

- [ ] **Core Metrics Calculation**
  - [ ] File: `src/analytics/PerformanceAnalyzer.js` - Main analytics engine
  - [ ] **Return Metrics**:
    - Total return, annualized return
    - Risk-adjusted returns (Sharpe, Sortino, Calmar ratios)
  - [ ] **Risk Metrics**:
    - Maximum drawdown, average drawdown
    - Volatility (daily, weekly, monthly)
    - Value at Risk (VaR), Expected Shortfall
  - [ ] **Trade Analysis**:
    - Win rate, profit factor
    - Average win/loss, largest win/loss
    - Trade frequency and duration analysis

- [ ] **Advanced Analytics**
  - [ ] File: `src/analytics/AdvancedAnalytics.js` - Advanced calculations
  - [ ] Rolling performance windows
  - [ ] Correlation analysis with benchmarks
  - [ ] Performance attribution (technical vs ML)
  - [ ] Risk-adjusted performance metrics
  - [ ] Monthly/quarterly performance breakdown

### ✅ Phase 3D: Backtesting API

- [ ] **API Routes** (Create in `src/routes/`)
  - [ ] `health.js` - GET /api/health (service + dependencies status)
  - [ ] `backtest.js` - POST /api/backtest/:pair (single pair backtest)
  - [ ] `backtest.js` - POST /api/backtest/all (all pairs backtest)  
  - [ ] `pairs.js` - GET /api/pairs (available pairs for backtesting)

- [ ] **Server Setup**
  - [ ] File: `src/server/app.js` - Express server on port 3002
  - [ ] Request validation and sanitization
  - [ ] Async backtest handling (long-running operations)
  - [ ] Progress tracking for batch backtests
  - [ ] Error handling and timeout management

### ✅ Phase 3E: Advanced Features & Testing

- [ ] **Advanced Backtesting Features**
  - [ ] File: `src/backtest/AdvancedBacktest.js` - Enhanced capabilities
  - [ ] Monte Carlo simulation for robustness testing
  - [ ] Walk-forward analysis for out-of-sample validation
  - [ ] Parameter optimization (grid search)
  - [ ] Strategy comparison and ranking

- [ ] **Testing & Validation**
  - [ ] File: `tests/` - Comprehensive test suite
  - [ ] Unit tests for all analytics calculations
  - [ ] Integration tests with core and ML services
  - [ ] Backtest accuracy validation
  - [ ] Performance benchmark tests

- [ ] **Production Features**
  - [ ] Memory management for large backtests
  - [ ] Concurrent backtest handling
  - [ ] Result caching and storage
  - [ ] Comprehensive logging and monitoring

## 📊 Key API Endpoints to Implement

```javascript
// Service health check
GET /api/health
Response: {
  status: "healthy",
  timestamp: 1704067200000,
  services: {
    core: { status: "healthy", error: null },
    ml: { status: "healthy", error: null }
  }
}

// Single pair backtest
POST /api/backtest/:pair
Body: {
  initialBalance: 10000,
  commissionRate: 0.001,
  slippageRate: 0.0005,
  maxPositionSize: 0.15,
  stopLossPercent: 0.05,
  takeProfitPercent: 0.10,
  useMLSignals: true
}
Response: {
  pair: "RVN",
  results: {
    initialBalance: 10000,
    finalBalance: 11250.45,
    totalReturn: 0.125045,
    maxDrawdown: 0.089,
    sharpeRatio: 1.47,
    totalTrades: 23,
    winningTrades: 15,
    winRate: 0.652,
    trades: [...],
    equity: [...],
    timestamps: [...]
  },
  config: { initialBalance: 10000, useMLSignals: true },
  timestamp: 1704067200000
}

// All pairs backtest
POST /api/backtest/all
Body: {
  initialBalance: 10000,
  commissionRate: 0.001,
  useMLSignals: true
}
Response: {
  results: {
    "RVN": { totalReturnPercent: 12.5, winRatePercent: 65.2, sharpeRatio: 1.47 },
    "XMR": { totalReturnPercent: 8.3, winRatePercent: 58.7, sharpeRatio: 1.12 }
  },
  summary: {
    averageReturn: 10.4,
    bestPerformer: "RVN",
    totalPairs: 6,
    successfulPairs: 5
  }
}

// Available pairs
GET /api/pairs
Response: { pairs: ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"] }
```

## 🏗️ Backtesting Engine Architecture

### Core Components:

#### 1. **Portfolio State Management**
```javascript
// Portfolio tracking structure
{
  currentBalance: 10000,           // Available cash
  positions: {                    // Open positions
    "RVN": {
      type: "long",               // "long" or "short"
      size: 4273.5,              // Number of units
      entryPrice: 0.0234,        // Entry price
      entryTime: 1704067200000,  // Entry timestamp
      confidence: 0.73           // Signal confidence
    }
  },
  equity: [10000, 10047.01],     // Portfolio value history
  trades: [],                    // Completed trades
  drawdowns: [0, 0.0047]        // Drawdown history
}
```

#### 2. **Signal Processing**
```javascript
// Signal combination logic
function generateTradingSignal(technicalSignals, mlSignal) {
  let finalSignal = 'hold';
  let confidence = 0;
  
  // Technical analysis ensemble
  const techBuyScore = technicalSignals.buy;
  const techSellScore = technicalSignals.sell;
  
  if (techBuyScore > techSellScore && techBuyScore > 2.0) {
    finalSignal = 'buy';
    confidence = technicalSignals.confidence;
  } else if (techSellScore > techBuyScore && techSellScore > 2.0) {
    finalSignal = 'sell';
    confidence = technicalSignals.confidence;
  }
  
  // ML signal enhancement
  if (mlSignal && mlSignal.confidence > 0.7) {
    if (mlSignal.direction === 'up' && finalSignal !== 'sell') {
      finalSignal = 'buy';
      confidence = Math.max(confidence, mlSignal.confidence);
    } else if (mlSignal.direction === 'down' && finalSignal !== 'buy') {
      finalSignal = 'sell';
      confidence = Math.max(confidence, mlSignal.confidence);
    }
  }
  
  return { action: finalSignal, confidence };
}
```

#### 3. **Risk Management**
```javascript
// Position sizing with risk management
function calculatePositionSize(balance, confidence, maxPositionSize) {
  const baseSize = balance * maxPositionSize;
  const confidenceMultiplier = Math.min(confidence * 2, 1);
  return baseSize * confidenceMultiplier;
}

// Stop-loss and take-profit logic
function checkExitConditions(position, currentPrice, stopLoss, takeProfit) {
  const currentPnl = position.type === 'long' 
    ? (currentPrice - position.entryPrice) / position.entryPrice
    : (position.entryPrice - currentPrice) / position.entryPrice;
  
  if (currentPnl <= -stopLoss) {
    return { action: 'close', reason: 'stop_loss' };
  }
  
  if (currentPnl >= takeProfit) {
    return { action: 'close', reason: 'take_profit' };
  }
  
  return { action: 'hold' };
}
```

## 📈 Performance Metrics Implementation

### Core Metrics to Calculate:

#### 1. **Return Metrics**
```javascript
{
  totalReturn: 0.125,              // 12.5% total return
  totalReturnPercent: 12.5,
  annualizedReturn: 0.287,         // Annualized return
  sharpeRatio: 1.47,               // Risk-adjusted performance
  sortinoRatio: 2.13,              // Downside deviation adjusted
  calmarRatio: 1.41                // Max drawdown adjusted
}
```

#### 2. **Risk Metrics**
```javascript
{
  maxDrawdown: 0.089,              // Maximum drawdown (8.9%)
  maxDrawdownPercent: 8.9,
  averageDrawdown: 0.034,          // Average drawdown
  volatility: 0.156,               // Portfolio volatility
  var_95: -0.045,                  // 95% Value at Risk
  expectedShortfall_95: -0.067     // 95% Expected Shortfall
}
```

#### 3. **Trade Analysis**
```javascript
{
  totalTrades: 23,
  winningTrades: 15,
  losingTrades: 8,
  winRate: 0.652,                  // 65.2% win rate
  winRatePercent: 65.2,
  avgWin: 125.30,                  // Average winning trade
  avgLoss: -87.45,                 // Average losing trade
  profitFactor: 1.43,              // Gross profit / Gross loss
  largestWin: 245.67,              // Largest winning trade
  largestLoss: -156.23,            // Largest losing trade
  averageTradeLength: 4.2,         // Average hours per trade
  expectancy: 0.087                // Expected value per trade
}
```

## ⚙️ Configuration Requirements

### Environment Variables (.env)
```bash
# Backtesting Service Configuration
PORT=3002
NODE_ENV=development

# Service URLs
CORE_SERVICE_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:3001

# Backtesting Defaults
DEFAULT_INITIAL_BALANCE=10000
DEFAULT_COMMISSION_RATE=0.001
DEFAULT_SLIPPAGE_RATE=0.0005
DEFAULT_MAX_POSITION_SIZE=0.15
DEFAULT_STOP_LOSS_PERCENT=0.05
DEFAULT_TAKE_PROFIT_PERCENT=0.10

# Performance Settings
MAX_CONCURRENT_BACKTESTS=3
BACKTEST_TIMEOUT_MS=300000
```

### Backtest Configuration Options
```javascript
{
  // Portfolio settings
  initialBalance: 10000,           // Starting capital
  maxPositionSize: 0.15,          // Maximum 15% per position
  
  // Trading costs
  commissionRate: 0.001,          // 0.1% commission per trade
  slippageRate: 0.0005,           // 0.05% slippage
  
  // Risk management
  stopLossPercent: 0.05,          // 5% stop loss
  takeProfitPercent: 0.10,        // 10% take profit
  
  // Signal configuration
  useMLSignals: true,             // Include ML predictions
  mlConfidenceThreshold: 0.6,     // Minimum ML confidence
  technicalConfidenceThreshold: 0.6, // Minimum technical confidence
  
  // Strategy weights
  strategyWeights: {
    rsi: 1.0,
    macd: 1.2,
    bollinger: 1.0,
    ml: 1.5
  }
}
```

## 🧪 Testing & Validation

```bash
# Test commands to implement
npm run test:connectivity    # Service integration tests
npm run test:backtest       # Backtesting engine tests
npm run test:analytics      # Performance metrics tests
npm run test:all            # Comprehensive test suite

# Health verification
curl http://localhost:3002/api/health
curl http://localhost:3002/api/pairs

# Test backtest execution
curl -X POST http://localhost:3002/api/backtest/RVN \
  -H "Content-Type: application/json" \
  -d '{"initialBalance": 10000, "useMLSignals": true}'
```

## 📊 Performance Benchmarks

- **Single Pair Backtest**: <30 seconds
- **All Pairs Backtest**: <3 minutes  
- **Memory Usage**: <500MB during execution
- **API Response Time**: <5 seconds for single pair
- **Concurrent Backtests**: Up to 3 simultaneously

## 🔗 Integration Points

**Consumes from:**
- trading-bot-core (Port 3000) - Technical analysis and market data
- trading-bot-ml (Port 3001) - ML predictions for enhanced strategies

**Provides to:**
- trading-bot-risk (Port 3003) - Strategy validation for risk assessment
- trading-bot-execution (Port 3004) - Strategy validation before live trading
- trading-bot-dashboard (Port 3005) - Backtest results for visualization

## ✅ Success Criteria

**Phase 3A Complete When:**
- Service successfully connects to both core and ML services
- Health checks show all dependencies operational

**Phase 3B Complete When:**
- Backtesting engine accurately simulates trades
- Portfolio tracking correctly calculates P&L and equity curves
- Signal integration combines technical and ML signals effectively

**Phase 3C Complete When:**
- All performance metrics calculate correctly
- Risk-adjusted returns match financial standards
- Advanced analytics provide meaningful insights

**Phase 3D Complete When:**
- All API endpoints return properly formatted results
- Single and batch backtests complete successfully
- Error handling manages timeouts and failures gracefully

**Phase 3E Complete When:**
- Test suite validates all calculations
- Performance benchmarks achieved
- Advanced features (Monte Carlo, walk-forward) operational

## 🚨 Common Issues & Solutions

### 1. **Insufficient Historical Data**
```bash
# Check data availability in core service
curl http://localhost:3000/api/pair/RVN | jq '.history.closes | length'
# Should have 100+ data points for meaningful backtest
```

### 2. **Service Connectivity**
```bash
# Test core service connection
curl http://localhost:3000/api/health

# Test ML service connection  
curl http://localhost:3001/api/health

# Check backtest service logs for integration errors
tail -f logs/backtest-error.log | grep -E "(core|ml)"
```

### 3. **Performance Issues**
- Monitor memory usage during large backtests
- Implement data trimming for memory management
- Use concurrent processing for batch backtests
- Add progress tracking for long-running operations

---

*Save this file as `DEVELOPMENT_GUIDE.md` in the trading-bot-backtest repository root*