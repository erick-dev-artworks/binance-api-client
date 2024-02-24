const crypto = require('crypto');
const request = require('request');
const querystring = require('querystring');
const configuration = require('../configuration')

async function getLocalAddress(){
    async function connectDB2(mongouri, database) { 
        var client;
        const MongoClient = require('mongodb').MongoClient;
        if (!client) client = await MongoClient.connect(mongouri, { useNewUrlParser: true, useUnifiedTopology: true});
        return { db: client.db(database), client: client };
    };

    const { db, client } = await connectDB2(configuration[0]['MONGOURL'], 'server_db2')
    var result_now = await db.collection('instance-information').find({}).sort({_id: -1}).toArray()
    client.close()
    return result_now[0]['client_ip']

}
 

async function getBinanceSignature(){
    var BINANCE_SYMBOL_URL = 'https://api.binance.com/api/v3/depth?symbol='
    var BINANCE_TRADE_URL = "https://api.binance.com/api/v3/order";
    var BINANCE_BALANCE_URL = "https://api.binance.com/api/v3/account";
    var BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/price";
    var BINANCE_FEE_URL = "https://api.binance.com/api/v3/exchangeInfo";
    var BINANCE_TICKER24H_URL = "https://api.binance.com/api/v3/ticker/24hr";


    var BINANCE_FUTURES_SYMBOL_URI = "https://fapi.binance.com/fapi/v1/depth?symbol="
    var BINANCE_FUTURES_TRADE_URI = "https://fapi.binance.com/fapi/v1/order";
    var BINANCE_FUTURES_BALANCE_URI = "https://fapi.binance.com/fapi/v2/account";
    var BINANCE_FUTURES_TICKER_URI = "https://fapi.binance.com/fapi/v1/ticker/price"
    var BINANCE_FUTURES_FEE_URL = "https://fapi.binance.com/fapi/v1/exchangeInfo";
    var BINANCE_FUTURES_TICKER24H_URL = "https://fapi.binance.com/fapi/v1/ticker/24hr";
    var BINANCE_FUTURES_CHANGELEVERAGE_URL = "https://fapi.binance.com/fapi/v1/leverage";
    var BINANCE_FUTURES_CHANGEPOSITIONMODE_URL = "https://fapi.binance.com/fapi/v1/positionSide/dual"


    var BINANCE_MARGIN_TRADE_URI = 'https://api.binance.com/sapi/v1/margin/order';

    var signData = {
        "BINANCE_SYMBOL_URL": BINANCE_SYMBOL_URL,
        "TRADE_URL": BINANCE_TRADE_URL,
        "BINANCE_FEE_URL": BINANCE_FEE_URL,
        "BALANCE_URL": BINANCE_BALANCE_URL,
        "BINANCE_TICKER_URL": BINANCE_TICKER_URL,
        "BINANCE_FEE_URL": BINANCE_FEE_URL,
        "BINANCE_TICKER24H_URL": BINANCE_TICKER24H_URL,
        "FUTURES_CHANGELEVERAGE_URL": BINANCE_FUTURES_CHANGELEVERAGE_URL,
        "BINANCE_FUTURES_SYMBOL_URL": BINANCE_FUTURES_SYMBOL_URI,
        "FUTURES_TRADE_URL": BINANCE_FUTURES_TRADE_URI,
        "BINANCE_FUTURES_FEE_URL": BINANCE_FUTURES_FEE_URL,
        "BALANCE_FUTURES_URL": BINANCE_FUTURES_BALANCE_URI,
        "BINANCE_FUTURES_TICKER_URL": BINANCE_FUTURES_TICKER_URI,
        "BINANCE_FUTURES_TICKER24H_URL": BINANCE_FUTURES_TICKER24H_URL,
        "BINANCE_FUTURES_CHANGEPOSITIONMODE_URL": BINANCE_FUTURES_CHANGEPOSITIONMODE_URL,
        "BINANCE_MARGIN_TRADE_URI": BINANCE_MARGIN_TRADE_URI

    }

    return signData
}

async function getOrderBookBinance(symbol){
    try{
        var data = await getBinanceSignature()
        var client_ip = await getLocalAddress()
        var mainsymbol = symbol.replace('-', "");
        var getOrderBook = []
    
        
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_SYMBOL_URL'] + mainsymbol,
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        };
    
        var getOrderBook = [];
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var orderBook = await apiCall();
        for(var t=0; t<errorCodes.length; t++){
            if(orderBook.body.code !== errorCodes[t] & orderBook.statusCode == '200'){
                getOrderBook.push(
                    [parseFloat(orderBook.body.asks[0][0]), parseFloat(orderBook.body.asks[0][1])],
                    [parseFloat(orderBook.body.bids[0][0]), parseFloat(orderBook.body.bids[0][1])],
                    [parseFloat(orderBook.body.asks[1][0]), parseFloat(orderBook.body.asks[1][1])],
                    [parseFloat(orderBook.body.bids[1][0]), parseFloat(orderBook.body.bids[1][1])],
                    [parseFloat(orderBook.body.asks[2][0]), parseFloat(orderBook.body.asks[2][1])],
                    [parseFloat(orderBook.body.bids[2][0]), parseFloat(orderBook.body.bids[2][1])]
                )
                return getOrderBook
            } else {
                if(orderBook.body.code == errorCodes[t] | orderBook.statusCode !== '200' | orderBook.statusCode == 429){
                    getOrderBook.push(
                        [0, 0],
                        [0, 0],
                        [0, 0],
                        [0, 0],
                        [0, 0],
                        [0, 0]
                    )
                    return getOrderBook
                }
            }
        }
    } catch(e){
        if(e !== undefined){
            return [
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0]
            ]
        }
    }
} 


async function getOrderBookFuturesBinance(symbol){
    try{
        var data = await getBinanceSignature()
        var client_ip = await getLocalAddress()
        var mainsymbol = symbol.replace('-', "");
        var getOrderBook = []
        
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_FUTURES_SYMBOL_URL'] + mainsymbol,
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        };
        var getOrderBook = [];
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var orderBook = await apiCall();
        for(var t=0; t<errorCodes.length; t++){
            if(orderBook.body.code !== errorCodes[t] & orderBook.statusCode == '200'){
                getOrderBook.push(
                    [parseFloat(orderBook.body.asks[0][0]), parseFloat(orderBook.body.asks[0][1])],
                    [parseFloat(orderBook.body.bids[0][0]), parseFloat(orderBook.body.bids[0][1])],
                    [parseFloat(orderBook.body.asks[1][0]), parseFloat(orderBook.body.asks[1][1])],
                    [parseFloat(orderBook.body.bids[1][0]), parseFloat(orderBook.body.bids[1][1])],
                    [parseFloat(orderBook.body.asks[2][0]), parseFloat(orderBook.body.asks[2][1])],
                    [parseFloat(orderBook.body.bids[2][0]), parseFloat(orderBook.body.bids[2][1])]
                )
                return getOrderBook
            } else {
                if(orderBook.body.code == errorCodes[t] | orderBook.statusCode !== '200' | orderBook.statusCode == 429){
                    getOrderBook.push(
                        [0, 0],
                        [0, 0],
                        [0, 0],
                        [0, 0],
                        [0, 0],
                        [0, 0]
                    )
                    return getOrderBook
                }
            }
    
        }
    } catch(e){
        if(e !== undefined){
            return [
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0]
            ]
        }
    }

}
async function getTickerBinance(){
    try{
        var data = await getBinanceSignature()
        var client_ip = await getLocalAddress()
        
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_TICKER_URL'],
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        };

        var tickerRES = await apiCall();
        return tickerRES.body
    } catch(e){
        if(e !== undefined){
            return []
        }
    }
  
}

async function getTickerBinanceFutures(){
    try{
        var data = await getBinanceSignature()
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_FUTURES_TICKER_URL'],
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        };

        var tickerRES = await apiCall()
        return tickerRES.body

    } catch(e){
        if(e !== undefined){
            return []
        }
    }
}

async function getTicker24hBinance(){
    try{
        var data = await getBinanceSignature()
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_TICKER24H_URL'],
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        };

        var tickerRES = await apiCall();
        return tickerRES.body
    }  catch(e){
        if(e !== undefined){
            return []
        }
    } 
}


