const express = require("express");
const path = require("path");

const app = express();

// استخدام البورت المعين من Render أو البورت 3000 للمحلي
const PORT = process.env.PORT || 3000;

// عرض الملفات الثابتة (index.html, script.js, style.css) الموجودة في نفس المجلد
app.use(express.static(__dirname));

// توجيه الرابط الرئيسي / لعرض ملف index.html
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
const [ratesResponse, goldResponse, silverResponse] =
    await Promise.all([
        fetch(RATES_API_URL),
        fetch(GOLD_API_URL),
        fetch(SILVER_API_URL)
    ]);


        const ratesData = await ratesResponse.json();
        const goldData = await goldResponse.json();
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


        // =========================
        // GOLD
        // =========================

        const gold24 = goldData.data.find(
            gold => gold.type === "24K"
        );

        const gold21 = goldData.data.find(
            gold => gold.type === "21K"
        );


        const gold24SYP =
            gold24.priceUSD * usd.sell;

        const gold21SYP =
            gold21.priceUSD * usd.sell;


        // =========================
        // SILVER
        // =========================

        const silverSYP =
            silverData.price * usd.sell / 31.1034768;


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

            SILVER: silverSYP

        });

    } catch (error) {

        console.error(
            "حدث خطأ أثناء جلب بيانات السوق:",
            error
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
    console.log(`Server is running on port ${PORT}`);
});
