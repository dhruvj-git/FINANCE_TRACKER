// js/tags.js (Complete & Updated File)

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You are not logged in. Please log in.");
    window.location.href = "login.html";
    return;
  }

  // --- DOM Elements ---
  const tagForm = document.getElementById("tagForm");
  const tagTableBody = document.getElementById("tag-table-body");

  if (!tagForm || !tagTableBody) {
    console.error("Required elements not found in HTML.");
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // --- Function to Load and Display Tags ---
  const loadTags = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tags", { headers });
      if (!res.ok) throw new Error("Failed to fetch tags");

      const tags = await res.json();
      tagTableBody.innerHTML = ""; // Clear old rows

      if (tags.length === 0) {
        tagTableBody.innerHTML = `<tr><td colspan="3">No tags found. Add one!</td></tr>`;
        return;
      }

      tags.forEach((tag) => {
        const row = document.createElement("tr");
        
        // --- START OF MODIFICATION ---
        // Updated button to use Bootstrap classes, icon, and "rounded-pill"
        // to match the transactions page.
        row.innerHTML = `
          <td>${tag.tag_name}</td>
          <td>${tag.usage_count}</td>
          <td class="actions">
            <button class="btn btn-danger btn-sm rounded-pill delete-btn" data-id="${tag.tag_id}">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
          </td>
        `;
        // --- END OF MODIFICATION ---
        
        tagTableBody.appendChild(row);
      });

      // Re-attach delete event listeners after rendering
      attachDeleteListeners();

    } catch (err) {
      console.error("❌ Error fetching tags:", err);
      tagTableBody.innerHTML = `<tr><td colspan="3">Error loading tags.</td></tr>`;
    }
  };

  // --- Function to Attach Delete Listeners ---
  const attachDeleteListeners = () => {
    // This function finds all buttons with the class "delete-btn"
    // and adds the click event to them.
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      // Remove old listener to prevent duplicates (good practice)
      btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        // Use currentTarget to ensure we get the button, even if user clicks the icon
        const id = e.currentTarget.getAttribute("data-id"); 
        
        if (confirm("Are you sure you want to delete this tag?")) {
          try {
            const delRes = await fetch(`http://localhost:5000/api/tags/${id}`, {
              method: "DELETE",
              headers,
            });
            if (delRes.ok) {
              loadTags(); // Refresh the list
            } else {
              const error = await delRes.json();
              alert(`❌ Failed to delete tag: ${error.message || 'Unknown error'}`);
            }
          } catch (err) {
            console.error("Deletion error:", err);
          }
        }
      });
    });
  };

  // --- Event Listener for Adding a New Tag ---
  tagForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tagNameInput = document.getElementById("tag_name");
    const body = { tag_name: tagNameInput.value };

    try {
      const res = await fetch("http://localhost:5000/api/tags", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        tagForm.reset();
        loadTags(); // Refresh the list
      } else {
        const error = await res.json();
        alert(`❌ Failed to add tag: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error adding tag:", err);
    }
  });

  // --- Initial Load ---
  loadTags();
});