async function getTicker24hBinanceFutures(){
    try{
        var data = await getBinanceSignature()
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_FUTURES_TICKER24H_URL'],
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        };

        var tickerRES = await apiCall();
        return tickerRES.body
    } catch(e){
        if(e !== undefined){
            return []
        }
    }
}

async function getTradeFeesBinance(){
    try{
        var data = await getBinanceSignature()
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_FEE_URL'],
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        };

        var tickerRES = await apiCall();
        return tickerRES.body
    } catch(e){
        if(e !== undefined){
            return []
        }
    }
  
}

async function getTradeFeeBinanceFutures(){
    try{
        var data = await getBinanceSignature()
        var client_ip = await getLocalAddress()
        
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_FUTURES_FEE_URL'],
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        };

        var tickerRES = await apiCall();
        return tickerRES.body
    } catch(e){
        if(e !== undefined){
            return []
        }
    }
}

async function getBalanceBinance(symbol, apiKey, secretKey){
    try{
        var binancerecvWindow = 5000;
        var timestamp = (Date.now()).toString();
        var binanceSignature = "recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/api/v3/account" + config;
        var client_ip = await getLocalAddress()

        
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
       
        var balances = await apiCall();
        
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        for(var t=0; t<errorCodes.length; t++){
            if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
               var ex1 = balances.body.balances
       
               var mainfull = symbol.split('-')
               sym1 = mainfull[0]
               sym2 = mainfull[1]
       
               var result = ex1.filter(obj => { return obj.asset === sym1})
               if(result[0] == undefined){ result = [{ 'asset': sym1, 'free': 0.00, 'locked': 0.00}]}
       
               var result2 = ex1.filter(obj => { return obj.asset === sym2})
               if(result2[0] == undefined){ result2 = [{ 'asset': sym2, 'free': 0.00, 'locked': 0.00}]}
              
               var balancesMain = {}
               balancesMain['name'] = 'binance'
               balancesMain[sym1 + 'Balance'] = result[0].free
               balancesMain[sym2 + 'Balance'] = result2[0].free
       
               return balancesMain
            } else {
                if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                    var balancesMain = {}
                    balancesMain['name'] = 'binance'
                    balancesMain[sym1 + 'Balance'] = 0
                    balancesMain[sym2 + 'Balance'] = 0
       
                    return balancesMain
                }
            }
        } 
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'
            balancesMain[sym1 + 'Balance'] = 0
            balancesMain[sym2 + 'Balance'] = 0

            return balancesMain
        }
    }
   
}


async function getBalanceBinanceMargin(apiKey, secretKey){
    try{
        var binancerecvWindow = 5000;
        var timestamp = (Date.now()).toString();
        var binanceSignature = "recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/margin/isolated/account" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        if(balances.statusCode == '200'){
            return balances.body.assets
        } else {
            if(balances.statusCode == '404'){
                var balancesMain = {}
                balancesMain['name'] = 'binance'
    
                return balancesMain
            }
        }
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'
            return balancesMain
        }
    }
    
    
}

async function getMaxBorrowMargin(symbol, currency, apiKey, secretKey){
    try{
        var binancerecvWindow = 5000;
        var timestamp = (Date.now()).toString();
        var binanceSignature = "asset=" + currency + "&isolatedSymbol=" + symbol + "&recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "asset=" + currency + "&isolatedSymbol=" + symbol +  "&recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/margin/maxBorrowable" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        if(balances.statusCode == '200'){
            return balances.body
        } else {
            var balancesMain = {}
            balancesMain['name'] = 'binance'
    
            return balancesMain
        }
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'
            return balancesMain
        }
    }

}


async function borrowAssetsMargin(symbol, amount, isIsolated, apiKey, secretKey){
    try{
        var binancerecvWindow = 5000;
        var timestamp = (Date.now()).toString();
        var binanceSignature = "asset=" + symbol + "&isIsolated=" + isIsolated + "&amount=" + amount + "&recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "asset=" + symbol + "&isIsolated=" + isIsolated + "&amount=" + amount +  "&recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/margin/loan" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        if(balances.statusCode == '200'){
            return balances.body
        } else {
            var balancesMain = {}
            balancesMain['name'] = 'binance'
    
            return balancesMain
        }
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'
    
            return balancesMain
        }
    }
}


async function repayAssetsMargin(symbol, amount, isIsolated, apiKey, secretKey){
    try{
        var binancerecvWindow = 5000;
        var timestamp = (Date.now()).toString();
        var binanceSignature = "asset=" + symbol + "&isIsolated=" + isIsolated + "&amount=" + amount + "&recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "asset=" + symbol + "&isIsolated=" + isIsolated + "&amount=" + amount +  "&recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/margin/repay" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        if(balances.statusCode == '200'){
            return balances.body
        } else {
            var balancesMain = {}
            balancesMain['name'] = 'binance'
    
            return balancesMain
        }
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'
    
            return balancesMain
        }
    }

}

async function getOpenOrdersMargin(apiKey, secretKey){

    try{
        var binancerecvWindow = 5000;
        var timestamp = (Date.now()).toString()
        var binanceSignature = "recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature;
        var fullurl = "https://api.binance.com/sapi/v1/margin/openOrders" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var balances = await apiCall();
        if(balances['body'].length === 0){
            var balancesMain = {}
            balancesMain['name'] = 'binance'
        } else {
            var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
            for(var t=0; t<errorCodes.length; t++){
                if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
                    return balances.body.assets
                } else {
                    if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                        
                        var balancesMain = {}
                        balancesMain['name'] = 'binance'
        
                        return balancesMain
                    }
                }
            } 
        }
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'
        }
    }
}


async function getBalanceBinanceFutures(symbol, apiKey, secretKey){
    try{
        var binancerecvWindow = 5000;
        var timestamp = (Date.now()).toString();
        var binanceSignature = "recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "recvWindow=" + binancerecvWindow + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://fapi.binance.com/fapi/v2/account" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
        var mainfull = symbol.split('-')
        sym1 = mainfull[0]
        sym2 = mainfull[1]
    
        var balances = await apiCall();
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        for(var t=0; t<errorCodes.length; t++){
            if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
                var ex1 = balances.body.assets
    
                
    
                var result = ex1.filter(obj => { return obj.asset === sym1})
                if(result[0] == undefined){ result = [{ 'asset': sym1, 'free': 0.00, 'locked': 0.00}]}
    
                var result2 = ex1.filter(obj => { return obj.asset === sym2})
                if(result2[0] == undefined){ result2 = [{ 'asset': sym2, 'free': 0.00, 'locked': 0.00}]}
               
                var balancesMain = {}
                balancesMain['name'] = 'binance'
                balancesMain[sym1 + 'Balance'] = result[0].availableBalance
                balancesMain[sym2 + 'Balance'] = result2[0].availableBalance
                return balancesMain
            } else {
                if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                    var balancesMain = {}
                    balancesMain['name'] = 'binance'
                    balancesMain[sym1 + 'Balance'] = 0
                    balancesMain[sym2 + 'Balance'] = 0
    
                    return balancesMain
                }
            }
        } 
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'
            balancesMain[sym1 + 'Balance'] = 0
            balancesMain[sym2 + 'Balance'] = 0

            return balancesMain
        }
    }

}


async function getBalanceFuturesFULLBinance(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature =  "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" +  "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://fapi.binance.com/fapi/v2/account" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        for(var t=0; t<errorCodes.length; t++){
            if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
                return balances.body.assets
            } else {
                if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                    
                    var balancesMain = {}
                    balancesMain['name'] = 'binance'
    
                    return balancesMain
                }
            }
        } 
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'

            return balancesMain
        }
    }
    
}



async function getBalanceFuturesFULLBinance2(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature =  "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" +  "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://dapi.binance.com/dapi/v1/account" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        for(var t=0; t<errorCodes.length; t++){
            if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
    
    
                return balances.body.assets
            } else {
                if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                    
                    var balancesMain = {}
                    balancesMain['name'] = 'binance'
    
                    return balancesMain
                }
            }
        } 
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'

            return balancesMain
        }
    }

}



