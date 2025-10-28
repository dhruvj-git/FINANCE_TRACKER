// js/register.js (Complete, Corrected Frontend File)

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Stop the form from reloading the page

      const formData = new FormData(registerForm);
      const data = Object.fromEntries(formData.entries());

      try {
        // ✅ FIX: Point to the correct /register endpoint
        const res = await fetch("http://localhost:5000/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!res.ok) {
          // If the server returns an error, display it
          throw new Error(result.message || "Registration failed.");
        }

        // --- SUCCESS ---
        // Save the token and redirect to the dashboard
        localStorage.setItem("token", result.token);
        alert("Registration successful! Redirecting to dashboard...");
        window.location.href = "index.html";

      } catch (err) {
        console.error("❌ Registration Error:", err);
        alert(`Error: ${err.message}`);
      }
    });
  }
});