async function getMarketData() {

    try {

        // جلب البيانات من الـBackend
        const response = await fetch("/api/market");
        const data = await response.json();


        // =========================
        // USD
        // =========================
        if (data?.USD) {
            document.getElementById("usdBuy").textContent =
                data.USD.buy?.toLocaleString("en-US") || "--";

            document.getElementById("usdSell").textContent =
                data.USD.sell?.toLocaleString("en-US") || "--";
        }


        // =========================
        // EUR
        // =========================
        if (data?.EUR) {
            document.getElementById("eurBuy").textContent =
                data.EUR.buy?.toLocaleString("en-US") || "--";

            document.getElementById("eurSell").textContent =
                data.EUR.sell?.toLocaleString("en-US") || "--";
        }


        // =========================
        // TRY
        // =========================
        if (data?.TRY) {
            document.getElementById("tryBuy").textContent =
                data.TRY.buy?.toLocaleString("en-US") || "--";

            document.getElementById("trySell").textContent =
                data.TRY.sell?.toLocaleString("en-US") || "--";
        }


        // =========================
        // GOLD 24K
        // =========================
        if (data?.GOLD?.["24K"] !== undefined) {
            document.getElementById("gold24Price").textContent =
                data.GOLD["24K"]?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "--";
        }


        // =========================
        // GOLD 21K
        // =========================
        if (data?.GOLD?.["21K"] !== undefined) {
            document.getElementById("gold21Price").textContent =
                data.GOLD["21K"]?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "--";
        }


       if (data?.SILVER !== undefined) {
    document.getElementById("silverPrice").textContent =
        data.SILVER.toLocaleString("en-US", {
            maximumFractionDigits: 0
        });
}


        // =========================
        // UPDATE TIME
        // =========================
        const now = new Date();
        document.getElementById("updateTime").textContent =
            now.toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' });


    } catch (error) {

        console.error(
            "حدث خطأ أثناء جلب بيانات السوق:",
            error
        );

    }

}

// تشغيل الأسعار عند فتح الموقع
getMarketData();

// تحديث الأسعار كل دقيقة
setInterval(getMarketData, 60000);