async function changeFuturesAssetMode(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "multiAssetsMargin=false" + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "multiAssetsMargin=false" + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature;
        var fullurl = "https://fapi.binance.com/fapi/v1/multiAssetsMargin" + config
        var client_ip = await getLocalAddress()    
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    

        var balances = await apiCall();
        if(balances.body['code'] === '-4171'){
            return 0
        } else {
            return 1
        }
    } catch(e){
        if(e !== undefined){
            return 1
        }
    }
    
   
}


async function getFuturesAssetMode(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature;
        var fullurl = "https://fapi.binance.com/fapi/v1/positionSide/dual" + config
        var client_ip = await getLocalAddress()    
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        if(balances.body !== undefined){
            return balances['body']
        } else {
            return 1
        }
    } catch(e){
        if(e !== undefined){
            return 1
        }
    }
    
   
}


async function getCurrentPosition(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature;
        var fullurl = "https://fapi.binance.com/fapi/v1/multiAssetsMargin" + config
        var client_ip = await getLocalAddress()    
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        for(var t=0; t<errorCodes.length; t++){
            if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
    
                var body2 = {
                    'name': 'binance',
                    'msg': balances.body
                }
                return body2
            } else {
                if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                    
                    var balancesMain = {
                        'name': 'binance',
                        'msg': []
                    }
    
                    return balancesMain
                }
            }
        } 
    } catch(e){
        if(e !== undefined){
            var balancesMain = {
                'name': 'binance',
                'msg': []
            }

            return balancesMain
        }
    }

}

async function changeCurrentPosition(method, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&multiAssetsMargin=" + method + "&signature=" + GeneratebinanceSignature;
        var fullurl = "https://fapi.binance.com/fapi/v1/multiAssetsMargin" + config
        var client_ip = await getLocalAddress()    
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        for(var t=0; t<errorCodes.length; t++){
            if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
    
                var body2 = {
                    'name': 'binance',
                    'msg': balances.body
                }
                return body2
            } else {
                if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                    
                    var balancesMain = {
                        'name': 'binance',
                        'msg': []
                    }
    
                    return balancesMain
                }
            }
        } 
    } catch(e){
        if(e !== undefined){
            var balancesMain = {
                'name': 'binance',
                'msg': []
            }

            return balancesMain
        }
    }

}


async function getPossitionInformation(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature;
        var fullurl = "https://fapi.binance.com/fapi/v2/positionRisk" + config
        var client_ip = await getLocalAddress()    
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        for(var t=0; t<errorCodes.length; t++){
            if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
    
                var body2 = {
                    'name': 'binance',
                    'msg': balances.body
                }
                return body2
            } else {
                if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                    
                    var balancesMain = {
                        'name': 'binance',
                        'msg': []
                    }
    
                    return balancesMain
                }
            }
        } 
    } catch(e){
        if(e !== undefined){
            var balancesMain = {
                'name': 'binance',
                'msg': []
            }

            return balancesMain
        }
    }

}


async function getBalancesandPositionsFutures(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature;
        var fullurl = "https://fapi.binance.com/fapi/v2/account" + config
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        for(var t=0; t<errorCodes.length; t++){
            if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
    
                var body2 = {
                    'name': 'binance',
                    'assets': balances.body.assets,
                    'positions': balances.body.positions
                }
                return body2
            } else {
                if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                    
                    var balancesMain = {
                        'name': 'binance',
                        'assets': [],
                        'positions': []
                    }
    
                    return balancesMain
                }
            }
        } 
    } catch(e){
        if(e !== undefined){
            var balancesMain = {
                'name': 'binance',
                'assets': [],
                'positions': []
            }

            return balancesMain
        }
    }

}

async function getBalanceFULLBalanceFunding(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" +  "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/asset/get-funding-asset" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();

        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        for(var t=0; t<errorCodes.length; t++){
            if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
    
    
                return balances.body
            } else {
                if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                    
                    var balancesMain = {}
                    balancesMain['name'] = 'binance'
    
                    return balancesMain
                }
            }
        } 
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'

            return balancesMain
        }
    }
}


async function getBalanceFULLBinance(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" +  "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/api/v3/account" + config;
        var client_ip = await getLocalAddress()
            
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var balances = await apiCall();
        var errorCodes = [-1001, -1002,  -1006, -1007, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104,-1105, -1106, -1111, -1114, -1115, -1116, -1117, -1118, -1119, -1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        for(var t=0; t<errorCodes.length; t++){
            if(balances.body.code !== errorCodes[t] & balances.statusCode == '200'){
    
    
                return balances.body.balances
            } else {
                if(balances.body.code == errorCodes[t] | balances.statusCode == '404'){
                    
                    var balancesMain = {}
                    balancesMain['name'] = 'binance'
    
                    return balancesMain
                }
            }
        } 
    } catch(e){
        if(e !== undefined){
            var balancesMain = {}
            balancesMain['name'] = 'binance'

            return balancesMain
        }
    }

}

async function changeinitialleverage(symbol, leverage, apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey 
        var secret = secretKey
        var nonce = (Date.now()).toString()
        var sideId = undefined;
        var mainsymbol = symbol.replace('-', "");
        var client_ip = await getLocalAddress()

        var body = {
            'symbol': mainsymbol,
            'leverage': leverage,
            'timestamp': nonce
        }
        
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['FUTURES_CHANGELEVERAGE_URL'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
    
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }
                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }
                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }
                            return APIresponse
                        }
                        
                    }
                    
                }
                
                     
                
                
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }

   
}



async function closePositionsBinanceFutures(symbol, type, side, quantity, reduceOnly, apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey 
        var secret = secretKey
        var nonce = (Date.now()).toString()
        var sideId = undefined;
        var mainsymbol = symbol.replace('-', "");
        var secsymbol = symbol.replace('', "");
        var client_ip = await getLocalAddress()
    
        if (side === 'buy') {
            sideId = 'BUY'; 
            var body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: quantity,
                reduceOnly: reduceOnly,
                timestamp: nonce
            }
        } else if (side === 'sell') {
            sideId = 'SELL'; 
            var body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: quantity,
                reduceOnly: reduceOnly,
                timestamp: nonce
            }    
        }
    
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['FUTURES_TRADE_URL'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
    
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        "OrderInfo": {
                            "symbol": symbol,
                            "type":  type,
                            "side":  sideId,
                        },
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }

                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            "OrderInfo": {
                                "symbol": symbol,
                                "type":  type,
                                "side":  sideId,
                            },
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }

                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                "OrderInfo": {
                                    "symbol": symbol,
                                    "type":  type,
                                    "side":  sideId,
                                },
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }

                            return APIresponse
                        }
                    }
                }
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                "OrderInfo": {
                    "symbol": '',
                    "type":  '',
                    "side":  '',
                },
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }

}


async function createOrderBinanceFutures(symbol, type, side, amount, price, apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey
        var secret = secretKey
        var nonce = (Date.now()).toString()
        let sideId = undefined;
        var mainsymbol = symbol.replace('/', "");
        var secsymbol = symbol.replace('/', "");
        var client_ip = await getLocalAddress()
     
        if(type == 'market'){
            if (side === 'buy') {
                sideId = 'buy';  
                var body = {
                    symbol: mainsymbol,
                    type: type,
                    side: sideId,
                    quoteOrderQty: amount,
                    timestamp: nonce
                }
            } else if (side === 'sell') {
                sideId = 'sell'; 
                var body = {
                    symbol: mainsymbol,
                    type: type,
                    side: sideId,
                    quantity: amount,
                    timestamp: nonce
                }    
            }
        } else {
            if(type == 'limit'){
                if (side === 'buy') {
                    sideId = 'buy';  
                    var body = {
                        symbol: mainsymbol,
                        type: type,
                        side: sideId,
                        timeInForce: 'GTC',
                        price: price,
                        quantity: amount,
                        timestamp: nonce
                    }
                } else if (side === 'sell') {
                    sideId = 'sell'; 
                    var body = {
                        symbol: mainsymbol,
                        type: type,
                        side: sideId,
                        timeInForce: 'GTC',
                        price: price,
                        quantity: amount,
                        timestamp: nonce
                    }    
                }
            }
        }
    
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['FUTURES_TRADE_URL'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
    
    
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        "OrderInfo": {
                            "symbol": symbol,
                            "type":  type,
                            "side":  sideId,
                            "amount":  amount,
                            "price":  price,
                        },
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }
                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            "OrderInfo": {
                                "symbol": symbol,
                                "type":  type,
                                "side":  sideId,
                                "amount":  amount,
                                "price":  price,
                            },
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }
                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                "OrderInfo": {
                                    "symbol": symbol,
                                    "type":  type,
                                    "side":  sideId,
                                    "amount":  amount,
                                    "price":  price,
                                },
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }
                            return APIresponse
                        }
                        
                    }
                    
                } 
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                "OrderInfo": {
                    "symbol": '',
                    "type":  '',
                    "side":  '',
                    "amount":  '',
                    "price":  '',
                },
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }

}



