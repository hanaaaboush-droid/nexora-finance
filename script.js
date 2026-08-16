let isLoading = false;
let hasLoadedOnce = false;


// =========================
// GET MARKET DATA
// =========================

async function getMarketData() {

    // منع طلبين بنفس الوقت
    if (isLoading) {
        return;
    }

    isLoading = true;

    const updateTime = document.getElementById("updateTime");


    // =========================
    // LOADING MESSAGE
    // =========================

    if (!hasLoadedOnce) {

        updateTime.textContent =
            "جاري الاتصال بالخادم وتحديث الأسعار...";

    } else {

        updateTime.textContent =
            "جاري تحديث الأسعار...";

    }


    try {

        const response = await fetch(
            "/api/market",
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {
            throw new Error(
                `Server error: ${response.status}`
            );
        }


        const data = await response.json();


        if (data.error) {
            throw new Error(data.error);
        }


        // =========================
        // USD
        // =========================

        document.getElementById("usdBuy").textContent =
            Number(data.USD.buy).toLocaleString("en-US");

        document.getElementById("usdSell").textContent =
            Number(data.USD.sell).toLocaleString("en-US");


        // =========================
        // EUR
        // =========================

        document.getElementById("eurBuy").textContent =
            Number(data.EUR.buy).toLocaleString("en-US");

        document.getElementById("eurSell").textContent =
            Number(data.EUR.sell).toLocaleString("en-US");


        // =========================
        // TRY
        // =========================

        document.getElementById("tryBuy").textContent =
            Number(data.TRY.buy).toLocaleString("en-US");

        document.getElementById("trySell").textContent =
            Number(data.TRY.sell).toLocaleString("en-US");


        // =========================
        // GOLD 24K
        // =========================

        document.getElementById("gold24Price").textContent =
            Number(data.GOLD["24K"]).toLocaleString("en-US", {
                maximumFractionDigits: 0
            });


        // =========================
        // GOLD 21K
        // =========================

        document.getElementById("gold21Price").textContent =
            Number(data.GOLD["21K"]).toLocaleString("en-US", {
                maximumFractionDigits: 0
            });


        // =========================
        // SILVER
        // =========================

        document.getElementById("silverPrice").textContent =
            Number(data.SILVER).toLocaleString("en-US", {
                maximumFractionDigits: 0
            });


        // =========================
        // LAST UPDATE
        // =========================

        if (data.updatedAt) {

            const date = new Date(data.updatedAt);

            updateTime.textContent =
                date.toLocaleTimeString("ar-SA", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });

        } else {

            updateTime.textContent =
                "غير متوفر";

        }


        hasLoadedOnce = true;

        console.log("✅ تم تحديث الأسعار بنجاح");


    } catch (error) {

        console.error(
            "❌ خطأ في تحديث الأسعار:",
            error
        );


        // =========================
        // IMPORTANT:
        // لا نمسح الأسعار الموجودة
        // =========================

        if (!hasLoadedOnce) {

            updateTime.textContent =
                "⏳ الخادم يستغرق وقتًا للبدء... سنحاول مجددًا";

        } else {

            updateTime.textContent =
                "تعذر التحديث مؤقتًا — الأسعار السابقة ما زالت معروضة";

        }

    } finally {

        isLoading = false;

    }

}


// =========================
// FIRST LOAD
// =========================

getMarketData();


// =========================
// RETRY AFTER 10 SECONDS
// =========================

// مفيد جدًا إذا كان Render نائمًا
setTimeout(() => {

    if (!hasLoadedOnce) {
        getMarketData();
    }

}, 10000);


// =========================
// UPDATE EVERY 60 SECONDS
// =========================

setInterval(() => {

    getMarketData();

}, 60000);
