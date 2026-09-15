const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "جاري تسجيل الدخول...";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            loginMessage.textContent =
                data.error || "فشل تسجيل الدخول.";
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");

        if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
            window.location.href = redirect;
        } else {
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error(error);
        loginMessage.textContent =
            "تعذر الاتصال بالسيرفر.";
    }
});
