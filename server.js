const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;


// =========================
// WEBSITE
// =========================

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


// =========================
// API LINKS
// =========================

// العملات - LiraNews
const RATES_API_URL =
    "https://liranews.info/api/public/v1/price/usdsypd,eursyp,trysypd";

// الذهب - LiraScope
const GOLD_API_URL =
    "https://lirascope.syria-cloud.sy/api/v1/gold/latest?lang=ar";

// الفضة
const SILVER_API_URL =
    "https://api.gold-api.com/price/XAG";


// =========================
// MARKET API
// =========================

app.get("/api/market", async (req, res) => {

    try {

        // =========================
        // GET CURRENCIES
        // =========================

        const ratesResponse = await fetch(RATES_API_URL);

        if (!ratesResponse.ok) {
            throw new Error(
                `Currency API error: ${ratesResponse.status}`
            );
        }

        const ratesData = await ratesResponse.json();


        // =========================
        // CURRENCIES
        // =========================

        const usd = ratesData.usdsypd;
        const eur = ratesData.eursyp;
        const tryRate = ratesData.trysypd;


        if (!usd || !eur || !tryRate) {
            throw new Error(
                "Currency data is missing"
            );
        }


        // =========================
        // GET GOLD
        // =========================

        const goldResponse = await fetch(GOLD_API_URL);

        if (!goldResponse.ok) {
            throw new Error(
                `Gold API error: ${goldResponse.status}`
            );
        }

        const goldData = await goldResponse.json();


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
                "Gold 24K or 21K data is missing"
            );
        }


        const gold24SYP =
            gold24.priceUSD * usd.sell;

        const gold21SYP =
            gold21.priceUSD * usd.sell;


        // =========================
        // GET SILVER
        // =========================

        const silverResponse = await fetch(SILVER_API_URL);

        if (!silverResponse.ok) {
            throw new Error(
                `Silver API error: ${silverResponse.status}`
            );
        }

        const silverData = await silverResponse.json();


        // =========================
        // SILVER
        // =========================

        const silverSYP =
            silverData.price *
            usd.sell /
            31.1034768;


        // =========================
        // LAST UPDATE
        // =========================

        const updateTime =
            usd.price_updated_at;


        // =========================
        // SEND DATA TO WEBSITE
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

            updatedAt: updateTime

        });

    } catch (error) {

        console.error(
            "MARKET ERROR:",
            error.message
        );

        res.status(500).json({
            error: "Failed to get market data"
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
