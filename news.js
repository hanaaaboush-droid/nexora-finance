async function loadNews() {
    const newsGrid = document.querySelector(".news-grid");
    if (!newsGrid) return;

    try {
        const response = await fetch("/api/news?t=" + new Date().getTime());
        if (!response.ok) throw new Error("فشل جلب الأخبار");

        const newsList = await response.json();

        if (!newsList || newsList.length === 0) {
            newsGrid.innerHTML = `
                <div class="no-news">
                    <div class="no-news-icon">📰</div>
                    <h3>لا توجد أخبار حالياً</h3>
                    <p>يرجى العودة لاحقاً لمتابعة أحدث التحديثات.</p>
                </div>`;
            return;
        }

        newsGrid.innerHTML = newsList.map(news => {
            const isBreaking = news.is_breaking || news.isBreaking;
            const isPinned = news.is_pinned || news.isPinned;

            let cardClasses = "news-card";
            if (isBreaking) cardClasses += " breaking";
            if (isPinned) cardClasses += " pinned";

            return `
                <article class="${cardClasses}">
                    ${isBreaking ? '<span class="breaking-label">🚨 عاجل</span>' : ''}
                    ${isPinned ? '<span class="pinned-label">📌 مثبت</span>' : ''}
                    
                    <div class="news-content">
                        <div class="news-meta">
                            <span class="news-category">${getCategoryLabel(news.category)}</span>
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
