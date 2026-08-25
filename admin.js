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
