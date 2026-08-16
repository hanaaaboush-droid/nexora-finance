const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


// =========================
// API LINKS
// =========================

const RATES_API_URL =
    "https://lirascope.syria-cloud.sy/api/v1/rates/latest?currencies=USD,EUR,TRY&lang=ar";

const GOLD_API_URL =
    "https://lirascope.syria-cloud.sy/api/v1/gold/latest?lang=ar";

const SILVER_API_URL =
    "https://api.gold-api.com/price/XAG";


// =========================
// MARKET API
// =========================

app.get("/api/market", async (req, res) => {

    try {

        // جلب كل API بشكل مستقل
        const ratesResponse = await fetch(RATES_API_URL);

        if (!ratesResponse.ok) {
            throw new Error(
                `Rates API error: ${ratesResponse.status}`
            );
        }

        const ratesData = await ratesResponse.json();


        const goldResponse = await fetch(GOLD_API_URL);

        if (!goldResponse.ok) {
            throw new Error(
                `Gold API error: ${goldResponse.status}`
            );
        }

        const goldData = await goldResponse.json();


        const silverResponse = await fetch(SILVER_API_URL);

        if (!silverResponse.ok) {
            throw new Error(
                `Silver API error: ${silverResponse.status}`
            );
        }

        const silverData = await silverResponse.json();


        // =========================
        // CURRENCIES
        // =========================

        const rates = ratesData.marketRates;

        const usd = rates.find(
            rate => rate.currency === "USD"
        );

        const eur = rates.find(
            rate => rate.currency === "EUR"
        );

        const tryRate = rates.find(
            rate => rate.currency === "TRY"
        );


        if (!usd || !eur || !tryRate) {
            throw new Error(
                "USD / EUR / TRY data not found"
            );
        }


        // =========================
        // GOLD
        // =========================

        const gold24 = goldData.data.find(
            gold => gold.type === "24K"
        );

        const gold21 = goldData.data.find(
            gold => gold.type === "21K"
        );


        if (!gold24 || !gold21) {
            throw new Error(
                "24K / 21K gold data not found"
            );
        }


        const gold24SYP =
            gold24.priceUSD * usd.sell;

        const gold21SYP =
            gold21.priceUSD * usd.sell;


        // =========================
        // SILVER
        // =========================

        const silverSYP =
            silverData.price *
            usd.sell /
            31.1034768;


        // =========================
        // SEND DATA
        // =========================

        res.json({

            USD: {
                buy: usd.buy,
                sell: usd.sell
            },

            EUR: {
                buy: eur.buy,
                sell: eur.sell
            },

            TRY: {
                buy: tryRate.buy,
                sell: tryRate.sell
            },

            GOLD: {
                "24K": gold24SYP,
                "21K": gold21SYP
            },

            SILVER: silverSYP,

            updatedAt: new Date().toISOString()

        });

    } catch (error) {

        console.error(
            "MARKET ERROR:",
            error.message
        );

        res.status(500).json({
            error: error.message
        });

    }

});


// =========================
// START SERVER
// =========================

app.listen(PORT, () => {

    console.log(
        `Server is running on port ${PORT}`
    );

});
