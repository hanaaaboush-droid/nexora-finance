document.addEventListener("DOMContentLoaded", function () {

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
    // OPEN / CLOSE PANEL
    // =========================

    function openNewsPanel() {

        if (!addNewsPanel) {
            alert("لم يتم العثور على لوحة إضافة الخبر.");
            return;
        }

        addNewsPanel.classList.add("active");

    }


    function closeNewsPanel() {

        if (!addNewsPanel) return;

        addNewsPanel.classList.remove("active");

        if (newsForm) {
            newsForm.reset();
        }

    }


    // زر إضافة خبر
    if (openBtn) {

        openBtn.type = "button";

        openBtn.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            openNewsPanel();

        });

    } else {

        console.error("زر openNewsForm غير موجود.");

    }


    // زر الإغلاق
    if (closeBtn) {

        closeBtn.type = "button";

        closeBtn.addEventListener("click", function (event) {

            event.preventDefault();

            closeNewsPanel();

        });

    }


    // زر الإلغاء
    if (cancelBtn) {

        cancelBtn.type = "button";

        cancelBtn.addEventListener("click", function (event) {

            event.preventDefault();

            closeNewsPanel();

        });

    }


    // =========================
    // LOAD NEWS
    // =========================

    async function fetchNews() {

        try {

            const response = await fetch(
                API_URL + "?t=" + Date.now(),
                {
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to fetch news: " + response.status
                );
            }

            const newsList = await response.json();

            if (!Array.isArray(newsList)) {
                throw new Error("Invalid news response");
            }

            renderTable(newsList);
            updateStats(newsList);

        } catch (error) {

            console.error(
                "خطأ في جلب الأخبار:",
                error
            );

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
                className: "breaking"
            },

            economic: {
                label: "💰 اقتصادي",
                className: "economic"
            },

            technology: {
                label: "💻 تقني",
                className: "technology"
            },

            general: {
                label: "📰 عام",
                className: "general"
            }

        };


        newsList.forEach(function (item) {

            const tr = document.createElement("tr");

            const category =
                categoryMap[item.category] ||
                categoryMap.general;


            const createdAt = item.created_at
                ? new Date(item.created_at)
                    .toLocaleDateString("ar-SA")
                : "الآن";


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

                    <span class="table-category ${category.className}">
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
                            type="button"
                            class="action-btn pin"
                            data-id="${item.id}"
                            title="تثبيت">
                            📌
                        </button>

                        <button
                            type="button"
                            class="action-btn delete"
                            data-id="${item.id}"
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


        const breaking = newsList.filter(function (news) {

            return (
                news.category === "breaking" ||
                news.is_breaking === true
            );

        }).length;


        const pinned = newsList.filter(function (news) {

            return news.is_pinned === true;

        }).length;


        const today = new Date();


        const todayCount = newsList.filter(function (news) {

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

        newsForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const titleElement =
                    document.getElementById("newsTitle");

                const contentElement =
                    document.getElementById("newsContent");


                const title =
                    titleElement
                        ? titleElement.value.trim()
                        : "";


                const content =
                    contentElement
                        ? contentElement.value.trim()
                        : "";


                const categoryElement =
                    document.querySelector(
                        'input[name="category"]:checked'
                    );


                const breakingElement =
                    document.getElementById("breakingNews");


                const pinnedElement =
                    document.getElementById("pinnedNews");


                const deleteModeElement =
                    document.querySelector(
                        'input[name="deleteMode"]:checked'
                    );


                if (!title || !content) {

                    alert(
                        "يرجى كتابة عنوان ومحتوى الخبر."
                    );

                    return;

                }


                const newsData = {

                    title: title,

                    content: content,

                    category:
                        categoryElement
                            ? categoryElement.value
                            : "general",

                    isBreaking:
                        breakingElement
                            ? breakingElement.checked
                            : false,

                    isPinned:
                        pinnedElement
                            ? pinnedElement.checked
                            : false,

                    deleteMode:
                        deleteModeElement
                            ? deleteModeElement.value
                            : "manual"

                };


                try {

                    const response = await fetch(
                        API_URL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify(newsData)
                        }
                    );


                    const result =
                        await response.json();


                    if (!response.ok) {

                        console.error(
                            "SERVER ERROR:",
                            result
                        );

                        alert(
                            result.error ||
                            "حدث خطأ أثناء إضافة الخبر."
                        );

                        return;
                    }


                    alert(
                        "تم إنشاء الخبر بنجاح 🎉"
                    );


                    closeNewsPanel();


                    await fetchNews();


                } catch (error) {

                    console.error(
                        "خطأ في إضافة الخبر:",
                        error
                    );

                    alert(
                        "تعذر الاتصال بالسيرفر."
                    );

                }

            }
        );

    } else {

        console.error(
            "لم يتم العثور على .news-form"
        );

    }


    // =========================
    // DELETE / PIN
    // =========================

    function attachActionListeners() {

        document
            .querySelectorAll(".action-btn.delete")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const id =
                            button.dataset.id;

                        if (!id) return;


                        if (
                            !confirm(
                                "هل أنتِ متأكدة من حذف هذا الخبر؟"
                            )
                        ) {
                            return;
                        }


                        try {

                            const response =
                                await fetch(
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

                    }
                );

            });


        document
            .querySelectorAll(".action-btn.pin")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        alert(
                            "التثبيت يحتاج إضافة Endpoint في server.js أولاً."
                        );

                    }
                );

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

