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

// الذهب
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
        // CURRENCIES
        // =========================

        const ratesResponse = await fetch(RATES_API_URL);

        if (!ratesResponse.ok) {
            throw new Error(
                `Currency API error: ${ratesResponse.status}`
            );
        }

        const ratesData = await ratesResponse.json();

        const usd = ratesData.usdsypd;
        const eur = ratesData.eursyp;
        const tryRate = ratesData.trysypd;


        if (!usd || !eur || !tryRate) {
            throw new Error("Currency data is missing");
        }


        // =========================
        // GOLD
        // =========================

        let gold24SYP = null;
        let gold21SYP = null;

        try {

            const goldResponse = await fetch(GOLD_API_URL);

            if (goldResponse.ok) {

                const goldData = await goldResponse.json();

                const gold24 = goldData.data.find(
                    gold => gold.type === "24K"
                );

                const gold21 = goldData.data.find(
                    gold => gold.type === "21K"
                );

                if (gold24) {
                    gold24SYP =
                        gold24.priceUSD * usd.sell;
                }

                if (gold21) {
                    gold21SYP =
                        gold21.priceUSD * usd.sell;
                }

            } else {

                console.log(
                    "Gold API unavailable:",
                    goldResponse.status
                );

            }

        } catch (goldError) {

            console.log(
                "Gold API error:",
                goldError.message
            );

        }


        // =========================
        // SILVER
        // =========================

        const silverResponse = await fetch(SILVER_API_URL);

        if (!silverResponse.ok) {
            throw new Error(
                `Silver API error: ${silverResponse.status}`
            );
        }

        const silverData = await silverResponse.json();

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

            updatedAt: usd.price_updated_at

        });

    } catch (error) {

        console.error(
            "MARKET ERROR:",
            error.message
        );

        res.status(500).json({
            error: "Failed to get market data",
            details: error.message
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
