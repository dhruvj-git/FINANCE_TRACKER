document.addEventListener("DOMContentLoaded", () => {
  // --- Check for login token first ---
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first!");
    window.location.href = "login.html";
    return;
  }

  // --- Get DOM Elements ---
  const form = document.getElementById("transactionForm");
  const categorySelect = document.getElementById("category");
  const tagsSelect = document.getElementById("tags-select"); // New element for tags
  const transactionsTbody = document.getElementById("transactions-tbody");

  if (!form || !categorySelect || !tagsSelect || !transactionsTbody) {
    console.error("❌ Required DOM elements not found. Check your HTML IDs.");
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
      const categories = await res.json();
      
      categorySelect.innerHTML = `<option value="">Select Category</option>`;
      categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.category_id;
        option.textContent = cat.category_name;
        categorySelect.appendChild(option);
      });
      console.log("✅ Categories loaded.");
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      categorySelect.innerHTML = `<option value="">Failed to load</option>`;
    }
  };

  // --- NEW Function to Load Tags into Multi-Select ---
  const loadTags = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tags", { headers });
      const tags = await res.json();

      tagsSelect.innerHTML = ''; // Clear existing options
      tags.forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag.tag_id;
        option.textContent = tag.tag_name;
        tagsSelect.appendChild(option);
      });
      console.log("✅ Tags loaded for multi-select.");
    } catch (err) {
      console.error("❌ Error fetching tags:", err);
    }
  };

  // --- Function to Load and Display Transactions ---
  const loadTransactions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/transactions", { headers });
      if (!res.ok) throw new Error("Failed to fetch transactions");

      const transactions = await res.json();
      transactionsTbody.innerHTML = "";

      if (transactions.length === 0) {
        // FIX: Updated colspan to 6 for the new "Tags" column
        transactionsTbody.innerHTML = `<tr><td colspan="6">No transactions found.</td></tr>`;
        return;
      }

      transactions.forEach((tran) => {
        const row = document.createElement("tr");
        const transactionDate = new Date(tran.transaction_date).toLocaleDateString();

        // FIX: Added a cell for displaying aggregated tags
        row.innerHTML = `
          <td>${parseFloat(tran.amount).toFixed(2)}</td>
          <td>${tran.description || "-"}</td>
          <td>${transactionDate}</td>
          <td>${tran.category || "N/A"}</td>
          <td>${tran.payment_mode || "-"}</td>
          <td>${tran.tags || ""}</td>
        `;
        transactionsTbody.appendChild(row);
      });
      console.log("✅ Transactions loaded.");
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      transactionsTbody.innerHTML = `<tr><td colspan="6">Failed to load transactions.</td></tr>`;
    }
  };

  // --- Event Listener for Adding a New Transaction ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // FIX: Get selected tag IDs from the multi-select box
    const selectedTagOptions = [...tagsSelect.options].filter(option => option.selected);
    const tag_ids = selectedTagOptions.map(option => parseInt(option.value, 10));

    const formData = {
      amount: document.getElementById("amount").value,
      description: document.getElementById("description").value,
      transaction_date: document.getElementById("date").value,
      category_id: document.getElementById("category").value,
      payment_mode: document.getElementById("payment_mode").value,
      tag_ids: tag_ids, // FIX: Pass the array of selected tag IDs
    };

    try {
      const res = await fetch("http://localhost:5000/api/transactions", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add transaction");
      }

      form.reset();
      loadTransactions(); // Refresh the list to show the new transaction
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
      console.error("Error adding transaction:", err);
    }
  });

  // --- Initial Page Load ---
  loadCategories();
  loadTags(); // Load tags when the page opens
  loadTransactions();
});

/*document.addEventListener("DOMContentLoaded", () => {
  // ✅ Get DOM elements
  const form = document.getElementById("transactionForm");
  const categorySelect = document.getElementById("category");
  const transactionsTbody = document.getElementById("transactions-tbody");

  if (!form || !categorySelect || !transactionsTbody) {
    console.error("❌ Required DOM elements not found. Check your HTML IDs.");
    return; 
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first!");
    window.location.href = "login.html";
    return;
  }

  // ------------------------------
  // ✅ Load categories (Fixed)
  // ------------------------------
  const loadCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 🟢 FIX: Handle invalid token / unauthorized
      if (res.status === 401) {
        console.error("❌ Unauthorized: Invalid or expired token.");
        categorySelect.innerHTML = `<option value="">Login again to load categories</option>`;
        return;
      }

      const data = await res.json();
      console.log("🔥 Category API response:", data);

      // 🟢 FIX: Support different API shapes
      let categories = [];
      if (Array.isArray(data)) {
        categories = data;
      } else if (data && Array.isArray(data.categories)) {
        categories = data.categories;
      }

      if (!categories.length) {
        console.error("❌ No categories found in response:", data);
        categorySelect.innerHTML = `<option value="">No categories found</option>`;
        return;
      }

      categorySelect.innerHTML = `<option value="">Select Category</option>`;
      categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.category_id;
        option.textContent = cat.category_name;
        categorySelect.appendChild(option);
      });

      console.log("✅ Categories loaded:", categories);
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      categorySelect.innerHTML = `<option value="">Failed to load</option>`;
    }
  };

  // ------------------------------
  // ✅ Load transactions (Fixed category join)
  // ------------------------------
  const loadTransactions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        console.error("❌ Unauthorized: Invalid or expired token.");
        transactionsTbody.innerHTML = `<tr><td colspan="5">Please log in again</td></tr>`;
        return;
      }

      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        console.error("❌ Error loading transactions:", data);
        transactionsTbody.innerHTML = `<tr><td colspan="5">Failed to load transactions</td></tr>`;
        return;
      }

      transactionsTbody.innerHTML = "";
      if (data.length === 0) {
        transactionsTbody.innerHTML = `<tr><td colspan="5">No transactions found</td></tr>`;
        return;
      }

      data.forEach((tran) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${tran.amount}</td>
          <td>${tran.description || "-"}</td>
          <td>${tran.transaction_date ? new Date(tran.transaction_date).toLocaleDateString() : "-"}</td>
          <td>${tran.category_name || "N/A"}</td> <!-- 🟢 FIX -->
          <td>${tran.payment_mode || "-"}</td>
        `;
        transactionsTbody.appendChild(row);
      });

      console.log("✅ Transactions loaded:", data);
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      transactionsTbody.innerHTML = `<tr><td colspan="5">Failed to load transactions</td></tr>`;
    }
  };

  // ------------------------------
  // ✅ Add new transaction
  // ------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      amount: parseFloat(document.getElementById("amount").value),
      description: document.getElementById("description").value,
      transaction_date: document.getElementById("date").value,
      category_id: parseInt(document.getElementById("category").value),
      payment_mode: document.getElementById("payment_mode").value,
    };

    try {
      const res = await fetch("http://localhost:5000/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`❌ Error adding transaction: ${data.error || JSON.stringify(data)}`);
        return;
      }

      alert("✅ Transaction added!");
      form.reset();
      loadTransactions();
    } catch (err) {
      console.error("❌ Error adding transaction:", err);
      alert("❌ Server error while adding transaction");
    }
  });

  // ✅ Initial load
  loadCategories();
  loadTransactions();
});*/

