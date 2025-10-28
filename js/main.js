document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // ✅ Load summary data only if those elements exist
  const incomeEl = document.getElementById("income");
  const expenseEl = document.getElementById("expense");
  const balanceEl = document.getElementById("balance");

  if (incomeEl && expenseEl && balanceEl) {
    fetch("http://localhost:5000/summary", { headers })
      .then(res => res.json())
      .then(summary => {
        incomeEl.textContent = summary.total_income || 0;
        expenseEl.textContent = summary.total_expense || 0;
        balanceEl.textContent = (summary.total_income - summary.total_expense) || 0;
      })
      .catch(err => console.error("❌ Error loading summary:", err));
  }

  // ✅ Load chart only if canvas is present
  const canvas = document.getElementById("categoryChart");
  if (canvas) {
    fetch("http://localhost:5000/chart/categories", { headers })
      .then(res => res.json())
      .then(data => {
        const labels = data.labels;
        const amounts = data.values;

        const ctx = canvas.getContext("2d");
        new Chart(ctx, {
          type: "pie",
          data: {
            labels,
            datasets: [{
              data: amounts,
              backgroundColor: [
                "#4f46e5", "#06b6d4", "#f59e0b", "#10b981", "#ef4444",
                "#8b5cf6", "#ec4899", "#22d3ee"
              ]
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      })
      .catch(err => console.error("❌ Error loading category breakdown:", err));
  }
});
