# Trading Bot Backtest Service

Historical backtesting and strategy optimization service for the modular trading bot architecture.

## 🚀 Features

- **Historical Strategy Testing**: Test technical analysis and ML strategies against historical data
- **Performance Analytics**: Comprehensive metrics including Sharpe ratio, win rate, drawdown analysis
- **Risk Management**: Built-in stop-loss, take-profit, and position sizing
- **Service Integration**: Seamlessly connects to trading-bot-core and trading-bot-ml
- **RESTful API**: Easy-to-use HTTP endpoints for backtesting

## 📊 Metrics Calculated

### Performance Metrics
- Total Return & Return Percentage
- Initial vs Final Balance
- Sharpe Ratio (risk-adjusted returns)

### Risk Metrics
- Maximum Drawdown
- Drawdown Analysis
- Position Sizing Controls

### Trade Analysis
- Total Trades & Win Rate
- Average Win vs Average Loss
- Profit Factor
- Trade Distribution Analysis

## 🛠️ Setup

### Prerequisites
- Node.js >= 16.0.0
- trading-bot-core running on port 3000
- trading-bot-ml running on port 3001 (optional)

### Installation

1. **Clone and setup**:
```bash
git clone <repository-url>
cd trading-bot-backtest
npm install