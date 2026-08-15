async function getMarketData() {

    // إظهار حالة التحميل
    document.body.classList.add("loading");


    try {

        // نضع حدًا أقصى للانتظار: 15 ثانية
        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 15000);


        const response = await fetch("/api/market", {
            signal: controller.signal
        });


        clearTimeout(timeout);


        if (!response.ok) {
            throw new Error("Server error");
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

        if (data.GOLD && data.GOLD["24K"] !== undefined) {

            document.getElementById("gold24Price").textContent =
                Number(data.GOLD["24K"]).toLocaleString("en-US", {
                    maximumFractionDigits: 0
                });

        }


        // =========================
        // GOLD 21K
        // =========================

        if (data.GOLD && data.GOLD["21K"] !== undefined) {

            document.getElementById("gold21Price").textContent =
                Number(data.GOLD["21K"]).toLocaleString("en-US", {
                    maximumFractionDigits: 0
                });

        }


        // =========================
        // SILVER
        // =========================

        if (data.SILVER !== undefined) {

            document.getElementById("silverPrice").textContent =
                Number(data.SILVER).toLocaleString("en-US", {
                    maximumFractionDigits: 0
                });

        }


        // =========================
        // UPDATE TIME
        // =========================

        document.getElementById("updateTime").textContent =
            new Date().toLocaleTimeString("ar-SA");


        console.log("تم تحديث الأسعار بنجاح");


    } catch (error) {

        console.error("خطأ في تحميل الأسعار:", error);


        // رسالة للمستخدم
        document.getElementById("updateTime").textContent =
            "تعذر تحديث الأسعار";


    } finally {

        // انتهاء حالة التحميل
        document.body.classList.remove("loading");

    }

}


// تشغيل الأسعار عند فتح الموقع
getMarketData();


// تحديث الأسعار كل دقيقة
setInterval(getMarketData, 60000);
