const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        registerMessage.textContent =
            "كلمتا المرور غير متطابقتين.";
        return;
    }

    registerMessage.textContent = "جاري إنشاء الحساب...";

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                username,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            registerMessage.textContent =
                data.error || "تعذر إنشاء الحساب.";
            return;
        }

        registerMessage.textContent =
            "تم إنشاء الحساب بنجاح، سيتم تحويلك لتسجيل الدخول.";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1200);

    } catch (error) {
        console.error(error);

        registerMessage.textContent =
            "تعذر الاتصال بالسيرفر.";
    }
});
