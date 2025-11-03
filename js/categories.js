document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You are not logged in. Please log in.");
    window.location.href = "login.html";
    return;
  }

  // --- DOM Elements ---
  const categoryForm = document.getElementById("categoryForm");
  const categoryTableBody = document.getElementById("category-table-body");

  if (!categoryForm || !categoryTableBody) {
    console.error("❌ Critical Error: The form or category table body was not found.");
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // --- Function to Load and Display Categories in the Table ---
  const loadCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories", { headers });
      if (!res.ok) throw new Error("Failed to fetch categories.");
      
      const categories = await res.json();
      
      // Clear the current table body
      categoryTableBody.innerHTML = "";

      if (categories.length === 0) {
        // Display a message inside a table row
        categoryTableBody.innerHTML = `<tr><td colspan="2">No categories found. Add one above!</td></tr>`;
        return;
      }

      // Create table rows
      categories.forEach(cat => {
        const row = document.createElement("tr");
        
        // --- MODIFICATION: ADDED CLASS BASED ON TYPE ---
        const typeClass = cat.category_type === 'Income' ? 'category-income' : 'category-expense';
        
        row.innerHTML = `
          <td class="${typeClass}">${cat.category_name}</td>
          <td class="${typeClass}">${cat.category_type}</td>
        `;
        // --- END MODIFICATION ---

        categoryTableBody.appendChild(row);
      });

      console.log("✅ Categories loaded and displayed in the table.");

    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      categoryTableBody.innerHTML = `<tr><td colspan="2">Error loading categories.</td></tr>`;
    }
  };

  // --- Event Listener for Adding a New Category ---
  categoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const categoryName = categoryForm.querySelector('input[name="name"]').value;
    const categoryType = categoryForm.querySelector('select[name="type"]').value;

    const body = {
      category_name: categoryName,
      category_type: categoryType,
    };

    try {
      const res = await fetch("http://localhost:5000/api/categories", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        location.reload();
      } else {
        const errorData = await res.json();
        alert(`Failed to add category: ${errorData.message || "Unknown server error"}`);
      }
    } catch (err) {
      alert("A network error occurred. Check the console.");
    }
  });

  // --- Initial Load ---
  loadCategories();
});