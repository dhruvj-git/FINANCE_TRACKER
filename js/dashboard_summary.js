// js/dashboard.js (Reverted File)

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // --- DOM Elements ---
  const totalBalanceSpan = document.getElementById("total-balance");
  const monthlyExpensesSpan = document.getElementById("monthly-expenses");
  const totalTransactionsSpan = document.getElementById("total-transactions");
  const logoutBtn = document.getElementById("logoutBtn");

  // Check required elements exist
  if (!totalBalanceSpan || !monthlyExpensesSpan || !totalTransactionsSpan) {
    console.error("❌ Critical Error: One or more required dashboard widget elements were not found in the HTML.");
    // Optionally display error in place of data
    if(totalBalanceSpan) totalBalanceSpan.textContent = "Error";
    if(monthlyExpensesSpan) monthlyExpensesSpan.textContent = "Error";
    if(totalTransactionsSpan) totalTransactionsSpan.textContent = "Error";
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // --- Fetch and Display Dashboard Summary Data ---
  const loadDashboardData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/dashboard", { headers }); // Correct endpoint for summary
      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard summary (${res.status})`);
      }
      const data = await res.json();
      totalBalanceSpan.textContent = `₹${data.total_balance}`;
      monthlyExpensesSpan.textContent = `₹${data.monthly_expense}`;
      totalTransactionsSpan.textContent = data.total_transactions;
      console.log("✅ Dashboard summary loaded.");
    } catch (err) {
      console.error("❌ Error loading dashboard summary:", err);
      totalBalanceSpan.textContent = "Error";
      monthlyExpensesSpan.textContent = "Error";
      totalTransactionsSpan.textContent = "Error";
    }
  };

  // --- Event Listener for Affordability Check Removed ---


  // --- Logout Functionality ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }

  // --- Initial Load ---
  loadDashboardData();
});