async function createOrderBinanceMargin(symbol, type, side, amount, price, apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey
        var secret = secretKey
        var nonce = (Date.now()).toString()
        let sideId = undefined;
        var mainsymbol = symbol.replace('/', "");
        var secsymbol = symbol.replace('/', "");
        var client_ip = await getLocalAddress()
    
        if(type == 'market'){
            if (side === 'buy') {
                sideId = 'buy';  
                var body = {
                    symbol: mainsymbol,
                    type: type,
                    side: sideId,
                    quoteOrderQty: amount,
                    timestamp: nonce
                }
            } else if (side === 'sell') {
                sideId = 'sell'; 
                var body = {
                    symbol: mainsymbol,
                    type: type,
                    side: sideId,
                    quantity: amount,
                    timestamp: nonce
                }    
            }
        } else {
            if(type == 'limit'){
                if (side === 'buy') {
                    sideId = 'buy';  
                    var body = {
                        symbol: mainsymbol,
                        type: type,
                        side: sideId,
                        timeInForce: 'GTC',
                        price: price,
                        quantity: amount,
                        timestamp: nonce
                    }
                } else if (side === 'sell') {
                    sideId = 'sell'; 
                    var body = {
                        symbol: mainsymbol,
                        type: type,
                        side: sideId,
                        timeInForce: 'GTC',
                        price: price,
                        quantity: amount,
                        timestamp: nonce
                    }    
                }
            }
        }
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_MARGIN_TRADE_URI'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
    
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        "OrderInfo": {
                            "symbol": symbol,
                            "type":  type,
                            "side":  sideId,
                            "amount":  amount,
                            "price":  price,
                        },
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }
                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            "OrderInfo": {
                                "symbol": symbol,
                                "type":  type,
                                "side":  sideId,
                                "amount":  amount,
                                "price":  price,
                            },
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }
                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                "OrderInfo": {
                                    "symbol": symbol,
                                    "type":  type,
                                    "side":  sideId,
                                    "amount":  amount,
                                    "price":  price,
                                },
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }
                            return APIresponse
                        }
                        
                    }
                }
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                "OrderInfo": {
                    "symbol": '',
                    "type":  '',
                    "side":  '',
                    "amount":  '',
                    "price":  '',
                },
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }

}

async function createOrderBinance(symbol, type, side, amount, price,  apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey
        var secret = secretKey
        var nonce = (Date.now()).toString()
        let sideId = undefined;
        var mainsymbol = symbol.replace('/', "");
        var secsymbol = symbol.replace('/', "");
        var client_ip = await getLocalAddress()
    
        if(type == 'market'){
            if (side === 'buy') {
                sideId = 'buy';  
                var body = {
                    symbol: mainsymbol,
                    type: type,
                    side: sideId,
                    quoteOrderQty: amount,
                    timestamp: nonce
                }
            } else if (side === 'sell') {
                sideId = 'sell'; 
                var body = {
                    symbol: mainsymbol,
                    type: type,
                    side: sideId,
                    quantity: amount,
                    timestamp: nonce
                }    
            }
        } else {
            if(type == 'limit'){
                if (side === 'buy') {
                    sideId = 'buy';  
                    var body = {
                        symbol: mainsymbol,
                        type: type,
                        side: sideId,
                        timeInForce: 'GTC',
                        price: price,
                        quantity: amount,
                        timestamp: nonce
                    }
                } else if (side === 'sell') {
                    sideId = 'sell'; 
                    var body = {
                        symbol: mainsymbol,
                        type: type,
                        side: sideId,
                        timeInForce: 'GTC',
                        price: price,
                        quantity: amount,
                        timestamp: nonce
                    }    
                }
            }
        }
        
    
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['TRADE_URL'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        "OrderInfo": {
                            "symbol": symbol,
                            "type":  type,
                            "side":  sideId,
                            "amount":  amount,
                            "price":  price,
                        },
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }
                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            "OrderInfo": {
                                "symbol": symbol,
                                "type":  type,
                                "side":  sideId,
                                "amount":  amount,
                                "price":  price,
                            },
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }
                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                "OrderInfo": {
                                    "symbol": symbol,
                                    "type":  type,
                                    "side":  sideId,
                                    "amount":  amount,
                                    "price":  price,
                                },
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }
                            return APIresponse
                        }
                        
                    }
                    
                }
                
                     
                
                
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                "OrderInfo": {
                    "symbol": '',
                    "type":  '',
                    "side":  '',
                    "amount":  '',
                    "price":  '',
                },
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }
    
}



async function createOrderBinanceMarginStopLoss(symbol, type, side, amount, price, stopprice, apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey
        var secret = secretKey
        var nonce = (Date.now()).toString()
        let sideId = undefined;
        var mainsymbol = symbol.replace('/', "");
        var secsymbol = symbol.replace('/', "");
        var client_ip = await getLocalAddress()
    
    
        var body = {}
        if (side === 'buy') {
            sideId = 'BUY'; 
            body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                stopPrice: stopprice,
                isIsolated: "TRUE",
                recvWindow: '5000',
                timestamp: nonce
            }
    
            
        } else if (side === 'sell') {
            sideId = 'SELL'; 
            var body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                stopPrice: stopprice,
                isIsolated: "TRUE",
                recvWindow: '5000',
                timestamp: nonce
            }    
        }
    
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_MARGIN_TRADE_URI'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
    
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        "OrderInfo": {
                            "symbol": symbol,
                            "type":  type,
                            "side":  sideId,
                            "amount":  amount,
                            "price":  price,
                            "stopPrice": stopprice
                        },
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }
                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            "OrderInfo": {
                                "symbol": symbol,
                                "type":  type,
                                "side":  sideId,
                                "amount":  amount,
                                "price":  price,
                                "stopPrice": stopprice
                            },
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }
                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                "OrderInfo": {
                                    "symbol": symbol,
                                    "type":  type,
                                    "side":  sideId,
                                    "amount":  amount,
                                    "price":  price,
                                    "stopPrice": stopprice
                                },
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }
                            return APIresponse
                        }
                        
                    }
                    
                } 
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                "OrderInfo": {
                    "symbol": '',
                    "type":  '',
                    "side":  '',
                    "amount":  '',
                    "price":  '',
                    "stopPrice": ''
                },
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }  
        
}


async function createOrderBinanceFuturesStopLoss(symbol, type, side, amount, price, stopprice, apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey
        var secret = secretKey
        var nonce = (Date.now()).toString()
        let sideId = undefined;
        var mainsymbol = symbol.replace('/', "");
        var secsymbol = symbol.replace('/', "");
        var client_ip = await getLocalAddress()
    
    
        var body = {}
        if (side === 'buy') {
            sideId = 'BUY'; 
            body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                stopPrice: stopprice,
                recvWindow: '5000',
                timestamp: nonce
            }
    
            
        } else if (side === 'sell') {
            sideId = 'SELL'; 
            var body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                stopPrice: stopprice,
                recvWindow: '5000',
                timestamp: nonce
            }    
        }
    
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['FUTURES_TRADE_URL'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
    
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        "OrderInfo": {
                            "symbol": symbol,
                            "type":  type,
                            "side":  sideId,
                            "amount":  amount,
                            "price":  price,
                            "stopPrice": stopprice
                        },
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }
                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            "OrderInfo": {
                                "symbol": symbol,
                                "type":  type,
                                "side":  sideId,
                                "amount":  amount,
                                "price":  price,
                                "stopPrice": stopprice
                            },
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }
                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                "OrderInfo": {
                                    "symbol": symbol,
                                    "type":  type,
                                    "side":  sideId,
                                    "amount":  amount,
                                    "price":  price,
                                    "stopPrice": stopprice
                                },
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }
                            return APIresponse
                        }
                    }
                }
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                "OrderInfo": {
                    "symbol": '',
                    "type":  '',
                    "side":  '',
                    "amount":  '',
                    "price":  '',
                    "stopPrice": ''
                },
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }  
    
}

