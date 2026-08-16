const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// WEBSITE STATIC FILES
// =========================
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =========================
// API ENDPOINTS
// =========================
const RATES_API_URL = "https://liranews.info/api/public/v1/price/usdsypd,eursyp,trysypd";
const GOLD_API_URL = "https://api.gold-api.com/price/XAU";  // Gold Ounce USD
const SILVER_API_URL = "https://api.gold-api.com/price/XAG"; // Silver Ounce USD

// =========================
// MARKET API
// =========================
app.get("/api/market", async (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    try {
        // -------------------------
        // 1. CURRENCIES
        // -------------------------
        const ratesResponse = await fetch(RATES_API_URL);

        if (!ratesResponse.ok) {
            throw new Error(`Currency API error: ${ratesResponse.status}`);
        }

        const ratesData = await ratesResponse.json();
        const usd = ratesData.usdsypd;
        const eur = ratesData.eursyp;
        const tryRate = ratesData.trysypd;

        if (!usd || !eur || !tryRate) {
            throw new Error("Currency data is missing");
        }

        // -------------------------
        // 2. GOLD (24K & 21K)
        // -------------------------
        let gold24SYP = null;
        let gold21SYP = null;

        try {
            const goldResponse = await fetch(GOLD_API_URL);

            if (goldResponse.ok) {
                const goldData = await goldResponse.json();

                if (goldData && goldData.price) {
                    // غرام عيار 24 = (سعر الأونصة عالمياً ÷ 31.1034768) × سعر بيع الدولار
                    gold24SYP = (goldData.price / 31.1034768) * usd.sell;

                    // غرام عيار 21 = سعر عيار 24 × (21 ÷ 24)
                    gold21SYP = gold24SYP * (21 / 24);
                }
            } else {
                console.log("Gold API unavailable. Status:", goldResponse.status);
            }
        } catch (goldError) {
            console.log("Gold API error:", goldError.message);
        }

        // -------------------------
        // 3. SILVER
        // -------------------------
        let silverSYP = null;

        try {
            const silverResponse = await fetch(SILVER_API_URL);

            if (silverResponse.ok) {
                const silverData = await silverResponse.json();
                if (silverData && silverData.price) {
                    silverSYP = (silverData.price / 31.1034768) * usd.sell;
                }
            } else {
                console.log("Silver API unavailable. Status:", silverResponse.status);
            }
        } catch (silverError) {
            console.log("Silver API error:", silverError.message);
        }

        // -------------------------
        // 4. RESPONSE
        // -------------------------
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
            updatedAt: usd.price_updated_at || new Date().toISOString()
        });

    } catch (error) {
        console.error("MARKET ERROR:", error.message);
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
    console.log(`Server is running on port ${PORT}`);
});
