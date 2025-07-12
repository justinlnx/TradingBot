// trade_agent.js
// Day trading agent for $OSCR using Alpha Vantage API
const { AzureOpenAI } = require("openai");
const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk');
const readline = require('readline');

// === CONFIG ===
const ALPHA_VANTAGE_API_KEY = '<ALPHA_VANTAGE_API_KEY>'; // UIULHPZFY37DBI0W
const SYMBOL = 'OSCR';
const BASE_URL = 'https://www.alphavantage.co/query';

const AZURE_OPENAI_API_KEY = '<OPEN_API_KEY>'; // Replace with your OpenAI API key
const AZURE_OPENAI_MODEL = 'gpt-4o'; // Model to use for LLM decision making
const AZURE_OPENAI_ENDPOINT = 'https://models.inference.ai.azure.com';

// === Fetch Current Price ===
async function fetchCurrentPrice() {
  const url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${SYMBOL}&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const res = await axios.get(url);
  const data = res.data['Time Series (5min)'];
  if (!data) return null;
  const latest = Object.keys(data)[0];
  return { time: latest, price: data[latest]['4. close'] };
}

async function fetchTechnicalIndicators() {
  const rsiUrl = `${BASE_URL}?function=RSI&symbol=${SYMBOL}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const sma50Url = `${BASE_URL}?function=SMA&symbol=${SYMBOL}&interval=daily&time_period=50&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const sma200Url = `${BASE_URL}?function=SMA&symbol=${SYMBOL}&interval=daily&time_period=200&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const macdUrl = `${BASE_URL}?function=MACD&symbol=${SYMBOL}&interval=daily&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const bbandsUrl = `${BASE_URL}?function=BBANDS&symbol=${SYMBOL}&interval=daily&time_period=20&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;

  const [rsiRes, sma50Res, sma200Res, macdRes, bbandsRes] = await Promise.all([
    axios.get(rsiUrl),
    axios.get(sma50Url),
    axios.get(sma200Url),
    axios.get(macdUrl),
    axios.get(bbandsUrl)
  ]);

  const rsiData = rsiRes.data['Technical Analysis: RSI'];
  const sma50Data = sma50Res.data['Technical Analysis: SMA'];
  const sma200Data = sma200Res.data['Technical Analysis: SMA'];
  const macdData = macdRes.data['Technical Analysis: MACD'];
  const bbandsData = bbandsRes.data['Technical Analysis: BBANDS'];

  const latestRSIKey = rsiData ? Object.keys(rsiData)[0] : null;
  const latestSMA50Key = sma50Data ? Object.keys(sma50Data)[0] : null;
  const latestSMA200Key = sma200Data ? Object.keys(sma200Data)[0] : null;
  const latestMACDKey = macdData ? Object.keys(macdData)[0] : null;
  const latestBBANDSKey = bbandsData ? Object.keys(bbandsData)[0] : null;

  const latestRSI = latestRSIKey ? rsiData[latestRSIKey]['RSI'] : null;
  const latestSMA50 = latestSMA50Key ? sma50Data[latestSMA50Key]['SMA'] : null;
  const latestSMA200 = latestSMA200Key ? sma200Data[latestSMA200Key]['SMA'] : null;
  const latestMACDLine = latestMACDKey ? macdData[latestMACDKey]['MACD'] : null;
  const latestMACDSignal = latestMACDKey ? macdData[latestMACDKey]['MACD_Signal'] : null;
  const latestBBANDSUpper = latestBBANDSKey ? bbandsData[latestBBANDSKey]['Real Upper Band'] : null;
  const latestBBANDSLower = latestBBANDSKey ? bbandsData[latestBBANDSKey]['Real Lower Band'] : null;

  return {
    sma50: latestSMA50,
    sma200: latestSMA200,
    rsi: latestRSI,
    macd_line: latestMACDLine,
    macd_signal: latestMACDSignal,
    bollinger_upper: latestBBANDSUpper,
    bollinger_lower: latestBBANDSLower
  };
}

// === Fetch Fundamentals ===
async function fetchFundamentals() {
  const url = `${BASE_URL}?function=OVERVIEW&symbol=${SYMBOL}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const res = await axios.get(url);
  return res.data;
}