async function createOrderBinanceStopLoss(symbol, type, side, amount, price, stopprice, apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey
        var secret = secretKey
        var nonce = (Date.now()).toString()
        let sideId = undefined;
        var mainsymbol = symbol.replace('/', "");
        var secsymbol = symbol.replace('/', "");
        var client_ip = await getLocalAddress()
    
    
        var body = {}
        if (side === 'buy') {
            sideId = 'buy'; 
            body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                price: price,
                stopPrice: stopprice,
                recvWindow: '5000',
                timestamp: nonce
            }
    
            
        } else if (side === 'sell') {
            sideId = 'sell'; 
            var body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                price: price,
                stopPrice: stopprice,
                recvWindow: '5000',
                timestamp: nonce
            }    
        }
    
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['TRADE_URL'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
    
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        "OrderInfo": {
                            "symbol": symbol,
                            "type":  type,
                            "side":  sideId,
                            "amount":  amount,
                            "price":  price,
                            "stopPrice": stopprice
                        },
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }
                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            "OrderInfo": {
                                "symbol": symbol,
                                "type":  type,
                                "side":  sideId,
                                "amount":  amount,
                                "price":  price,
                                "stopPrice": stopprice
                            },
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }
                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                "OrderInfo": {
                                    "symbol": symbol,
                                    "type":  type,
                                    "side":  sideId,
                                    "amount":  amount,
                                    "price":  price,
                                    "stopPrice": stopprice
                                },
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }
                            return APIresponse
                        }
                    }
                }
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                "OrderInfo": {
                    "symbol": '',
                    "type":  '',
                    "side":  '',
                    "amount":  '',
                    "price":  '',
                    "stopPrice": ''
                },
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }  

}


async function createOrderBinanceFutures2(symbol, type, side, amount, apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey
        var secret = secretKey
        var nonce = (Date.now()).toString()
        let sideId = undefined;
        var mainsymbol = symbol.replace('/', "");
        var secsymbol = symbol.replace('/', "");
        var client_ip = await getLocalAddress()
    
    
        var body = {}
        if (side === 'buy') {
            sideId = 'BUY'; 
            
            body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                recvWindow: '5000',
                timestamp: nonce
            }
            
        } else if (side === 'sell') {
            sideId = 'SELL'; 
            body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                recvWindow: '5000',
                timestamp: nonce
            }    
        }
    
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['FUTURES_TRADE_URL'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
    
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        "OrderInfo": {
                            "symbol": symbol,
                            "type":  type,
                            "side":  sideId,
                            "amount":  amount
                        },
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }
                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            "OrderInfo": {
                                "symbol": symbol,
                                "type":  type,
                                "side":  sideId,
                                "amount":  amount
                            },
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }
                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                "OrderInfo": {
                                    "symbol": symbol,
                                    "type":  type,
                                    "side":  sideId,
                                    "amount":  amount
                                },
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }
                            return APIresponse
                        }
                    }
                }
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                "OrderInfo": {
                    "symbol": '',
                    "type":  '',
                    "side":  '',
                    "amount":  ''
                },
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }  

}


async function createOrderBinanceMargin2(symbol, type, side, amount, apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey
        var secret = secretKey
        var nonce = (Date.now()).toString()
        let sideId = undefined;
        var mainsymbol = symbol.replace('/', "");
        var secsymbol = symbol.replace('/', "");
        var client_ip = await getLocalAddress()
    
    
        var body = {}
        if (side === 'buy') {
            sideId = 'BUY'; 
            body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                isIsolated: "TRUE",
                recvWindow: '5000',
                timestamp: nonce
            }
            
        } else if (side === 'sell') {
            sideId = 'SELL'; 
            body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                isIsolated: "TRUE",
                recvWindow: '5000',
                timestamp: nonce
            }    
        }
    
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['BINANCE_MARGIN_TRADE_URI'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
    
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        "OrderInfo": {
                            "symbol": symbol,
                            "type":  type,
                            "side":  sideId,
                            "amount":  amount
                        },
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }
                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            "OrderInfo": {
                                "symbol": symbol,
                                "type":  type,
                                "side":  sideId,
                                "amount":  amount
                            },
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }
                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                "OrderInfo": {
                                    "symbol": symbol,
                                    "type":  type,
                                    "side":  sideId,
                                    "amount":  amount
                                },
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }
                            return APIresponse
                        }
                    }
                } 
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                "OrderInfo": {
                    "symbol": '',
                    "type":  '',
                    "side":  '',
                    "amount":  ''
                },
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }  

    

}

async function createOrderBinance2(symbol, type, side, amount, apiKey, secretKey){
    try{
        var data = await getBinanceSignature()
        var key = apiKey
        var secret = secretKey
        var nonce = (Date.now()).toString()
        let sideId = undefined;
        var mainsymbol = symbol.replace('/', "");
        var secsymbol = symbol.replace('/', "");
        var client_ip = await getLocalAddress()
    
    
        var body = {}
        if (side === 'buy') {
            sideId = 'buy'; 
            body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                recvWindow: '5000',
                timestamp: nonce
            }
            
        } else if (side === 'sell') {
            sideId = 'sell'; 
            body = {
                symbol: mainsymbol,
                type: type,
                side: sideId,
                quantity: amount,
                recvWindow: '5000',
                timestamp: nonce
            }    
        }
    
    
        const bodySorted = Object.keys(body).slice().sort().reduce((prev, key) => ({ ...prev,  [key]: body[key],}), {} );
        const bodyAsQueryString = querystring.stringify(bodySorted);
        var binanceSignature = bodyAsQueryString
        var GeneratebinanceSignature = crypto.createHmac('sha256', secret).update(binanceSignature).digest('hex');
    
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: data['TRADE_URL'] + '?' + bodyAsQueryString + "&signature=" + GeneratebinanceSignature,
                    headers: {
                        'X-MBX-APIKEY': key 
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var Clienterrors = [-1000, -1001, -1002, -1003, -1006, -1007, -1013, -1014, -1015, -1016, -1020, -1021, -1022, -1100, -1101, -1102, -1103, -1104, -1105, -1106, -1111, -1112, -1114, -1115, -1116, -1117, -1118, -1119,-1120, -1121, -1125, -1127, -1128, -1130, -2010, -2011, -2013, -2014, -2015, -2016]
        var HTTPerrors = [500, 503, 401, 504, 405, 404, 400, 403, 429, 409, 501]
    
    
        var traderesponse = await apiCall(body)
        for(var c=0; c<Clienterrors.length; c++){
            for(var h=0; h<HTTPerrors.length; h++){
                code1 = Clienterrors[c]
                code2 = HTTPerrors[h]

                if(traderesponse.statusCode == code2){
                    var APIresponse = {
                        'Time': new Date(Date.now()).toLocaleString(),
                        'status': 'failed',
                        'HTTPstatus': traderesponse.body.code,
                        'Exchange': 'Binance',
                        "OrderInfo": {
                            "symbol": symbol,
                            "type":  type,
                            "side":  sideId,
                            "amount":  amount,
                            "price":  '',
                        },
                        'TradeConfirmation': traderesponse.body,
                        'ErrorConfirmation': ''
                    }
                    return APIresponse
                } else {
                    if(traderesponse.body.code == code1){
                        var APIresponse = {
                            'Time': new Date(Date.now()).toLocaleString(),
                            'status': 'failed',
                            'HTTPstatus': traderesponse.body.code,
                            'Exchange': 'Binance',
                            "OrderInfo": {
                                "symbol": symbol,
                                "type":  type,
                                "side":  sideId,
                                "amount":  amount,
                                "price":  '',
                            },
                            'TradeConfirmation': traderesponse.body,
                            'ErrorConfirmation': ''
                        }
                        return APIresponse
                    } else {
                        if(traderesponse.code == 200 | traderesponse.statusCode == 200){
                            var APIresponse = {
                                'Time': new Date(Date.now()).toLocaleString(),
                                'status': 'success',
                                'HTTPstatus': traderesponse.body.code,
                                'Exchange': 'Binance',
                                "OrderInfo": {
                                    "symbol": symbol,
                                    "type":  type,
                                    "side":  sideId,
                                    "amount":  amount,
                                    "price":  '',
                                },
                                'TradeConfirmation': traderesponse.body,
                                'ErrorConfirmation': ''
                            }
                            return APIresponse
                        }
                        
                    }
                    
                }
            }
        }
    } catch(e){
        if(e !== undefined){
            var APIresponse = {
                'Time': new Date(Date.now()).toLocaleString(),
                'status': 'failed',
                'Exchange': 'Binance',
                "OrderInfo": {
                    "symbol": '',
                    "type":  '',
                    "side":  '',
                    "amount":  '',
                    "price":  '',
                },
                'TradeConfirmation': e,
                'ErrorConfirmation': ''
            }
            return APIresponse
        }
    }  
    
}


