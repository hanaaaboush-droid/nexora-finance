document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/news'; 

    // العناصر الخاصة بالنموذج والواجهة
    const openBtn = document.getElementById('openNewsForm');
    const closeBtn = document.getElementById('closeNewsForm');
    const cancelBtn = document.getElementById('cancelNewsForm');
    const addNewsPanel = document.getElementById('addNewsPanel');
    const newsForm = document.querySelector('.news-form');
    const newsTableBody = document.querySelector('.news-table tbody');

    // 1. فتح وإغلاق كارت إضافة الخبر (شغال 100%)
    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (addNewsPanel) addNewsPanel.style.display = 'block';
        });
    }

    const closeForm = (e) => {
        if (e) e.preventDefault();
        if (addNewsPanel) addNewsPanel.style.display = 'none';
        if (newsForm) newsForm.reset();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeForm);
    if (cancelBtn) cancelBtn.addEventListener('click', closeForm);

    // 2. تحديث الإحصائيات
    const updateStats = (newsList) => {
        const totalElement = document.getElementById('statTotalNews');
        const breakingElement = document.getElementById('statBreakingNews');
        const pinnedElement = document.getElementById('statPinnedNews');
        const todayElement = document.getElementById('statTodayNews');

        if (!Array.isArray(newsList)) return;

        if (totalElement) totalElement.textContent = newsList.length;

        const breakingCount = newsList.filter(item => 
            item.category === 'breaking' || item.isBreaking === true
        ).length;
        if (breakingElement) breakingElement.textContent = breakingCount;

        const pinnedCount = newsList.filter(item => item.isPinned === true).length;
        if (pinnedElement) pinnedElement.textContent = pinnedCount;

        const today = new Date().toDateString();
        const todayCount = newsList.filter(item => {
            if (!item.createdAt) return false;
            return new Date(item.createdAt).toDateString() === today;
        }).length;
        if (todayElement) todayElement.textContent = todayCount;
    };

    // 3. جلب الأخبار من الخادم
    const fetchNews = async () => {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            
            if (data.success && Array.isArray(data.news)) {
                renderTable(data.news);
                updateStats(data.news);
            }
        } catch (err) {
            console.error('خطأ في جلب الأخبار:', err);
        }
    };

    // 4. عرض الأخبار في الجدول
    const renderTable = (newsList) => {
        if (!newsTableBody) return;
        newsTableBody.innerHTML = '';

        newsList.forEach(item => {
            const tr = document.createElement('tr');
            
            const categoryMap = {
                breaking: { label: '🚨 عاجل', class: 'breaking' },
                economic: { label: '💰 اقتصادي', class: 'economic' },
                technology: { label: '💻 تقني', class: 'technology' },
                general: { label: '📰 عام', class: 'general' }
            };

            const catInfo = categoryMap[item.category] || categoryMap.general;

            tr.innerHTML = `
                <td>
                    <div class="admin-news-info">
                        <div class="admin-news-image">
                            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="news" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">` : '📰'}
                        </div>
                        <div>
                            <strong>${item.title}</strong>
                            <span>${item.content ? item.content.substring(0, 35) + '...' : ''}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="table-category ${catInfo.class}">${catInfo.label}</span>
                </td>
                <td>
                    <span class="status published">منشور</span>
                </td>
                <td>${item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-SA') : 'الآن'}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn pin ${item.isPinned ? 'active' : ''}" data-id="${item._id || item.id}" title="تثبيت">📌</button>
                        <button class="action-btn delete" data-id="${item._id || item.id}" title="حذف">🗑️</button>
                    </div>
                </td>
            `;

            newsTableBody.appendChild(tr);
        });

        attachActionListeners();
    };

    // 5. إرسال الخبر
    if (newsForm) {
        newsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('newsTitle').value.trim();
            const content = document.getElementById('newsContent').value.trim();
            const categoryInput = document.querySelector('input[name="category"]:checked');
            const isBreaking = document.getElementById('breakingNews')?.checked || false;
            const isPinned = document.getElementById('pinnedNews')?.checked || false;

            if (!title || !content) {
                alert('يرجى ملء عنوان الخبر ومحتواه');
                return;
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('category', categoryInput ? categoryInput.value : 'general');
            formData.append('isBreaking', isBreaking);
            formData.append('isPinned', isPinned);

            const imageFile = document.getElementById('newsImage')?.files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    closeForm();
                    fetchNews();
                } else {
                    alert('حدث خطأ أثناء إضافة الخبر');
                }
            } catch (err) {
                console.error('خطأ في الاتصال:', err);
            }
        });
    }

    // 6. زر الحذف
    const attachActionListeners = () => {
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('هل أنت متأكد من حذف هذا الخبر؟')) {
                    try {
                        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                        fetchNews();
                    } catch (err) {
                        console.error('خطأ في الحذف:', err);
                    }
                }
            });
        });
    };

    fetchNews();
});
