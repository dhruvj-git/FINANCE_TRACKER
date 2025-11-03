// js/budgets.js (Complete & Updated Version with correct coloring)

// --- Global variables for headers and table body ---
let token = localStorage.getItem("token");
let budgetTableBody; // We'll assign this in DOMContentLoaded
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

// --- NEW: Map to store category types by name ---
let categoryTypes = new Map();

// --- Function to Load Categories into Dropdown ---
const loadCategories = async () => {
  const categorySelect = document.getElementById("category");
  if (!categorySelect) return;

  try {
    const res = await fetch("http://localhost:5000/api/categories", { headers });
    if (res.status === 401) return handleAuthError();
    if (!res.ok) throw new Error("Server failed to send categories");

    const categories = await res.json();
    
    categorySelect.innerHTML = '<option value="">-- Select Category --</option>'; // Reset dropdown
    categoryTypes.clear(); // Clear map

    categories.forEach((cat) => {
      // --- MODIFICATION: Load ALL categories, not just Expense ---
      const option = document.createElement("option");
      option.value = cat.category_id;
      option.textContent = cat.category_name;
      categorySelect.appendChild(option);

      // --- NEW: Populate the map ---
      categoryTypes.set(cat.category_name, cat.category_type);
    });
    console.log("✅ Categories loaded for dropdown.");
  } catch (err) {
    console.error("❌ Error loading categories:", err);
    categorySelect.innerHTML = '<option value="">Failed to load</option>';
  }
};

// --- Function to Load and Display Budgets in Table ---
const loadBudgets = async () => {
  if (!budgetTableBody) budgetTableBody = document.getElementById("budgetTableBody");
  if (!budgetTableBody) return; // Exit if table body not found

  try {
    const res = await fetch("http://localhost:5000/api/budgets", { headers });
    if (res.status === 401) return handleAuthError();
    if (!res.ok) throw new Error("Server failed to send budgets");

    const budgets = await res.json();
    
    budgetTableBody.innerHTML = ""; // Clear existing table rows

    if (budgets.length === 0) {
      budgetTableBody.innerHTML = '<tr><td colspan="4">No budgets set. Add one above!</td></tr>';
      return;
    }
    
    budgets.forEach((b) => {
      const row = document.createElement("tr");

      const monthDate = new Date(b.month);
      const formattedMonth = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

      // --- START OF MODIFICATION ---
      // Get category type from our map
      const categoryName = b.category_name;
      const categoryType = categoryTypes.get(categoryName);
      // Determine class based on type
      const typeClass = categoryType === 'Income' ? 'category-income' : (categoryType === 'Expense' ? 'category-expense' : '');

      row.innerHTML = `
        <td>${formattedMonth}</td>
        <td class="${typeClass}">${categoryName}</td>
        <td>₹${parseFloat(b.budget_limit).toFixed(2)}</td>
        <td>
          <button 
            class="btn btn-danger btn-sm rounded-pill" 
            onclick="deleteBudget(${b.budget_id})"
          >
              <i class="fas fa-trash-alt"></i> Delete
          </button>
        </td>
      `;
      // --- END OF MODIFICATION ---
      
      budgetTableBody.appendChild(row);
    });
    console.log("✅ Budgets loaded and displayed in the table.");
  } catch (err) {
    console.error("❌ Error loading budgets:", err);
    budgetTableBody.innerHTML = '<tr><td colspan="4">Error loading budgets.</td></tr>';
  }
};

// --- Function to handle authentication errors ---
const handleAuthError = () => {
    alert("You are not logged in or your session has expired. Please log in.");
    localStorage.removeItem('token');
    window.location.href = "login.html";
};

// --- Main Execution on Page Load ---
document.addEventListener("DOMContentLoaded", () => {
  if (!token) return handleAuthError(); // Check token on load

  // Get DOM Elements
  const budgetForm = document.getElementById("budgetForm");
  const categorySelect = document.getElementById("category");
  budgetTableBody = document.getElementById("budgetTableBody"); // Assign to global
  
  if (!budgetForm || !categorySelect || !budgetTableBody) {
    console.error("❌ Critical Error: A required element was not found in the HTML.");
    return;
  }

  // --- Event Listener for Adding a New Budget ---
  budgetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      category_id: categorySelect.value,
      budget_limit: document.getElementById("budget_limit").value,
      month: document.getElementById("month").value,
    };
    
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

      if (res.status === 401) return handleAuthError();

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error && errorData.error.includes('already exists')) {
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

  // --- MODIFIED: Initial Page Load (to prevent race condition) ---
  async function initializePage() {
    await loadCategories(); // Wait for map to be built
    await loadBudgets();    // Then load budgets which use the map
  }
  initializePage();
});


// --- Global Delete Function ---
async function deleteBudget(budgetId) {
    if (!token) return handleAuthError();

    if (!confirm('Are you sure you want to delete this budget?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/budgets/${budgetId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) return handleAuthError();
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete budget');
        }

        alert('Budget deleted successfully');
        loadBudgets(); // Refresh the table

    } catch (error) {
        console.error('Error deleting budget:', error);
        alert(`Error: ${error.message}`);
    }
}