async function getTradeListBinanceMargin(symbol, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "symbol=" + symbol + "&isIsolated=true" + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "symbol=" + symbol + "&isIsolated=true" + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/margin/myTrades" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
    
        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return []
        }
    }

}


async function getTradeListBinanceFutures(symbol, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "symbol=" + symbol + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "symbol=" + symbol + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://fapi.binance.com/fapi/v1/userTrades" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return []
        }
    }

}
async function getTradeListBinance(symbol, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "symbol=" + symbol + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "symbol=" + symbol + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/api/v3/myTrades" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return []
        }
    }

}

async function getOrderHistoryBinance(symbol, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "symbol=" + symbol + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "symbol=" + symbol + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/api/v3/allOrders" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return []
        }
    }
  
}

async function getOrderHistoryBinanceMargin(symbol, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "symbol=" + symbol + "&isIsolated=true" + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "symbol=" + symbol + "&isIsolated=true" + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/margin/allOrders" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return []
        }
    }

}


async function getOrderHistoryBinanceFutures(symbol, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "symbol=" + symbol + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "symbol=" + symbol + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://fapi.binance.com/fapi/v1/allOrders" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return []
        }
    }

}

async function getOpenOrdersBinance(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/api/v3/openOrders" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return []
        }
    }
  
}

async function getOpenOrdersBinanceFutures(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://fapi.binance.com/fapi/v1/openOrders" + config;
        var client_ip = await getLocalAddress()
        
        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return {'errors': e}
        }
    }

}


async function createUniversalTransfer(currency, amount, type, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "asset=" + currency + "&amount=" + amount + "&type=" + type + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "asset=" + currency + "&amount=" + amount + "&type=" + type + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/asset/transfer" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return {'errors': e}
        }
    }

}


async function createUniversalTransfer2(param, symbol, currency, amount, type, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "asset=" + currency + "&amount=" + amount + "&type=" + type + "&" + param + "=" + symbol + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "asset=" + currency + "&amount=" + amount + "&type=" + type +  "&" + param + "=" + symbol + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/asset/transfer" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return {'errors': e}
        }
    }

}

// var response = awa
// if(method == 'createGiftCard'){
//     var token = orderInfo['token']
//     var amount = orderInfo['amount']
//     var apiKey = orderInfo['apiKey']
//     var secretKey = orderInfo['secretKey']

//     var response = await createGiftCardWallet(token, amount, apiKey, secretKey)
//     return response
// }

async function redeemGiftCardWallet(code, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "code=" + code + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "code=" + code + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/giftcard/redeemCode" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
        
        var historyRES = await apiCall();
        return historyRES['body']
       
    } catch(e){
        if(e !== undefined){
            return {'errors': e }
        }
    }
}

async function createGiftCardWallet(token, amount, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "token=" + token + "&amount=" + amount + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "token=" + token + "&amount=" + amount + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/giftcard/createCode" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }
        
        var historyRES = await apiCall();
        if(historyRES['body']['msg'] === 'Your account has insufficient assets'){
            return {'errors': 'Your account has insufficient assets'}
        } else {
            var history = historyRES['body']
            return history
        }

    } catch(e){
        if(e !== undefined){
            return {'errors': e}
        }
    }

}


async function convertDustTransfer(currency, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = currency + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + currency + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/asset/dust" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }
    

}

async function createFlexibleEarn(currency, amount, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "productId=" + currency + "&amount=" + amount + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "productId=" + currency + "&amount=" + amount + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/simple-earn/flexible/subscribe " + config;
        var client_ip = await getLocalAddress()


        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES['body']
        return history

        

    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }

}



async function getFlexibleInterestHistory(currency, lendingType, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "asset=" + currency + "&type=" + lendingType + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "asset=" + currency  + "&type=" + lendingType + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/simple-earn/flexible/history/rewardsRecord" + config;
        var client_ip = await getLocalAddress()


        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES['body']
        return history

    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }

}

async function redeemFlexibleEarn(currency, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "productId=" + currency  + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "productId=" + currency + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/simple-earn/flexible/redeem" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.post(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES['body']
        return history

        

    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }

}




async function getCoinInformation(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/capital/config/getall" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }
    

}


async function getAPIPermissions(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/account/apiRestrictions" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }
    

}


async function getSystemStatus(){
    try{
        var fullurl = "https://api.binance.com/sapi/v1/system/status";
        var client_ip = await getLocalAddress()

         const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }
    

}

async function getTradingStatus(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature =  "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/account/apiTradingStatus" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }
  
}


async function cancelOrderBinance(symbol, orderId, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "symbol=" + symbol + "&orderId=" + orderId + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "symbol=" + symbol + "&orderId=" + orderId +  "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/api/v3/order" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.delete(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }
  
}

async function cancelOrderBinanceFutures(symbol, orderId, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "symbol=" + symbol + "&orderId=" + orderId + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "symbol=" + symbol + "&orderId=" + orderId +  "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://fapi.binance.com/fapi/v1/order" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.delete(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }

}


async function cancelOrderBinanceMargin(symbol, orderId, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "symbol=" + symbol + "&orderId=" + orderId + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "symbol=" + symbol + "&orderId=" + orderId +  "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://fapi.binance.com/sapi/v1/margin/order" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.delete(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var historyRES = await apiCall();
        var history = historyRES.body
        return history
    } catch(e){
        if(e !== undefined){
            return [{'error': e}]
        }
    }

}

async function getDepositHistory( apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/capital/deposit/hisrec" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var balances = await apiCall();
        return balances
    } catch(e){
        if(e !== undefined){
            return 1
        }
    }
}

async function getPayDepositHistory(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/pay/transactions" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var balances = await apiCall();
        return balances
    } catch(e){
        if(e !== undefined){
            return 1
        }
    }
}

async function getEarnProducts(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/simple-earn/flexible/list" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var balances = await apiCall();
        return balances
    } catch(e){
        if(e !== undefined){
            return 1
        }
    }
}

async function getEarnProducts2(apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/simple-earn/flexible/position" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var balances = await apiCall();
        return balances
    } catch(e){
        if(e !== undefined){
            return 1
        }
    }
}



async function getWithdrawalHistory( apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/capital/withdraw/history" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var balances = await apiCall();
        return balances
    } catch(e){
        if(e !== undefined){
            return 1 
        }
    }

}

async function getDepositAddresses(coin, network, apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "coin=" + coin + "&network=" + network +  "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "coin=" + coin + "&network=" + network + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/capital/deposit/address" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var balances = await apiCall();  
        return balances.body
    } catch(e){
        if(e !== undefined){
            return 1
        }
    }
    
}


async function createNewWithdraw(coin, address, amount, network,  apiKey, secretKey){
    try{
        var timestamp = (Date.now()).toString();
        var binanceSignature = "coin=" + coin + "&address=" + address + "&amount=" + amount + "&network=" + network + "&timestamp=" + timestamp;
        var GeneratebinanceSignature = crypto.createHmac('sha256', secretKey).update(binanceSignature).digest('hex');
        var config = "?" + "coin=" + coin + "&address=" + address + "&amount=" + amount + "&network=" + network + "&timestamp=" + timestamp + "&signature=" + GeneratebinanceSignature ;
        var fullurl = "https://api.binance.com/sapi/v1/capital/withdraw/apply" + config;
        var client_ip = await getLocalAddress()

        const apiCall = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    url: fullurl,
                    headers: {
                        'X-MBX-APIKEY': apiKey
                    },
                    json: true,
                    localAddress: client_ip
                    
                }
                request.get(options, function(error, res, body) {
                    if(error) reject(error);
                    resolve(res);
                });
            });
        }

        var balances = await apiCall();  
        return balances.body
    } catch(e){
        if(e !== undefined){
            return 1
        }
    }
    


}


