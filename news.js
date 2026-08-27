
async function loadNews() {

    const newsGrid = document.querySelector(".news-grid");

    if (!newsGrid) return;

    try {

        const response = await fetch(
            "/api/news?t=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("فشل جلب الأخبار");
        }

        const newsList = await response.json();

        if (!Array.isArray(newsList)) {
            throw new Error("بيانات الأخبار غير صحيحة");
        }

        // لا توجد أخبار
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

        // عرض الأخبار القادمة من PostgreSQL
        newsGrid.innerHTML = newsList.map(news => {

            const isBreaking =
                news.is_breaking === true ||
                news.isBreaking === true;

            const isPinned =
                news.is_pinned === true ||
                news.isPinned === true;

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
                            ? '<span class="breaking-label">🚨 عاجل</span>'
                            : ''
                    }

                    ${
                        isPinned
                            ? '<span class="pinned-label">📌 مثبت</span>'
                            : ''
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

                <div class="no-news-icon">⚠️</div>

                <h3>تعذر تحميل الأخبار</h3>

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

    if (!text) return "";

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

function formatDate(dateStr) {

    if (!dateStr) {
        return "منذ دقائق";
    }

    const date = new Date(dateStr);

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
```
                            <span class="news-date">${formatDate(news.created_at || news.date)}</span>
                        </div>
                        <h2>${escapeHtml(news.title)}</h2>
                        <p>${escapeHtml(news.content)}</p>
                        <a href="#" class="read-more">اقرأ المزيد ←</a>
                    </div>
                </article>
            `;
        }).join('');

    } catch (error) {
        console.error("خطأ في جلب الأخبار:", error);
    }
}

function getCategoryLabel(cat) {
    const categories = {
        breaking: "🚨 أخبار عاجلة",
        economic: "💰 أخبار اقتصادية",
        technology: "💻 أخبار تقنية",
        general: "📰 أخبار عامة"
    };
    return categories[cat] || "📰 عام";
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDate(dateStr) {
    if (!dateStr) return "منذ دقائق";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-SY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

document.addEventListener("DOMContentLoaded", loadNews);
