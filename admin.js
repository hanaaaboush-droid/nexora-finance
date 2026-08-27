document.addEventListener('DOMContentLoaded', () => {
    // URL الخاص بـ API الأخبار في خادامك
    const API_URL = '/api/news'; 

    // Visual Elements & Form Controls
    const openBtn = document.getElementById('openNewsForm');
    const closeBtn = document.getElementById('closeNewsForm');
    const cancelBtn = document.getElementById('cancelNewsForm');
    const addNewsPanel = document.getElementById('addNewsPanel');
    const newsForm = document.querySelector('.news-form');
    const newsTableBody = document.querySelector('.news-table tbody');

    // Stats Elements
    const totalNewsStat = document.querySelector('.stat-card:nth-child(1) strong');
    const breakingNewsStat = document.querySelector('.stat-card:nth-child(2) strong');
    const pinnedNewsStat = document.querySelector('.stat-card:nth-child(3) strong');

    // 1. فتح وإغلاق النافذة الجانبية/النموذج
    const togglePanel = (show) => {
        if (show) {
            addNewsPanel.classList.add('active');
        } else {
            addNewsPanel.classList.remove('active');
            newsForm.reset();
        }
    };

    if (openBtn) openBtn.addEventListener('click', () => togglePanel(true));
    if (closeBtn) closeBtn.addEventListener('click', () => togglePanel(false));
    if (cancelBtn) cancelBtn.addEventListener('click', () => togglePanel(false));

    // 2. جلب الأخبار من Server وتحديث الجدول والإحصائيات
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

    // 3. عرض الأخبار في الجدول
    const renderTable = (newsList) => {
        if (!newsTableBody) return;
        newsTableBody.innerHTML = '';

        newsList.forEach(item => {
            const tr = document.createElement('tr');
            
            // تحديد أيقونة التصنيف
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

    // 4. تحديث بطاقات الإحصائيات تلقائياً
   // تحديث الإحصائيات بناءً على مصفوفة الأخبار القادمة من الـ Server
const updateStats = (newsList) => {
    const totalElement = document.getElementById('statTotalNews');
    const breakingElement = document.getElementById('statBreakingNews');
    const pinnedElement = document.getElementById('statPinnedNews');
    const todayElement = document.getElementById('statTodayNews');

    if (!Array.isArray(newsList)) return;

    // 1. إجمالي الأخبار
    if (totalElement) totalElement.textContent = newsList.length;

    // 2. الأخبار العاجلة
    const breakingCount = newsList.filter(item => 
        item.category === 'breaking' || item.isBreaking === true
    ).length;
    if (breakingElement) breakingElement.textContent = breakingCount;

    // 3. الأخبار المثبتة
    const pinnedCount = newsList.filter(item => item.isPinned === true).length;
    if (pinnedElement) pinnedElement.textContent = pinnedCount;

    // 4. الأخبار المنشورة اليوم
    const today = new Date().toDateString();
    const todayCount = newsList.filter(item => {
        if (!item.createdAt) return false;
        return new Date(item.createdAt).toDateString() === today;
    }).length;
    if (todayElement) todayElement.textContent = todayCount;
};
    // 5. إرسال خبر جديد إلى الـ Backend
    if (newsForm) {
        newsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('newsTitle').value.trim();
            const content = document.getElementById('newsContent').value.trim();
            const categoryInput = document.querySelector('input[name="category"]:checked');
            const isBreaking = document.getElementById('breakingNews').checked;
            const isPinned = document.getElementById('pinnedNews').checked;
            const deleteModeInput = document.querySelector('input[name="deleteMode"]:checked');

            if (!title || !content) {
                alert('يرجى ملء جميع الحقول المطلوبة');
                return;
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('category', categoryInput ? categoryInput.value : 'general');
            formData.append('isBreaking', isBreaking);
            formData.append('isPinned', isPinned);
            formData.append('deleteMode', deleteModeInput ? deleteModeInput.value : 'manual');

            const imageFile = document.getElementById('newsImage').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData // إرسال بيانات Form مع الملفات
                });

                if (response.ok) {
                    togglePanel(false);
                    fetchNews(); // إعادة تحميل الجدول فوراً
                } else {
                    alert('حدث خطأ أثناء إضافة الخبر');
                }
            } catch (err) {
                console.error('خطأ في الاتصال:', err);
            }
        });
    }

    // 6. أحداث زري الحذف والتثبيت داخل الجدول
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

    // تحميل البيانات أول ما تفتح الصفحة
    fetchNews();
});
