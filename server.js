const express = require("express");
const path = require("path");
const { Pool } = require("pg");


const app = express();
const PORT = process.env.PORT || 3000;
// =========================
// NEWS DATABASE
// =========================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// =========================
// WEBSITE STATIC FILES
// =========================
app.use(express.static(__dirname));
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
// =========================
// NEWS TABLE
// =========================

async function createNewsTable() {
    try {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,

                title TEXT NOT NULL,

                content TEXT NOT NULL,

                category VARCHAR(50) NOT NULL,

                is_breaking BOOLEAN DEFAULT FALSE,

                is_pinned BOOLEAN DEFAULT FALSE,

                delete_mode VARCHAR(20) DEFAULT 'manual',

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("News table is ready.");

    } catch (error) {

        console.error(
            "NEWS DATABASE ERROR:",
            error.message
        );

    }
}

createNewsTable();
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
// CREATE NEWS
// =========================

app.post("/api/news", async (req, res) => {

    try {

        const {
            title,
            content,
            category,
            isBreaking,
            isPinned,
            deleteMode
        } = req.body;


        if (!title || !content || !category) {

            return res.status(400).json({
                error: "Title, content and category are required."
            });

        }


        const result = await pool.query(
            `
            INSERT INTO news
            (
                title,
                content,
                category,
                is_breaking,
                is_pinned,
                delete_mode
            )

            VALUES ($1, $2, $3, $4, $5, $6)

            RETURNING *
            `,
            [
                title,
                content,
                category,
                Boolean(isBreaking),
                Boolean(isPinned),
                deleteMode || "manual"
            ]
        );


        res.status(201).json({
            success: true,
            news: result.rows[0]
        });


    } catch (error) {

        console.error(
            "CREATE NEWS ERROR:",
            error.message
        );

        res.status(500).json({
            error: "Failed to create news."
        });

    }

});// =========================
// GET NEWS
// =========================

app.get("/api/news", async (req, res) => {

    try {

        // حذف الأخبار التي انتهت مدتها
        await pool.query(`
            DELETE FROM news

            WHERE delete_mode = '24h'

            AND created_at <= NOW() - INTERVAL '24 hours'
        `);


        const result = await pool.query(`
            SELECT *

            FROM news

            ORDER BY
                is_pinned DESC,
                created_at DESC
        `);


        res.json(result.rows);


    } catch (error) {

        console.error(
            "GET NEWS ERROR:",
            error.message
        );

        res.status(500).json({
            error: "Failed to get news."
        });

    }

});
// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
