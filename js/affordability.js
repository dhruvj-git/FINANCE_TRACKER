document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first!");
    window.location.href = "login.html";
    return;
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // --- Affordability Form ---
  const affordabilityForm = document.getElementById("affordabilityForm");
  const affordabilityResult = document.getElementById("affordabilityResult");

  affordabilityForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const itemName = document.getElementById("item_name").value;
    const itemCost = document.getElementById("item_cost").value;
    const currentSavings = document.getElementById("current_savings").value;
    const monthlySavings = document.getElementById("monthly_savings").value;
    const desiredDate = document.getElementById("desired_date").value;

    const body = {
      item_cost: itemCost,
      current_savings: currentSavings,
      monthly_savings: monthlySavings,
      desired_date: desiredDate,
    };

    try {
      // ✅ This URL is correct: /api/analysis/affordability
      const res = await fetch("http://localhost:5000/api/analysis/affordability", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      affordabilityResult.style.display = 'block';

      if (!res.ok) {
        throw new Error(data.message || data.error || "An unknown error occurred.");
      }
      if (data.affordable === true) {
        affordabilityResult.className = 'result-box success';
        affordabilityResult.innerHTML = `<h4>🎉 Yes, you can afford the ${itemName}!</h4> ${data.message ? `<p class="mb-0">${data.message}</p>` : ''}`;
      } else if (data.affordable === false && data.new_date) {
        affordabilityResult.className = 'result-box failure';
        affordabilityResult.innerHTML = `
          <h4>No, you cannot afford the ${itemName} by ${new Date(desiredDate).toLocaleDateString()}.</h4>
          <p class="mb-0">Based on your current savings of <strong>₹${currentSavings}</strong> and monthly savings of <strong>₹${monthlySavings}</strong>, 
          you will need <strong>${data.months_needed}</strong> more months to save. You can afford this item by <strong>${data.new_date}</strong>.</p>
        `;
      } else {
         affordabilityResult.className = 'result-box failure';
         affordabilityResult.innerHTML = `<h4>${data.message || "Could not calculate."}</h4>`;
      }
    } catch (err) {
      affordabilityResult.className = 'result-box failure';
      affordabilityResult.innerHTML = `<h4>Error</h4><p>${err.message}</p>`;
    }
  });

  // --- 50/30/20 Budget Rule Form ---
  const budgetRuleForm = document.getElementById("budgetRuleForm");
  const budgetResult = document.getElementById("budgetResult");

  budgetRuleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const monthlyIncome = document.getElementById("monthly_income").value;

    try {
      // ✅ This URL is correct: /api/analysis/budget-rule
      const res = await fetch("http://localhost:5000/api/analysis/budget-rule", {
        method: "POST",
        headers,
        body: JSON.stringify({ monthly_income: monthlyIncome }),
      });

      const data = await res.json();
      budgetResult.style.display = 'block';

      if (!res.ok) {
        throw new Error(data.message || data.error || "An unknown error occurred.");
      }
      budgetResult.className = 'result-box info';
      budgetResult.innerHTML = `
        <h4>Your 50/30/20 Breakdown</h4>
        <p><strong>Needs (50%):</strong> ₹${data.needs.toFixed(2)}</p>
        <p><strong>Wants (30%):</strong> ₹${data.wants.toFixed(2)}</p>
        <p><strong>Savings (20%):</strong> ₹${data.savings.toFixed(2)}</p>
      `;
    } catch (err) {
      budgetResult.className = 'result-box failure';
      budgetResult.innerHTML = `<h4>Error</h4><p>${err.message}</p>`;
    }
  });

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
});