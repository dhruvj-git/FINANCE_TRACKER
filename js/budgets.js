// js/budgets.js (Complete & Corrected Version)

document.addEventListener("DOMContentLoaded", () => {
  // --- Check for login token first ---
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You are not logged in. Please log in.");
    window.location.href = "login.html";
    return; // Stop execution if not logged in
  }

  // --- Get DOM Elements ---
  const budgetForm = document.getElementById("budgetForm");
  const categorySelect = document.getElementById("category");
  const budgetTableBody = document.getElementById("budgetTableBody");
  
  if (!budgetForm || !categorySelect || !budgetTableBody) {
    console.error("❌ Critical Error: A required element was not found in the HTML.");
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // --- Function to Load Categories into Dropdown ---
  const loadCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories", { headers });
      if (!res.ok) throw new Error("Server failed to send categories");

      const categories = await res.json();
      
      categorySelect.innerHTML = '<option value="">-- Select Category --</option>'; // Reset dropdown
      categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.category_id;
        option.textContent = cat.category_name;
        categorySelect.appendChild(option);
      });
      console.log("✅ Categories loaded for dropdown.");
    } catch (err) {
      console.error("❌ Error loading categories:", err);
      categorySelect.innerHTML = '<option value="">Failed to load</option>';
    }
  };

  // --- Function to Load and Display Budgets in Table ---
  const loadBudgets = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/budgets", { headers });
      if (!res.ok) throw new Error("Server failed to send budgets");

      const budgets = await res.json();
      
      budgetTableBody.innerHTML = ""; // Clear existing table rows

      if (budgets.length === 0) {
        budgetTableBody.innerHTML = '<tr><td colspan="3">No budgets set. Add one above!</td></tr>';
        return;
      }
      
      budgets.forEach((b) => {
        const row = document.createElement("tr");

        // IMPROVEMENT: Format the month for better readability (e.g., "October 2025")
        const monthDate = new Date(b.month);
        const formattedMonth = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

        row.innerHTML = `
          <td>${formattedMonth}</td>
          <td>${b.category_name}</td>  <td>₹${parseFloat(b.budget_limit).toFixed(2)}</td>
        `;
        budgetTableBody.appendChild(row);
      });
      console.log("✅ Budgets loaded and displayed in the table.");
    } catch (err) {
      console.error("❌ Error loading budgets:", err);
      budgetTableBody.innerHTML = '<tr><td colspan="3">Error loading budgets.</td></tr>';
    }
  };

  // --- Event Listener for Adding a New Budget ---
  budgetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      category_id: categorySelect.value,
      budget_limit: document.getElementById("budget_limit").value,
      month: document.getElementById("month").value,
    };
    
    // Simple validation
    if (!body.category_id || !body.budget_limit || !body.month) {
        alert("Please fill out all fields.");
        return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/budgets", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        // IMPROVEMENT: Show specific error if budget already exists
        if (errorData.error && errorData.error.includes("duplicate key")) {
            alert("A budget for this category and month already exists.");
        } else {
            alert(`Failed to add budget: ${errorData.error || "Unknown server error"}`);
        }
        throw new Error(errorData.error);
      }
      
      console.log("✅ Budget added successfully.");
      budgetForm.reset();
      loadBudgets(); // Refresh the list to show the new budget

    } catch (err) {
      console.error("❌ Error adding budget:", err);
    }
  });

  // --- Initial Page Load ---
  loadCategories();
  loadBudgets();
});