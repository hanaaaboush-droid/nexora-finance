async function loadNews() {

    const newsGrid = document.querySelector(".news-grid");

    if (!newsGrid) {
        console.error("لم يتم العثور على .news-grid");
        return;
    }

    try {

        const response = await fetch(
            "/api/news?t=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("فشل جلب الأخبار: " + response.status);
        }

        const newsList = await response.json();

        if (!Array.isArray(newsList)) {
            throw new Error("بيانات الأخبار غير صحيحة");
        }

        // =========================
        // NO NEWS
        // =========================

        if (newsList.length === 0) {

            newsGrid.innerHTML = `
                <div class="no-news">
                    <div class="no-news-icon">📰</div>

                    <h3>لا توجد أخبار حالياً</h3>

                    <p>
                        يرجى العودة لاحقاً لمتابعة أحدث التحديثات.
                    </p>
                </div>
            `;

            return;
        }

        // =========================
        // DISPLAY NEWS
        // =========================

        newsGrid.innerHTML = newsList.map(news => {

            const isBreaking =
                news.is_breaking === true;

            const isPinned =
                news.is_pinned === true;

            let cardClasses = "news-card";

            if (isBreaking) {
                cardClasses += " breaking";
            }

            if (isPinned) {
                cardClasses += " pinned";
            }

            return `
                <article class="${cardClasses}">

                    ${
                        isBreaking
                            ? `
                                <span class="breaking-label">
                                    🚨 عاجل
                                </span>
                              `
                            : ""
                    }

                    ${
                        isPinned
                            ? `
                                <span class="pinned-label">
                                    📌 مثبت
                                </span>
                              `
                            : ""
                    }

                    <div class="news-content">

                        <div class="news-meta">

                            <span class="news-category">
                                ${getCategoryLabel(news.category)}
                            </span>

                            <span class="news-date">
                                ${formatDate(news.created_at)}
                            </span>

                        </div>

                        <h2>
                            ${escapeHtml(news.title)}
                        </h2>

                        <p>
                            ${escapeHtml(news.content)}
                        </p>

                        <a
                            href="#"
                            class="read-more"
                            onclick="return false;"
                        >
                            اقرأ المزيد ←
                        </a>

                    </div>

                </article>
            `;

        }).join("");

    } catch (error) {

        console.error("خطأ في جلب الأخبار:", error);

        newsGrid.innerHTML = `
            <div class="no-news">

                <div class="no-news-icon">
                    ⚠️
                </div>

                <h3>
                    تعذر تحميل الأخبار
                </h3>

                <p>
                    حدث خطأ أثناء الاتصال بالخادم.
                </p>

            </div>
        `;
    }
}


// =========================
// CATEGORY
// =========================

function getCategoryLabel(category) {

    const categories = {

        breaking: "🚨 أخبار عاجلة",

        economic: "💰 أخبار اقتصادية",

        technology: "💻 أخبار تقنية",

        general: "📰 أخبار عامة"

    };

    return categories[category] || "📰 أخبار عامة";
}


// =========================
// ESCAPE HTML
// =========================

function escapeHtml(text) {

    if (!text) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================
// DATE
// =========================

function formatDate(dateString) {

    if (!dateString) {
        return "منذ دقائق";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "منذ دقائق";
    }

    return date.toLocaleDateString(
        "ar-SY",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// =========================
// START
// =========================

document.addEventListener(
    "DOMContentLoaded",
    loadNews
);
