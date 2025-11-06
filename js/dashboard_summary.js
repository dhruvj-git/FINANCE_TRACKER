// js/dashboard_summary.js


document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  
  const headers = { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` 
  };

  // --- Logout Button ---
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }

  // --- Load All Dashboard Components ---

  // 1. Load your original summary cards (using your function)
  loadDashboardData(token, headers);
  
  // 2. Load the new charts
  loadIncomeExpenseChart(token, headers);
  loadExpenseChart(token, headers);
  loadMonthlyExpenseChart(token, headers);
});




// --- 1. YOUR ORIGINAL FUNCTION (NOW FIXED) ---
// This function loads Total Balance, Monthly Expenses, and Total Transactions
const loadDashboardData = async (token, headers) => {
  // Get DOM elements
  const totalBalanceSpan = document.getElementById("total-balance");
  const monthlyExpensesSpan = document.getElementById("monthly-expenses");
  const totalTransactionsSpan = document.getElementById("total-transactions");

  // Check required elements exist
  if (!totalBalanceSpan || !monthlyExpensesSpan || !totalTransactionsSpan) {
    console.error("❌ Critical Error: One or more required dashboard widget elements were not found.");
    return;
  }

  try {
    // --- FIX 1: Changed to your correct endpoint ---
    const res = await fetch("http://localhost:5000/api/dashboard", { headers }); 
    
    if (res.status === 401) return handleAuthError();
    if (!res.ok) {
      throw new Error(`Failed to fetch dashboard summary (${res.status})`);
    }
    
    const data = await res.json();
    
    // --- FIX 2: Using your original snake_case property names ---
    totalBalanceSpan.textContent = `₹${data.total_balance}`;
    monthlyExpensesSpan.textContent = `₹${data.monthly_expense}`;
    totalTransactionsSpan.textContent = data.total_transactions;
    
    console.log("✅ Dashboard summary cards loaded.");
  } catch (err) {
    console.error("❌ Error loading dashboard summary:", err);
    totalBalanceSpan.textContent = "Error";
    monthlyExpensesSpan.textContent = "Error";
    totalTransactionsSpan.textContent = "Error";
  }
};


// --- 2. NEW FUNCTION: Income vs. Expense LINE Chart ---
const loadIncomeExpenseChart = async (token, headers) => {
  const ctx = document.getElementById('incomeExpenseChart');
  if (!ctx) return;

  try {
    const res = await fetch("http://localhost:5000/api/charts/income-vs-expense", { headers });
    if (res.status === 401) return handleAuthError();
    if (!res.ok) throw new Error("Failed to fetch income/expense data");

    const data = await res.json();
    
    if (data.length === 0) {
      return ctx.getContext('2d').fillText("No income or expense data to display.", 50, 100);
    }

    const labels = data.map(d => 
      new Date(d.month).toLocaleString('en-US', { 
        month: 'short', year: 'numeric', timeZone: 'UTC' 
      })
    );
    const incomeData = data.map(d => d.total_income);
    const expenseData = data.map(d => d.total_expense);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.1
          },
          {
            label: 'Expense',
            data: expenseData,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
    console.log("✅ Income/Expense chart loaded.");
  } catch (err) {
    console.error("Error loading income/expense chart:", err);
    ctx.getContext('2d').fillText("Could not load chart.", 50, 100);
  }
};


// --- 3. NEW FUNCTION: Expense DOUGHNUT Chart ---
const loadExpenseChart = async (token, headers) => {
  const ctx = document.getElementById('expenseChart');
  if (!ctx) return;

  try {
    const res = await fetch("http://localhost:5000/api/charts/expense-by-category", { headers });
    if (res.status === 401) return handleAuthError();
    if (!res.ok) throw new Error("Failed to fetch expense data");

    const data = await res.json();

    if (data.length === 0) {
      return ctx.getContext('2d').fillText("No expense data to display.", 50, 100);
    }

    const labels = data.map(d => d.category_name);
    const amounts = data.map(d => d.total_amount);

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Expenses',
          data: amounts,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#C9CBCF', '#E7E9ED'
          ],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
    console.log("✅ Expense chart loaded.");
  } catch (err) {
    console.error("Error loading expense chart:", err);
    ctx.getContext('2d').fillText("Could not load chart.", 50, 100);
  }
};


// --- 4. NEW FUNCTION: Monthly Expenditure BAR Chart ---
const loadMonthlyExpenseChart = async (token, headers) => {
  const ctx = document.getElementById('monthlyExpenseChart');
  if (!ctx) return;

  try {
    const res = await fetch("http://localhost:5000/api/charts/monthly-expenditure", { headers });
    if (res.status === 401) return handleAuthError();
    if (!res.ok) throw new Error("Failed to fetch monthly expenditure data");

    const data = await res.json();

    if (data.length === 0) {
      return ctx.getContext('2d').fillText("No expenditure data to display.", 50, 100);
    }
    
    const labels = data.map(d => 
      new Date(d.month).toLocaleString('en-US', { 
        month: 'short', year: 'numeric', timeZone: 'UTC' 
      })
    );
    const expenseData = data.map(d => d.total_expense);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Monthly Expenditure',
          data: expenseData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
    console.log("✅ Monthly expenditure chart loaded.");
  } catch (err) {
    console.error("Error loading monthly expenditure chart:", err);
    ctx.getContext('2d').fillText("Could not load chart.", 50, 100);
  }
};


// --- Utility auth error handler ---
const handleAuthError = () => {
    alert("You are not logged in or your session has expired. Please log in.");
    localStorage.removeItem('token');
    window.location.href = "login.html";
};