// === Fetch News & Sentiment ===
async function fetchNews() {
  const url = `${BASE_URL}?function=NEWS_SENTIMENT&tickers=${SYMBOL}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const res = await axios.get(url);
  return res.data;
}

async function runAgent() {
  console.log(chalk.yellow(`Fetching data for $${SYMBOL}...`));
//   const priceData = await fetchCurrentPrice();
//   const techData = await fetchTechnicalIndicators();
//   const fundamentals = await fetchFundamentals();
//   const news = await fetchNews();
    const priceData = {
    "time": "2025-07-10 19:55:00",
    "price": "15.8600"
    };
    const techData = {
    "sma50": "16.1104",
    "sma200": "15.5201",
    "rsi": "38.7139",
    "macd_line": null,
    "macd_signal": null,
    "bollinger_upper": "22.6844",
    "bollinger_lower": "12.7346"
    };
    const fundamentals = {
    "Symbol": "OSCR",
    "Name": "Oscar Health Inc",
    "Sector": "FINANCE",
    "Industry": "HOSPITAL & MEDICAL SERVICE PLANS",
    "FiscalYearEnd": "December",
    "LatestQuarter": "2025-03-31",
    "MarketCapitalization": "3819852000",
    "EBITDA": "199894000",
    "PERatio": "38.83",
    "PEGRatio": "None",
    "BookValue": "5.26",
    "EPS": "0.4",
    "RevenuePerShareTTM": "41.09",
    "ProfitMargin": "0.0122",
    "OperatingMarginTTM": "0.0975",
    "ReturnOnAssetsTTM": "0.0206",
    "ReturnOnEquityTTM": "0.105",
    "RevenueTTM": "10081522000",
    "GrossProfitTTM": "2044056000",
    "DilutedEPSTTM": "0.4",
    "QuarterlyEarningsGrowthYOY": "0.472",
    "QuarterlyRevenueGrowthYOY": "0.422",
    "AnalystTargetPrice": "17.49",
    "AnalystRatingStrongBuy": "2",
    "AnalystRatingBuy": "2",
    "AnalystRatingHold": "2",
    "AnalystRatingSell": "1",
    "AnalystRatingStrongSell": "1",
    "TrailingPE": "38.83",
    "ForwardPE": "22.57",
    "52WeekHigh": "23.79",
    "52WeekLow": "11.2",
    "50DayMovingAverage": "16.09",
    "200DayMovingAverage": "15.56",
    "PercentInsiders": "4.125",
    "PercentInstitutions": "86.779",
    };

  console.log(chalk.blue.bold(`Grounding data for analysis...`));
  console.log(chalk.blue.bold(`Current Price:`), priceData);
  console.log(chalk.blue.bold(`Technical Indicators:`), techData);
  console.log(chalk.blue.bold(`Fundamentals:`), fundamentals);
//   console.log(chalk.blue.bold(`News:`), news);

  // Write data to local text file
//   const output = [
//     `Current Price: ${JSON.stringify(priceData, null, 2)}`,
//     `Technical Indicators: ${JSON.stringify(techData, null, 2)}`,
//     `Fundamentals: ${JSON.stringify(fundamentals, null, 2)}`,
//     `News: ${JSON.stringify(news, null, 2)}`
//   ].join('\n\n');

//   fs.writeFileSync('oscr_agent_output.txt', output);

  const client = new AzureOpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    model: AZURE_OPENAI_MODEL,
    apiVersion: '2024-10-21'
  });

  console.log(chalk.yellow.bold(`Analyzing ${SYMBOL}...`));

  const history = [
      {
        role: 'system',
        content: `
          You are an expert day trading assistant specializing in the stock market.
          Your goal is to provide concise, actionable trading insights and signals (BUY, SELL, HOLD) for the stock symbol 'GOOG'.
          You will analyze real-time market data, technical indicators, fundamental news, and general market sentiment.
          Always prioritize risk management and caution. Never provide financial advice for real money.
          Your recommendations are for illustrative and educational purposes only.
          When generating a trading signal, always provide a clear rationale based on the data provided.
          If information is insufficient to make a confident recommendation, state that.
          `
      },
      // - MACD Line: ${techData.macd_line}, MACD Signal Line: ${techData.macd_signal} // need premium access to get MACD data
      // - What does the MACD crossover (if any) suggest?
      {
        role: 'user',
        content: `
          Based on the following technical indicators for ${SYMBOL} (1-day timeframe):
          - Current Price: ${priceData.price}
          - Current Date: ${priceData.time}
          - 50-day Simple Moving Average (SMA50): ${techData.sma50}
          - 200-day Simple Moving Average (SMA200): ${techData.sma200}
          - Relative Strength Index (RSI): ${techData.rsi}
          - Bollinger Bands: Upper ${techData.bollinger_upper}, Lower ${techData.bollinger_lower}

          Analyze these indicators.
          - Is ${SYMBOL} currently above or below its short-term and long-term moving averages? What does this suggest about its trend?
          - Is the RSI indicating overbought, oversold, or neutral conditions?
          - How does the current price relate to the Bollinger Bands? Does it suggest high or low volatility?

          Conclude with a brief summary of the technical outlook for ${SYMBOL}.
          
          Finally, suggest a trading signal (BUY, SELL, HOLD) based on the analysis, and the target price to aim for if applicable.
          If the data is insufficient to make a confident recommendation, state that clearly.
        `
      }
    ];

  const result = await client.chat.completions.create({
    messages: history,
    model: AZURE_OPENAI_MODEL,
  })

  for (const choice of result.choices) {
    const response = choice.message.content;
    console.log(chalk.green(response));

    history.push(choice.message);
    console.log(chalk.blue.bold(`Updated chat history with response from AI.`));
  }

  // Enable chat loop
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  async function chatLoop() {
    rl.question(chalk.cyan('\nEnter a prompt or question (type "end" to exit): '), async (userInput) => {
      if (userInput.trim().toLowerCase() === 'end') {
        rl.close();
        return;
      }

      history.push({ role: 'user', content: userInput });
      const chatResult = await client.chat.completions.create({
        messages: history,
        model: AZURE_OPENAI_MODEL,
      });
      for (const choice of chatResult.choices) {
        const response = choice.message.content;
        console.log(chalk.green(response));
        history.push(choice.message);
        console.log(chalk.blue.bold(`Updated chat history with response from AI.`));
      }
      chatLoop();
    });
  }

  chatLoop();
}

runAgent();