async function createPayOrder(){
    var apiKey = 'tkldm3dv5t3qihlcvqvd3tvjljcw5iqaxfghgwdjlzuu1fkjlf1qni0zfgiz7g0v'
    var secretKey = 'st0j2vbgrlan6zjrzkc0pjxumhnoadthh24hipziy88bjiewmpoqsnxbvxzp0sjf'
    var nonce = '5K8264ILTKCH16CQ2502SI8ZNMTM67VS'

    var timestamp = (Date.now()).toString()
    var body = {
        "merchantId":"258599098",
        "subMerchantId": "",
        "merchantTradeNo":"982532" + timestamp,
        "totalFee": 25.17,
        "productDetail":"Greentea ice cream cone",
        "currency":"EUR",
        "returnUrl":"",
        "tradeType":"APP",
        "productType":"Food",
        "productName":"Ice Cream"
    }

    var binanceSignature = (timestamp + "\n"  +  nonce + "\n"  +  JSON.stringify(body) + "\n" ).toString();
    var GeneratebinanceSignature = crypto.createHmac("sha512", secretKey);
    var lastHex = GeneratebinanceSignature.update(new Buffer(binanceSignature, 'utf-8')).digest("hex")
    var client_ip = await getLocalAddress()

    const apiCall = () => {
        return new Promise((resolve, reject) => {
            const options = {
                url: "https://bpay.binanceapi.com/binancepay/openapi/order",
                // body: body1,
                headers: {
                    'content-type': 'application/json',
                    'BinancePay-Timestamp': timestamp,
                    'BinancePay-Nonce': nonce,
                    'BinancePay-Certificate-SN': apiKey,
                    'BinancePay-Signature': lastHex
                    
                    

                },
                json: true,
                localAddress: client_ip
                
            }
            request.post(options, function(error, res, body) {
                if(error) reject(error);
                resolve(res);
            });
        });

        
    }

    var request2 = await apiCall()

    return request2
}



