// Create a new file: js/dashboard.js (Complete File)

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    // If no token, redirect to login, no need to run the rest of the code
    window.location.href = "login.html";
    return;
  }

  // --- DOM Elements ---
  const totalBalanceSpan = document.getElementById("total-balance");
  const monthlyExpensesSpan = document.getElementById("monthly-expenses");
  const totalTransactionsSpan = document.getElementById("total-transactions");
  const logoutBtn = document.getElementById("logoutBtn");

  // Check if all dashboard elements exist before proceeding
  if (!totalBalanceSpan || !monthlyExpensesSpan || !totalTransactionsSpan) {
    console.error("Dashboard widgets not found in the HTML.");
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // --- Fetch and Display Dashboard Data ---
  const loadDashboardData = async () => {
    try {
      // ✅ FIX: Call the correct endpoint
      const res = await fetch("http://localhost:5000/api/dashboard", { headers });
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data.");
      }

      const data = await res.json();

      // ✅ FIX: Update the correct elements with the data from the new controller
      totalBalanceSpan.textContent = `₹${data.total_balance}`;
      monthlyExpensesSpan.textContent = `₹${data.monthly_expense}`;
      totalTransactionsSpan.textContent = data.total_transactions;
      
      console.log("✅ Dashboard data loaded successfully.");

    } catch (err) {
      console.error("❌ Error loading dashboard:", err);
      // Display an error message to the user in the widgets
      totalBalanceSpan.textContent = "Error";
      monthlyExpensesSpan.textContent = "Error";
      totalTransactionsSpan.textContent = "Error";
    }
  };

  // --- Logout Functionality ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default link behavior
      localStorage.removeItem("token");
      sessionStorage.removeItem("token"); // Also clear session storage
      window.location.href = "login.html";
    });
  }

  // --- Initial Load ---
  loadDashboardData();
});