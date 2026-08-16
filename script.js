async function getMarketData() {

    const updateTime = document.getElementById("updateTime");

    // إظهار حالة التحميل
    updateTime.textContent = "جاري تحديث الأسعار...";

    try {

        // أضيفي وقت اللحظة الحالية لنهاية الرابط لمنع المتصفح من تخزين الأسعار القديمة
        const response = await fetch("/api/market?t=" + new Date().getTime());

        if (!response.ok) {
            throw new Error("فشل الاتصال بالخادم");
        }

        const data = await response.json();

        // Helper function لتنسيق الأرقام بشكل آمن
        const formatNumber = (val) => {
            return (val !== null && val !== undefined && !isNaN(val))
                ? Number(val).toLocaleString("en-US", { maximumFractionDigits: 0 })
                : "--";
        };

        // =========================
        // USD
        // =========================
        document.getElementById("usdBuy").textContent =
            data.USD?.buy ? Number(data.USD.buy).toLocaleString("en-US") : "--";

        document.getElementById("usdSell").textContent =
            data.USD?.sell ? Number(data.USD.sell).toLocaleString("en-US") : "--";

        // =========================
        // EUR
        // =========================
        document.getElementById("eurBuy").textContent =
            data.EUR?.buy ? Number(data.EUR.buy).toLocaleString("en-US") : "--";

        document.getElementById("eurSell").textContent =
            data.EUR?.sell ? Number(data.EUR.sell).toLocaleString("en-US") : "--";

        // =========================
        // TRY
        // =========================
        document.getElementById("tryBuy").textContent =
            data.TRY?.buy ? Number(data.TRY.buy).toLocaleString("en-US") : "--";

        document.getElementById("trySell").textContent =
            data.TRY?.sell ? Number(data.TRY.sell).toLocaleString("en-US") : "--";

        // =========================
        // GOLD 24K
        // =========================
        document.getElementById("gold24Price").textContent =
            formatNumber(data.GOLD?.["24K"]);

        // =========================
        // GOLD 21K
        // =========================
        document.getElementById("gold21Price").textContent =
            formatNumber(data.GOLD?.["21K"]);

        // =========================
        // SILVER
        // =========================
        document.getElementById("silverPrice").textContent =
            formatNumber(data.SILVER);

        // =========================
        // LAST UPDATE
        // =========================
        const now = new Date();
        updateTime.textContent = now.toLocaleTimeString("ar-SY", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });

        console.log("تم تحديث الأسعار بنجاح");

    } catch (error) {
        console.error("خطأ:", error);
        updateTime.textContent = "تعذر تحديث الأسعار";
    }
}

// التشغيل المبدئي
getMarketData();

// تحديث تلقائي كل دقيقة
setInterval(getMarketData, 60000);
