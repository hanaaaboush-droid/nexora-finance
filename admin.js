const openNewsForm = document.getElementById("openNewsForm");
const closeNewsForm = document.getElementById("closeNewsForm");
const cancelNewsForm = document.getElementById("cancelNewsForm");
const addNewsPanel = document.getElementById("addNewsPanel");



openNewsForm.addEventListener("click", () => {

    addNewsPanel.classList.add("show");

    addNewsPanel.scrollIntoView({
        behavior: "smooth"
    });

});


closeNewsForm.addEventListener("click", () => {

    addNewsPanel.classList.remove("show");

});


cancelNewsForm.addEventListener("click", () => {

    addNewsPanel.classList.remove("show");

});
const newsForm = document.querySelector(".news-form");

newsForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const title =
        document.getElementById("newsTitle").value.trim();

    const content =
        document.getElementById("newsContent").value.trim();

    const category =
        document.querySelector(
            'input[name="category"]:checked'
        )?.value;


    const isBreaking =
        document.getElementById("breakingNews").checked;

    const isPinned =
        document.getElementById("pinnedNews").checked;


    const deleteMode =
        document.querySelector(
            'input[name="deleteMode"]:checked'
        )?.value || "manual";


    if (!title || !content || !category) {

        alert("يرجى تعبئة عنوان الخبر ومحتواه واختيار التصنيف.");

        return;
    }


    try {

        const response = await fetch("/api/news", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                title,
                content,
                category,

                isBreaking,
                isPinned,

                deleteMode

            })

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "حدث خطأ أثناء نشر الخبر"
            );

        }


        alert("✅ تم نشر الخبر بنجاح!");


        newsForm.reset();


        document
            .getElementById("addNewsPanel")
            .classList.remove("show");


    } catch (error) {

        console.error(error);

        alert(
            "❌ لم يتم نشر الخبر: " +
            error.message
        );

    }

});
