// js/transactions.js (Complete, Updated File with Delete Functionality)

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first!");
    window.location.href = "login.html";
    return;
  }

  // --- DOM Elements ---
  const form = document.getElementById("transactionForm");
  const categorySelect = document.getElementById("category");
  const tagsSelect = document.getElementById("tags-select");
  const transactionsTbody = document.getElementById("transactions-tbody");
  const transactionDateTimeField = document.getElementById("transaction-datetime");

  if (!form || !categorySelect || !tagsSelect || !transactionsTbody || !transactionDateTimeField) {
    console.error("❌ Required DOM elements not found. Check your HTML IDs.");
    if (transactionsTbody) {
       transactionsTbody.innerHTML = `<tr><td colspan="7">Page Error: UI elements missing.</td></tr>`; // Colspan is now 7
    }
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // --- Load Categories ---
  const loadCategories = async () => { /* ... (keep existing function) ... */ 
    console.log("Attempting to load categories...");
    try {
      const res = await fetch("http://localhost:5000/api/categories", { headers });
      console.log("Category fetch response status:", res.status);

      if (res.status === 401) {
          console.error("❌ Unauthorized (401): Invalid token during category load.");
          categorySelect.innerHTML = `<option value="">Auth Error</option>`;
          transactionsTbody.innerHTML = `<tr><td colspan="7">Authentication error. Please log in again.</td></tr>`; 
          return;
      }
      if (!res.ok) { 
          const errorText = await res.text(); 
          console.error(`❌ Category fetch failed: Status ${res.status}. Response: ${errorText}`);
          categorySelect.innerHTML = `<option value="">Load Failed</option>`;
          return; 
      }
      if (res.ok) {
        const categories = await res.json();
        categorySelect.innerHTML = `<option value="">Select Category</option>`;
        categories.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat.category_id;
          option.textContent = cat.category_name;
          categorySelect.appendChild(option);
        });
        console.log("✅ Categories loaded successfully.");
      }
    } catch (err) {
      console.error("❌ Network or parsing error fetching categories:", err);
      categorySelect.innerHTML = `<option value="">Error</option>`;
    }
  };

  // --- Load Tags ---
  const loadTags = async () => { /* ... (keep existing function) ... */ 
    try {
      const res = await fetch("http://localhost:5000/api/tags", { headers });
       if (!res.ok) throw new Error(`Tag fetch failed: ${res.status}`);
      const tags = await res.json();
      tagsSelect.innerHTML = '';
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

  // --- Load and Display Transactions ---
  const loadTransactions = async () => {
    console.log("Attempting to load transactions...");
    try {
      const res = await fetch("http://localhost:5000/api/transactions", { headers });
      console.log("Transaction fetch response status:", res.status);

      if (!res.ok) {
         const errorText = await res.text();
         console.error(`❌ Transaction fetch failed: Status ${res.status}. Response: ${errorText}`);
         transactionsTbody.innerHTML = `<tr><td colspan="7">Error loading transactions.</td></tr>`; // Colspan 7
         return;
      }

      const transactions = await res.json();
      transactionsTbody.innerHTML = "";

      if (transactions.length === 0) {
        transactionsTbody.innerHTML = `<tr><td colspan="7">No transactions found. Add one above!</td></tr>`; // Colspan 7
        return;
      }

      transactions.forEach((tran) => {
        const row = document.createElement("tr");
        let dateTimeString = "Invalid Date";
        if (tran.transaction_date) {
            try {
                const transactionDateTime = new Date(tran.transaction_date);
                if (!isNaN(transactionDateTime.getTime())) {
                    const formattedDate = transactionDateTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const formattedTime = transactionDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    dateTimeString = `${formattedDate}, ${formattedTime}`;
                } else {
                     console.warn("Received invalid date format:", tran.transaction_date);
                }
            } catch (formatErr) {
                console.error("Error formatting date:", tran.transaction_date, formatErr);
            }
        } else {
            dateTimeString = "N/A";
        }

        // ✅ FIX: Added new <td> for the delete button
        // Added Bootstrap classes btn, btn-danger (red), btn-sm (small), rounded-pill (elongated)
        // Added data-id attribute to store the transaction ID
        row.innerHTML = `
          <td>${parseFloat(tran.amount).toFixed(2)}</td>
          <td>${tran.description || "-"}</td>
          <td>${dateTimeString}</td>
          <td>${tran.category || "N/A"}</td>
          <td>${tran.tags || ""}</td>
          <td>${tran.payment_mode || "-"}</td>
          <td>
            <button class="btn btn-danger btn-sm rounded-pill delete-transaction-btn" data-id="${tran.transaction_id}">
              <i class="fas fa-trash-alt"></i> Delete 
            </button>
          </td>
        `;
        transactionsTbody.appendChild(row);
      });
      console.log("✅ Transactions loaded successfully.");

      // ✅ FIX: Attach listeners AFTER rows are added to the DOM
      attachDeleteListeners();

    } catch (err) {
      console.error("❌ Network or parsing error fetching transactions:", err);
      transactionsTbody.innerHTML = `<tr><td colspan="7">Error loading transactions.</td></tr>`; // Colspan 7
    }
  };

  // --- NEW Function to Attach Delete Button Listeners ---
  const attachDeleteListeners = () => {
    const deleteButtons = transactionsTbody.querySelectorAll('.delete-transaction-btn');
    deleteButtons.forEach(button => {
      // Remove existing listener to prevent duplicates if loadTransactions is called multiple times
      button.replaceWith(button.cloneNode(true)); 
    });
    // Add new listeners to the cloned buttons
    transactionsTbody.querySelectorAll('.delete-transaction-btn').forEach(button => {
       button.addEventListener('click', handleDeleteTransaction);
    });
  };

  // --- NEW Function to Handle Delete Click ---
  const handleDeleteTransaction = async (event) => {
    const button = event.currentTarget; // Use currentTarget to ensure we get the button
    const transactionId = button.dataset.id; // Get ID from data-id attribute

    if (!transactionId) {
        console.error("Delete button clicked but no transaction ID found.");
        return;
    }

    // Confirmation dialog
    if (confirm(`Are you sure you want to delete transaction ID ${transactionId}?`)) {
      console.log(`Attempting to delete transaction ID: ${transactionId}`);
      try {
        const res = await fetch(`http://localhost:5000/api/transactions/${transactionId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          let errorMsg = `Failed to delete (${res.status})`;
          try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorMsg;
          } catch(e) {}
          throw new Error(errorMsg);
        }

        console.log(`Transaction ${transactionId} deleted successfully.`);
        // Remove the row directly or reload the whole table
        // button.closest('tr').remove(); // Option 1: Remove row visually
        loadTransactions();       // Option 2: Reload data from server (safer)

      } catch (err) {
        console.error("❌ Error deleting transaction:", err);
        alert(`Error: ${err.message}`);
      }
    } else {
      console.log("Deletion cancelled by user.");
    }
  };


  // --- Add New Transaction ---
  form.addEventListener("submit", async (e) => { /* ... (keep existing function) ... */ 
    e.preventDefault();

    const selectedTagOptions = [...tagsSelect.options].filter(option => option.selected);
    const tag_ids = selectedTagOptions.map(option => parseInt(option.value, 10));

    const formData = {
      amount: document.getElementById("amount").value,
      description: document.getElementById("description").value,
      category_id: document.getElementById("category").value,
      payment_mode: document.getElementById("payment_mode").value,
      tag_ids: tag_ids,
    };

    const userDateTime = transactionDateTimeField.value;
    if (userDateTime) {
        try {
             const dateObj = new Date(userDateTime); 
             if (isNaN(dateObj.getTime())) throw new Error("Invalid date/time value selected.");
             formData.transaction_date = dateObj.toISOString(); 
             console.log("Sending user-provided date (ISO format):", formData.transaction_date);
        } catch (dateErr) {
            alert("Invalid date/time format entered.");
            console.error("Invalid date input:", userDateTime, dateErr);
            return;
        }
    } else {
        console.log("No date provided by user, backend will use default NOW().");
    }

    if (!formData.amount || !formData.description || !formData.category_id || !formData.payment_mode) {
        alert("Please fill in Amount, Description, Category, and Payment Mode.");
        return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/transactions", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        let errorMsg = `Failed to add transaction (${res.status})`;
        try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorData.error || errorMsg;
        } catch (parseErr) {
             console.error("Could not parse error response from backend.");
        }
        throw new Error(errorMsg);
      }

      form.reset(); 
      loadTransactions(); 
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
      console.error("Error adding transaction:", err);
    }
  });

  // --- Logout Button ---
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) { /* ... (keep existing listener) ... */ 
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }

  // --- Initial Page Load ---
  async function initializePage() {
    await loadCategories(); 
    await loadTags();
    await loadTransactions();
  }
  initializePage();

});