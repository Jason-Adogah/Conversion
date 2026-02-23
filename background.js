
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/CNY';
const CACHE_DURATION = 3600000; //1 hour 

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('CNY to CAD Converter installed');
  updateExchangeRate();
});


//Fetch and cache echange rate
async function updateExchangeRate(){

    try{
        const response = await fetch(EXCHANGE_RATE_API);
        const data = await response.json();

        if (data.rates && data.rates.CAD){
            const exchangeData = {
                rate: data.rates.CAD,
                timestamp: Data.now(),
                lastUpdated: new Date().toLocaleString()
            };
        }

        await chrome.storage.local.set({exchangeData});
        console.log('Exchange rate updated:', data.rates.CAD, "CNY to CAD");
        return exchangeData;
    }

    catch (error){
        console.error('Failed to fetch exchange rate: ', error);

        //Return fallback rate if fetch fails
        return{
            rate: 0.19,
            timestamp: Date.now(),
            lastUpdated:"Using fallback rate"
        };
    }
}

//Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>{
    if (request.action === 'getExchangeRate'){
        chrome.storage.local.get('exchangeDate', async (result) =>{
            const data = result.exchangeData;

            //Check if cache is valid
            if (data && (Date.now() - data.timestamp < CACHE_DURATION)) {
                sendResponse({
                    rate: data.rate,
                    lastUpdated: data.lastUpdated
                });
            } 

            else{
                //Update rate and return 
                const newData = await updateExchangeRate();
                sendResponse({
                    rate: newData.rate,
                    lastUpdated: newData.lastUpdated
                });
            }
        });

        return true; //Keep message channel open for async response

    }
});

//Update rate periodically
chrome.alarms.create('updateRate', {periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateRate'){
        updateExchangeRate();
    }
})