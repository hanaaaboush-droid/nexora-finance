async function getMarketData() {

    const updateTime = document.getElementById("updateTime");

    // إظهار حالة التحميل
    updateTime.textContent = "جاري تحديث الأسعار...";

    try {

        const response = await fetch("/api/market");

        if (!response.ok) {
            throw new Error("فشل الاتصال بالخادم");
        }

        const data = await response.json();

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

            updateTime.textContent = "غير متوفر";

        }


        console.log("تم تحديث الأسعار بنجاح");


    } catch (error) {

        console.error("خطأ:", error);

        updateTime.textContent =
            "تعذر تحديث الأسعار";

    }

}


// =========================
// INITIAL LOAD
// =========================

getMarketData();


// =========================
// UPDATE EVERY MINUTE
// =========================

setInterval(getMarketData, 60000);