async function binanceClient(method, coinpair, orderInfo){
    try{
        if(method == 'getBinanceSignature'){
            var response = await getBinanceSignature()
            return response
        }
        if(method == 'getOrderBook'){
            var symbol = coinpair
            var response = await getOrderBookBinance(symbol)
            return response
        }
        if(method == 'getOrderBookFutures'){
            var symbol = coinpair
            var response = await getOrderBookFuturesBinance()
            return response
        }
        if(method == 'getTickers'){
            var response = await getTickerBinance()
            return response
        }
        if(method == 'getTickersFutures'){
            var response = await getTickerBinanceFutures()
            return response
        }
        if(method == 'getTickers24h'){
            var response = await getTicker24hBinance()
            return response   
        }
        if(method == 'getTickers24hFutures'){
            var response = await getTicker24hBinanceFutures()
            return response
        }
        if(method == 'getTradeFee'){
            // var symbol = coinpair
            var response = await getTradeFeesBinance()
            return response
        }
        if(method == 'getTradeFeeFutures'){
            var response = await getTradeFeeBinanceFutures()
            return response 
        }
        if(method == 'createGiftCard'){
            var token = orderInfo['token']
            var amount = orderInfo['amount']
            var apiKey = orderInfo['apiKey']
            var secretKey = orderInfo['secretKey']

            var response = await createGiftCardWallet(token, amount, apiKey, secretKey)
            return response
        }
        if(method == 'redeemGiftCard'){
            var code = orderInfo['code']
            var apiKey = orderInfo['apiKey']
            var secretKey = orderInfo['secretKey']

            var response = await redeemGiftCardWallet(code, apiKey, secretKey)
            return response 
        }


        if(method == 'getBalance'){
            var symbol = orderInfo.symbol
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
           
            var response = await getBalanceBinance(symbol, apiKey, secretKey)
            return response
        }
        if(method == 'getMarginBalance'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getBalanceBinanceMargin(apiKey, secretKey)
            return response 
        }
        if(method == 'getMaxBorrowMargin'){
            var symbol = orderInfo.symbol
            var currency = orderInfo.currency
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getMaxBorrowMargin(symbol, currency, apiKey, secretKey)
            return response 
        }
        if(method == 'borrowAssetsMargin'){
            var symbol = orderInfo.symbol
            var amount = orderInfo.amount
            var isIsolated = orderInfo.isIsolated
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await borrowAssetsMargin(symbol, amount, isIsolated, apiKey, secretKey)
            return response
        }
        if(method == 'repayAssetsMargin'){
            var symbol = orderInfo.symbol
            var amount = orderInfo.amount
            var isIsolated = orderInfo.isIsolated
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await repayAssetsMargin(symbol, amount, isIsolated, apiKey, secretKey)
            return response
        }
        if(method == 'getOpenOrdersMargin'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey 
            var response = await getOpenOrdersMargin(apiKey, secretKey)
            return response
        }
        if(method == 'changeFuturesAssetMode'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey 
            var response = await changeFuturesAssetMode(apiKey, secretKey)
            return response
        }
        if(method == 'getFuturesAssetMode'){
            var apiKey = orderInfo.apiKey 
            var secretKey = orderInfo.secretKey 
            var response = await getFuturesAssetMode(apiKey, secretKey)
            return response
        }
        if(method == 'changeAssetModeFutures'){
            var method = orderInfo.method 
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await changeCurrentPosition(method, apiKey, secretKey)
            return response
        }
        if(method == 'getAssetModeFutures'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getCurrentPosition(apiKey, secretKey)
            return response
        }
    
        if(method == 'getPossitionInformation'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getPossitionInformation(apiKey, secretKey)
            return response
        }
        if(method == 'getBalanceFutures'){
            var symbol = orderInfo.symbol
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getBalanceBinanceFutures(symbol, apiKey, secretKey)
            return response
        }
        if(method == 'getBalanceFULLBinance'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
           
            var response = await getBalanceFULLBinance(apiKey, secretKey)
            return response
        }
        if(method == 'getBalanceFULLBinanceFunding'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey 
            var response = await getBalanceFULLBalanceFunding(apiKey, secretKey)
            return response
        }
        if(method == 'getBalanceFULLBinanceFutures'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getBalanceFuturesFULLBinance(apiKey, secretKey)
            return response
        }
        if(method == 'getBalanceFULLBinanceFutures2'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getBalanceFuturesFULLBinance2(apiKey, secretKey)
            return response
        }
        if(method == 'getBalanceandPositionsFutures'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getBalancesandPositionsFutures(apiKey, secretKey)
            return response
    
        }
        if(method == 'getOpenOrders'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey  
            var response = await getOpenOrdersBinance(apiKey, secretKey)
            return response
        }
        if(method == 'getOpenOrdersFutures'){
            var apiKey = orderInfo.apiKey 
            var secretKey = orderInfo.secretKey 
            var response = await getOpenOrdersBinanceFutures(apiKey, secretKey)
            return response
            
        }
        if(method == 'getHistory'){
            var symbol = orderInfo.symbol
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
           
            var response = await getOrderHistoryBinance(symbol, apiKey, secretKey)
            return response
        }
        if(method == 'getHistoryFutures'){
            var symbol = orderInfo.symbol 
            var apiKey = orderInfo.apiKey 
            var secretKey = orderInfo.secretKey
            var response = await getOrderHistoryBinanceFutures(symbol, apiKey, secretKey)
            return response
        }
        if(method == 'getHistoryMargin'){
            var symbol = orderInfo.symbol
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getOrderHistoryBinanceMargin(symbol, apiKey, secretKey)
            return response
        }
        if(method == 'getTradeList'){
            var symbol = orderInfo.symbol
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getTradeListBinance(symbol, apiKey, secretKey)
            return response
        }
        if(method == 'getTradeListFutures'){
            var symbol = orderInfo.symbol
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getTradeListBinanceFutures(symbol, apiKey, secretKey)
            return response 
        }
        if(method == 'getTradeListMargin'){
            var symbol = orderInfo.symbol
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getTradeListBinanceMargin(symbol, apiKey, secretKey)
            return response
        }
        if(method =='cancelOrder'){
            var symbol = orderInfo.symbol
            var orderid = orderInfo.orderid
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
    
            var response = await cancelOrderBinance(symbol, orderid, apiKey, secretKey)
            return response
        }
        if(method == 'cancelOrderFutures'){
            var symbol = orderInfo.symbol 
            var orderid = orderInfo.orderid 
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await cancelOrderBinanceFutures(symbol, orderid, apiKey, secretKey)
            return response
        }
        if(method == 'cancelOrderMargin'){
            var symbol = orderInfo.symbol
            var orderid = orderInfo.orderId
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey 
            var response = await cancelOrderBinanceMargin(symbol, orderid, apiKey, secretKey) 
            return response 
    
        }
        if(method == 'convertDust'){
            var currency = orderInfo.currency
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await convertDustTransfer(currency, apiKey, secretKey)
            return response
        }
        if(method == 'createFlexibleEarn'){
            var asset = orderInfo['asset']
            var amount = orderInfo['amount']
            var apiKey = orderInfo['apiKey']
            var secretKey = orderInfo['secretKey']
            var response = await createFlexibleEarn(asset, amount, apiKey, secretKey)
            return response

        }
        if(method == 'redeemFlexibleProduct'){
            var asset = orderInfo['asset']
            var apiKey = orderInfo['apiKey']
            var secretKey = orderInfo['secretKey']
            var response = await redeemFlexibleEarn(asset, apiKey, secretKey)
            return response
        }
        if(method == 'flexibleInterestHistory'){
            var asset = orderInfo['asset']
            var type = orderInfo['lendingType']
            var apiKey = orderInfo['apiKey']
            var secretKey = orderInfo['secretKey']
            var response = await getFlexibleInterestHistory(asset, type, apiKey, secretKey)
            return response
        }


        if(method == 'allCoins'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getCoinInformation(apiKey, secretKey)
            return response
        }
        if(method == 'createUniversalTransfer'){
            var currency = orderInfo.asset 
            var amount = orderInfo.amount
            var type = orderInfo.type
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await createUniversalTransfer(currency, amount, type, apiKey, secretKey)
            return response
    
        }
        if(method == 'createUniversalTransfer2'){
            var currency = orderInfo.asset 
            var amount = orderInfo.amount
            var type = orderInfo.type
            var symbol = orderInfo.symbol
            var apiKey = orderInfo.apiKey
            var param = orderInfo.param
            var secretKey = orderInfo.secretKey
            var response = await createUniversalTransfer2(param, symbol, currency, amount, type, apiKey, secretKey)
            return response
    
        }
        if(method == 'getIpPermissions'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getAPIPermissions(apiKey, secretKey)
            return response
        }
        if(method == 'systemStatus'){
            var response = await getSystemStatus()
            return response
        }
        if(method == 'tradingStatus'){
            var apiKey = orderInfo.apiKey
            var secretKey = orderInfo.secretKey
            var response = await getTradingStatus(apiKey, secretKey)
            return response
        }
        if(method == 'createOrder'){
            symbol = orderInfo.symbol
            type = orderInfo.type
            side = orderInfo.side
            amount = orderInfo.amount
            price = orderInfo.price
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await createOrderBinance(symbol, type, side, amount, price, apiKey, secretKey)
            return response
        }
        if(method == 'createOrderFutures'){
            symbol = orderInfo.symbol
            type = orderInfo.type
            side = orderInfo.side
            amount = orderInfo.amount
            price = orderInfo.price
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await createOrderBinanceFutures(symbol, type, side, amount, price, apiKey, secretKey)
            return response
        }
        if(method == 'createOrderMargin'){
            symbol = orderInfo.symbol
            type = orderInfo.type
            side = orderInfo.side
            amount = orderInfo.amount
            price = orderInfo.price
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await createOrderBinanceMargin(symbol, type, side, amount, price, apiKey, secretKey)
            return response
        }
        if(method == 'closepositionsfutures'){
            symbol = orderInfo.symbol
            type = orderInfo.type
            side = orderInfo.side
            quantity = orderInfo.quantity
            reduceOnly = orderInfo.reduceOnly
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await closePositionsBinanceFutures(symbol, type, side, quantity, reduceOnly, apiKey, secretKey)
            return response
        }
        if(method == 'changeinitialleverage'){
            symbol = orderInfo.symbol 
            leverage = orderInfo.leverage
            apiKey = orderInfo.apiKey 
            secretKey = orderInfo.secretKey
            var response = await changeinitialleverage(symbol, leverage, apiKey, secretKey)
            return response
    
        }
    
        if(method == 'createOrder2'){
            symbol = orderInfo.symbol
            type = orderInfo.type
            side = orderInfo.side
            amount = orderInfo.amount
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await createOrderBinance2(symbol, type, side, amount, apiKey, secretKey)
            return response
        }
        if(method == 'createOrderFutures2'){
            symbol = orderInfo.symbol
            type = orderInfo.type
            side = orderInfo.side
            amount = orderInfo.amount
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await createOrderBinanceFutures2(symbol, type, side, amount, apiKey, secretKey)
            return response
        }
        if(method == 'createOrderMargin2'){
            symbol = orderInfo.symbol
            type = orderInfo.type
            side = orderInfo.side
            amount = orderInfo.amount
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await createOrderBinanceMargin2(symbol, type, side, amount, apiKey, secretKey)
            return response
        }
        if(method == 'createStopLoss'){
            symbol = orderInfo.symbol 
            type = orderInfo.type
            side = orderInfo.side 
            amount = orderInfo.amount
            price = orderInfo.price 
            stopprice = orderInfo.stopPrice
            apiKey = orderInfo.apiKey 
            secretKey = orderInfo.secretKey
    
    
            var response = await createOrderBinanceStopLoss(symbol, type, side, amount, price, stopprice, apiKey, secretKey)
            return response
    
        }
        if(method == 'createStopLossFutures'){
            symbol = orderInfo.symbol 
            type = orderInfo.type
            side = orderInfo.side 
            amount = orderInfo.amount
            price = orderInfo.price 
            stopprice = orderInfo.stopPrice
            apiKey = orderInfo.apiKey 
            secretKey = orderInfo.secretKey
    
            var response = await createOrderBinanceFuturesStopLoss(symbol, type, side, amount, price, stopprice, apiKey, secretKey)
            return response
        }
        if(method == 'createStopLossMargin'){
            symbol = orderInfo.symbol 
            type = orderInfo.type
            side = orderInfo.side 
            amount = orderInfo.amount
            price = orderInfo.price 
            stopprice = orderInfo.stopPrice
            apiKey = orderInfo.apiKey 
            secretKey = orderInfo.secretKey
    
            var response = await createOrderBinanceMarginStopLoss(symbol, type, side, amount, price, stopprice, apiKey, secretKey)
            return response
        }
        if(method == 'getWithdrawalHistory'){
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await getWithdrawalHistory(apiKey, secretKey)
            return response
        }
        if(method == 'getDepositHistory'){
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await getDepositHistory(apiKey, secretKey)
            return response
        }
        if(method == 'getPayDepositHistory'){
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await getPayDepositHistory(apiKey, secretKey)
            return response
        }
        if(method == 'getEarnProducts'){
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await getEarnProducts(apiKey, secretKey)
            return response
        }
        if(method == 'getEarnProducts2'){
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await getEarnProducts2(apiKey, secretKey)
            return response
        }

        if(method == 'getDepositAddresses'){
            coin = orderInfo.coin
            network = orderInfo.network
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await getDepositAddresses(coin, network, apiKey, secretKey)
            return response
        }
        if(method == 'SendWithdraw'){
            coin = orderInfo.coin
            address = orderInfo.address
            amount = orderInfo.amount
            network = orderInfo.network
            apiKey = orderInfo.apiKey
            secretKey = orderInfo.secretKey
            var response = await createNewWithdraw(coin, address, amount, network, apiKey, secretKey)
            return response
    
        }
    
        if(method == 'binancepay'){
            var response = await createPayOrder()
            return response
        }
    } catch(e){
        if(e !== undefined){
            return []
        }
    }
}


module.exports = binanceClient
