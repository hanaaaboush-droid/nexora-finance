```javascript
document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "/api/news";

    // =========================
    // ELEMENTS
    // =========================

    const openBtn = document.getElementById("openNewsForm");
    const closeBtn = document.getElementById("closeNewsForm");
    const cancelBtn = document.getElementById("cancelNewsForm");

    const addNewsPanel = document.getElementById("addNewsPanel");
    const newsForm = document.querySelector(".news-form");
    const newsTableBody = document.querySelector(".news-table tbody");

    const totalNewsStat = document.getElementById("statTotalNews");
    const breakingNewsStat = document.getElementById("statBreakingNews");
    const pinnedNewsStat = document.getElementById("statPinnedNews");
    const todayNewsStat = document.getElementById("statTodayNews");


    // =========================
    // OPEN / CLOSE FORM
    // =========================

    function togglePanel(show) {

        if (!addNewsPanel) return;

        if (show) {
            addNewsPanel.classList.add("active");
        } else {
            addNewsPanel.classList.remove("active");

            if (newsForm) {
                newsForm.reset();
            }
        }
    }

    if (openBtn) {
        openBtn.addEventListener("click", () => {
            togglePanel(true);
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            togglePanel(false);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            togglePanel(false);
        });
    }


    // =========================
    // FETCH NEWS
    // =========================

    async function fetchNews() {

        try {

            const response = await fetch(API_URL + "?t=" + Date.now());

            if (!response.ok) {
                throw new Error("Failed to fetch news");
            }

            const newsList = await response.json();

            if (!Array.isArray(newsList)) {
                throw new Error("Invalid news response");
            }

            renderTable(newsList);
            updateStats(newsList);

        } catch (error) {

            console.error("خطأ في جلب الأخبار:", error);

            if (newsTableBody) {
                newsTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center;">
                            تعذر تحميل الأخبار
                        </td>
                    </tr>
                `;
            }
        }
    }


    // =========================
    // RENDER TABLE
    // =========================

    function renderTable(newsList) {

        if (!newsTableBody) return;

        newsTableBody.innerHTML = "";

        if (newsList.length === 0) {

            newsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">
                        لا توجد أخبار حالياً
                    </td>
                </tr>
            `;

            return;
        }

        const categoryMap = {

            breaking: {
                label: "🚨 عاجل",
                class: "breaking"
            },

            economic: {
                label: "💰 اقتصادي",
                class: "economic"
            },

            technology: {
                label: "💻 تقني",
                class: "technology"
            },

            general: {
                label: "📰 عام",
                class: "general"
            }
        };


        newsList.forEach(item => {

            const tr = document.createElement("tr");

            const category =
                categoryMap[item.category] ||
                categoryMap.general;

            const createdAt =
                item.created_at
                    ? new Date(item.created_at).toLocaleDateString("ar-SA")
                    : "الآن";

            const id = item.id;

            tr.innerHTML = `

                <td>

                    <div class="admin-news-info">

                        <div class="admin-news-image">
                            📰
                        </div>

                        <div>

                            <strong>
                                ${escapeHtml(item.title)}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    item.content
                                        ? item.content.substring(0, 35) + "..."
                                        : ""
                                )}
                            </span>

                        </div>

                    </div>

                </td>


                <td>

                    <span class="table-category ${category.class}">
                        ${category.label}
                    </span>

                </td>


                <td>

                    <span class="status published">
                        منشور
                    </span>

                </td>


                <td>
                    ${createdAt}
                </td>


                <td>

                    <div class="table-actions">

                        <button
                            class="action-btn pin ${item.is_pinned ? "active" : ""}"
                            data-id="${id}"
                            title="تثبيت">
                            📌
                        </button>

                        <button
                            class="action-btn delete"
                            data-id="${id}"
                            title="حذف">
                            🗑️
                        </button>

                    </div>

                </td>
            `;

            newsTableBody.appendChild(tr);

        });

        attachActionListeners();
    }


    // =========================
    // STATISTICS
    // =========================

    function updateStats(newsList) {

        const total = newsList.length;

        const breaking = newsList.filter(news =>
            news.category === "breaking" ||
            news.is_breaking === true
        ).length;

        const pinned = newsList.filter(news =>
            news.is_pinned === true
        ).length;


        const today = new Date();

        const todayCount = newsList.filter(news => {

            if (!news.created_at) return false;

            const date = new Date(news.created_at);

            return (
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            );

        }).length;


        if (totalNewsStat) {
            totalNewsStat.textContent = total;
        }

        if (breakingNewsStat) {
            breakingNewsStat.textContent = breaking;
        }

        if (pinnedNewsStat) {
            pinnedNewsStat.textContent = pinned;
        }

        if (todayNewsStat) {
            todayNewsStat.textContent = todayCount;
        }
    }


    // =========================
    // ADD NEWS
    // =========================

    if (newsForm) {

        newsForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            const title =
                document.getElementById("newsTitle").value.trim();

            const content =
                document.getElementById("newsContent").value.trim();

            const categoryInput =
                document.querySelector(
                    'input[name="category"]:checked'
                );

            const breakingInput =
                document.getElementById("breakingNews");

            const pinnedInput =
                document.getElementById("pinnedNews");

            const deleteModeInput =
                document.querySelector(
                    'input[name="deleteMode"]:checked'
                );


            if (!title || !content) {

                alert("يرجى كتابة عنوان ومحتوى الخبر.");

                return;
            }


            const newsData = {

                title: title,

                content: content,

                category:
                    categoryInput
                        ? categoryInput.value
                        : "general",

                isBreaking:
                    breakingInput
                        ? breakingInput.checked
                        : false,

                isPinned:
                    pinnedInput
                        ? pinnedInput.checked
                        : false,

                deleteMode:
                    deleteModeInput
                        ? deleteModeInput.value
                        : "manual"
            };


            try {

                const response = await fetch(API_URL, {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(newsData)

                });


                const result = await response.json();


                if (!response.ok) {

                    console.error("SERVER ERROR:", result);

                    alert(
                        result.error ||
                        "حدث خطأ أثناء إضافة الخبر."
                    );

                    return;
                }


                // نجاح الإضافة

                alert("تم إنشاء الخبر بنجاح 🎉");

                togglePanel(false);

                // إعادة تحميل الأخبار والعدادات
                await fetchNews();


            } catch (error) {

                console.error(
                    "خطأ في الاتصال بالسيرفر:",
                    error
                );

                alert(
                    "تعذر الاتصال بالسيرفر. حاولي مرة أخرى."
                );
            }

        });
    }


    // =========================
    // DELETE / PIN
    // =========================

    function attachActionListeners() {

        // DELETE

        document
            .querySelectorAll(".action-btn.delete")
            .forEach(button => {

                button.addEventListener("click", async () => {

                    const id = button.dataset.id;

                    if (!id) return;


                    const confirmed = confirm(
                        "هل أنتِ متأكدة من حذف هذا الخبر؟"
                    );

                    if (!confirmed) return;


                    try {

                        const response = await fetch(
                            `${API_URL}/${id}`,
                            {
                                method: "DELETE"
                            }
                        );


                        if (!response.ok) {

                            throw new Error(
                                "فشل حذف الخبر"
                            );
                        }


                        await fetchNews();


                    } catch (error) {

                        console.error(
                            "خطأ في الحذف:",
                            error
                        );

                        alert(
                            "تعذر حذف الخبر."
                        );
                    }

                });

            });


        // PIN

        document
            .querySelectorAll(".action-btn.pin")
            .forEach(button => {

                button.addEventListener("click", async () => {

                    const id = button.dataset.id;

                    if (!id) return;


                    try {

                        const response = await fetch(
                            `${API_URL}/${id}/pin`,
                            {
                                method: "PUT"
                            }
                        );


                        if (!response.ok) {

                            throw new Error(
                                "فشل تثبيت الخبر"
                            );
                        }


                        await fetchNews();


                    } catch (error) {

                        console.error(
                            "خطأ في التثبيت:",
                            error
                        );

                        alert(
                            "ميزة التثبيت تحتاج إلى Endpoint في السيرفر."
                        );
                    }

                });

            });
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
    // INITIAL LOAD
    // =========================

    fetchNews();

});
```

