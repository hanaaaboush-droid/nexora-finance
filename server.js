const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// DATABASE
// =========================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// =========================
// MIDDLEWARE
// =========================

app.use(express.json({ limit: "10mb" }));

app.use(
    session({
        store: new PgSession({
            pool: pool,
            tableName: "user_sessions",
            createTableIfMissing: true
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    })
);

// =========================
// AUTHORIZATION
// =========================

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            error: "يجب تسجيل الدخول أولاً."
        });
    }

    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            error: "يجب تسجيل الدخول أولاً."
        });
    }

    if (req.session.user.role !== "admin") {
        return res.status(403).json({
            error: "ليس لديك صلاحية الوصول."
        });
    }

    next();
}

// =========================
// DATABASE TABLES
// =========================

async function createUsersTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Users table is ready.");
    } catch (error) {
        console.error("USERS DATABASE ERROR:", error.message);
    }
}

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
        console.error("NEWS DATABASE ERROR:", error.message);
    }
}

createUsersTable();
createNewsTable();

// =========================
// AUTH API
// =========================

// تسجيل الدخول
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "أدخل البريد الإلكتروني وكلمة المرور."
            });
        }

        const result = await pool.query(
            `
            SELECT id, name, email, password_hash, role
            FROM users
            WHERE email = $1
            `,
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "البريد الإلكتروني أو كلمة المرور غير صحيحة."
            });
        }

        const user = result.rows[0];

        const passwordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                error: "البريد الإلكتروني أو كلمة المرور غير صحيحة."
            });
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.json({
            success: true,
            message: "تم تسجيل الدخول بنجاح.",
            user: req.session.user
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error.message);

        res.status(500).json({
            error: "حدث خطأ أثناء تسجيل الدخول."
        });
    }
});

// معرفة المستخدم الحالي
app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            error: "غير مسجل الدخول."
        });
    }

    res.json({
        user: req.session.user
    });
});

// تسجيل الخروج
app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                error: "تعذر تسجيل الخروج."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "تم تسجيل الخروج."
        });
    });
});

// =========================
// PROTECTED PAGES
// =========================

// الصفحة الرئيسية مفتوحة للجميع
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// صفحة الأخبار تتطلب تسجيل الدخول
app.get("/news.html", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login.html?redirect=/news.html");
    }

    res.sendFile(path.join(__dirname, "news.html"));
});

// لوحة التحكم للـ Admin فقط
app.get("/admin.html", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login.html?redirect=/admin.html");
    }

    if (req.session.user.role !== "admin") {
        return res.redirect("/");
    }

    res.sendFile(path.join(__dirname, "admin.html"));
});

// الملفات العامة
app.use(express.static(__dirname));

// =========================
// MARKET API
// =========================

const RATES_API_URL =
    "https://liranews.info/api/public/v1/price/usdsypd,eursyp,trysypd";

const GOLD_API_URL =
    "https://api.gold-api.com/price/XAU";

const SILVER_API_URL =
    "https://api.gold-api.com/price/XAG";

app.get("/api/market", async (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    try {
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

        let gold24SYP = null;
        let gold21SYP = null;

        try {
            const goldResponse = await fetch(GOLD_API_URL);

            if (goldResponse.ok) {
                const goldData = await goldResponse.json();

                if (goldData && goldData.price) {
                    gold24SYP =
                        (goldData.price / 31.1034768) * usd.sell;

                    gold21SYP =
                        gold24SYP * (21 / 24);
                }
            }
        } catch (goldError) {
            console.log("Gold API error:", goldError.message);
        }

        let silverSYP = null;

        try {
            const silverResponse = await fetch(SILVER_API_URL);

            if (silverResponse.ok) {
                const silverData = await silverResponse.json();

                if (silverData && silverData.price) {
                    silverSYP =
                        (silverData.price / 31.1034768) * usd.sell;
                }
            }
        } catch (silverError) {
            console.log("Silver API error:", silverError.message);
        }

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
            updatedAt:
                usd.price_updated_at ||
                new Date().toISOString()
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
// CREATE NEWS - ADMIN ONLY
// =========================

app.post("/api/news", requireAdmin, async (req, res) => {
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
        console.error("CREATE NEWS ERROR:", error.message);

        res.status(500).json({
            error: "Failed to create news."
        });
    }
});

// =========================
// GET NEWS - LOGGED USERS
// =========================

app.get("/api/news", requireLogin, async (req, res) => {
    try {
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
        console.error("GET NEWS ERROR:", error.message);

        res.status(500).json({
            error: "Failed to get news."
        });
    }
});

// =========================
// DELETE NEWS - ADMIN ONLY
// =========================

app.delete("/api/news/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM news WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "الخبر غير موجود."
            });
        }

        res.json({
            success: true,
            message: "تم حذف الخبر بنجاح.",
            news: result.rows[0]
        });
    } catch (error) {
        console.error("DELETE NEWS ERROR:", error.message);

        res.status(500).json({
            error: "تعذر حذف الخبر."
        });
    }
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
