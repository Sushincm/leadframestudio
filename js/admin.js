// Supabase Configuration
const SUPABASE_URL = "https://muviicdrytagcbdgqbvn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11dmlpY2RyeXRhZ2NiZGdxYnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTI0MjcsImV4cCI6MjA4NjE4ODQyN30.cJ86VJ40vICeIVKPG5-smOhI41F9NmH49kick3RYZ7c";

const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State
let leads = [];
let filteredLeads = [];

// DOM Elements
const leadsGrid = document.getElementById("leads-grid");
const searchInput = document.getElementById("search-input");
const totalLeadsEl = document.getElementById("total-leads");
const newLeadsEl = document.getElementById("new-leads");

// Initial Load
// ==========================================
// AUTHENTICATION & UI LOGIC
// ==========================================

const ADMIN_CREDS = {
  username: "leadframeadmin",
  password: "leadadmin123",
};

document.addEventListener("DOMContentLoaded", () => {
  // Check Auth
  checkAuth();

  // Debug check
  if (!window.supabase) {
    const errorMsg = "Supabase SDK not loaded. Check your internet connection.";
    console.error(errorMsg);
    if (leadsGrid)
      leadsGrid.innerHTML = `<div style="text-align: center; width: 100%; grid-column: 1 / -1; padding: 2rem; color:red;">${errorMsg}</div>`;
    const cmsContainer = document.getElementById("cms-container");
    if (cmsContainer)
      cmsContainer.innerHTML = `<div style="color:red; text-align:center;">${errorMsg}</div>`;
    return;
  }

  if (isAuthenticated()) {
    fetchLeads();
    if (searchInput) searchInput.addEventListener("input", handleSearch);
  }
});

function isAuthenticated() {
  return localStorage.getItem("admin_auth") === "true";
}

function checkAuth() {
  const overlay = document.getElementById("login-overlay");
  if (!overlay) return;

  if (isAuthenticated()) {
    overlay.style.display = "none";
    // Add logout button if not present
    if (!document.getElementById("logout-btn")) {
      const headerRight = document.querySelector(".header__right");
      if (headerRight) {
        headerRight.innerHTML = `
                    <button id="logout-btn" onclick="logout()" style="background:none; border:none; color:#ef4444; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.5rem;">
                        <i data-lucide="log-out" style="width:16px;"></i> Logout
                    </button>
                `;
        if (window.lucide) lucide.createIcons();
      }
    }
  } else {
    overlay.style.display = "flex";
  }
}

window.handleLogin = () => {
  const userIn = document.getElementById("admin-username").value;
  const passIn = document.getElementById("admin-password").value;
  const errorEl = document.getElementById("login-error");

  if (userIn === ADMIN_CREDS.username && passIn === ADMIN_CREDS.password) {
    localStorage.setItem("admin_auth", "true");
    document.getElementById("login-overlay").style.display = "none";

    // Load data now that we are logged in
    fetchLeads();
    if (searchInput) searchInput.addEventListener("input", handleSearch);
    checkAuth(); // To add logout button
  } else {
    errorEl.style.display = "block";
  }
};

window.logout = () => {
  localStorage.removeItem("admin_auth");
  location.reload();
};

window.toggleSidebar = () => {
  document.querySelector(".sidebar").classList.toggle("active");

  // Add overlay if it doesn't exist
  let overlay = document.querySelector(".sidebar-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.onclick = window.toggleSidebar;
    document.body.appendChild(overlay);
  }
  overlay.classList.toggle("active");
};

// ==========================================
// NAVIGATION
// ==========================================
window.switchView = (viewName) => {
  // Update Sidebar
  document
    .querySelectorAll(".nav__item")
    .forEach((el) => el.classList.remove("active"));

  // Hide all views first
  document.getElementById("leads-view").style.display = "none";
  document.getElementById("cms-view").style.display = "none";

  if (viewName === "leads") {
    document.querySelector(".nav__item:nth-child(1)").classList.add("active");
    document.getElementById("leads-view").style.display = "block";
  } else if (viewName === "cms") {
    document.querySelector(".nav__item:nth-child(2)").classList.add("active");
    document.getElementById("cms-view").style.display = "block";
    fetchCMSContent(); // Fetch when switching
  }
};

// ==========================================
// LEADS FUNCTIONALITY
// ==========================================

// Fetch Leads
async function fetchLeads() {
  if (!leadsGrid) return; // Guard clause

  try {
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    leads = data;
    filteredLeads = data;
    updateStats();
    renderLeads();
  } catch (err) {
    console.error("Error fetching leads:", err);
    leadsGrid.innerHTML = `<div style="text-align: center; width: 100%; grid-column: 1 / -1; padding: 2rem; color: var(--danger);">Error loading leads: ${err.message}</div>`;
  }
}

// Render Leads Table
// Render Leads Table (Now Grid)
function renderLeads() {
  // Use the grid container instead of table body
  const leadsGrid = document.getElementById("leads-grid");
  if (!leadsGrid) return;

  leadsGrid.innerHTML = "";

  if (filteredLeads.length === 0) {
    leadsGrid.innerHTML = `<div style="text-align: center; width: 100%; grid-column: 1 / -1; padding: 2rem;">No leads found.</div>`;
    return;
  }

  filteredLeads.forEach((lead) => {
    const card = document.createElement("div");
    card.className = "lead-card";

    // Add click event to open details
    // Avoid triggering when clicking specific buttons inside
    card.onclick = (e) => {
      if (!e.target.closest(".actions") && !e.target.closest("select")) {
        viewLead(lead.id);
      }
    };

    const date = new Date(lead.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Determine Badge Color
    let badgeClass = "badge--new";
    if (lead.status === "contacted") badgeClass = "badge--contacted";
    if (lead.status === "closed") badgeClass = "badge--closed";

    // Project Details Preview (or message fallback)
    const projectPreview =
      lead.project_details || lead.message || "No details provided.";

    card.innerHTML = `
      <div class="lead-card__header">
          <div>
            <span class="lead-card__date">${date}</span>
            <div class="lead-card__name">${lead.name || "N/A"}</div>
            <div class="lead-card__email">
                <i data-lucide="mail" style="width: 14px; height: 14px;"></i>
                ${lead.email || "-"}
            </div>
            <span class="lead-card__service">${lead.service_interest || "General"}</span>
          </div>
      </div>
      
      <div class="lead-card__project-preview">
        "${projectPreview}"
      </div>

      <div class="lead-card__footer">
        <select 
          class="lead-status-select ${badgeClass}" 
          onchange="updateStatus('${lead.id}', this.value)"
          onclick="event.stopPropagation()"
        >
          <option value="new" ${lead.status === "new" ? "selected" : ""}>New</option>
          <option value="contacted" ${lead.status === "contacted" ? "selected" : ""}>Contacted</option>
          <option value="closed" ${lead.status === "closed" ? "selected" : ""}>Closed</option>
        </select>
        
        <div class="actions">
            <button class="btn-icon delete" onclick="event.stopPropagation(); deleteLead('${lead.id}')" title="Delete">
                <i data-lucide="trash-2"></i>
            </button>
        </div>
      </div>
    `;
    leadsGrid.appendChild(card);
  });

  // Re-initialize icons for new elements
  if (window.lucide) lucide.createIcons();
}

// Update Stats
function updateStats() {
  if (totalLeadsEl) totalLeadsEl.innerText = leads.length;
  // Calculate leads from last 7 days for "New This Week"
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const newLeadsCount = leads.filter(
    (l) => new Date(l.created_at) > oneWeekAgo,
  ).length;
  if (newLeadsEl) newLeadsEl.innerText = newLeadsCount;
}

// Handle Search
function handleSearch(e) {
  const term = e.target.value.toLowerCase();
  filteredLeads = leads.filter(
    (lead) =>
      (lead.name && lead.name.toLowerCase().includes(term)) ||
      (lead.email && lead.email.toLowerCase().includes(term)),
  );
  renderLeads();
}

// Update Status
window.updateStatus = async (id, newStatus) => {
  try {
    const { error } = await supabaseAdmin
      .from("form_submissions")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) throw error;

    // Update local state
    const leadIndex = leads.findIndex((l) => l.id === id);
    if (leadIndex !== -1) {
      leads[leadIndex].status = newStatus;
      // Optionally show toast success
    }
    // Re-render to update badge color
    handleSearch({ target: { value: searchInput.value } });
  } catch (err) {
    console.error("Error updating status:", err);
    alert("Failed to update status");
  }
};

// Delete Lead
window.deleteLead = async (id) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it!",
  });

  if (!result.isConfirmed) return;

  try {
    const { error } = await supabaseAdmin
      .from("form_submissions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    leads = leads.filter((l) => l.id !== id);
    filteredLeads = filteredLeads.filter((l) => l.id !== id);

    updateStats();
    renderLeads();

    Swal.fire({
      title: "Deleted!",
      text: "The lead has been deleted.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error("Error deleting lead:", err);
    Swal.fire("Error", "Failed to delete lead", "error");
  }
};

// View Lead Details
// View Lead Details
window.viewLead = (id) => {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return;

  Swal.fire({
    title: lead.name,
    html: `
            <div style="text-align: left; padding: 1rem;">
                <p><strong>Email:</strong> ${lead.email || "-"}</p>
                <p><strong>Phone:</strong> ${lead.phone || "-"}</p>
                <p><strong>Service:</strong> ${lead.service_interest || "General"}</p>
                <p><strong>Source:</strong> ${lead.source_page || "N/A"}</p>
                <hr style="margin: 1rem 0; border: 0; border-top: 1px solid #eee;">
                
                <p><strong>Project Details:</strong></p>
                <div style="white-space: pre-wrap; background: #eef2ff; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; color: var(--text-color);">
                    ${lead.project_details || "No project details provided."}
                </div>

                <p><strong>Additional Message:</strong></p>
                <p style="white-space: pre-wrap; background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">${lead.message || "No message provided."}</p>
            </div>
        `,
    width: "600px",
    confirmButtonColor: "#6366f1",
  });
};

// ==========================================
// CMS FUNCTIONALITY
// ==========================================

// ==========================================
// CMS FUNCTIONALITY
// ==========================================

window.fetchCMSContent = async () => {
  const container = document.getElementById("cms-container");
  if (!container) return;

  container.innerHTML =
    '<div style="text-align: center; padding: 2rem;">Loading content...<br><small style="color:#666">Check console for debug logs</small></div>';

  try {
    console.log("[CMS] Starting fetch...");
    console.log("[CMS] Supabase Client:", supabaseAdmin);

    // Test simple fetch first
    const { count, error: countError } = await supabaseAdmin
      .from("sections")
      .select("*", { count: "exact", head: true });
    console.log("[CMS] Sections count check:", count, countError);

    if (countError) {
      throw new Error(`Count check failed: ${countError.message}`);
    }

    const { data: sections, error } = await supabaseAdmin
      .from("sections")
      .select(
        `
                *,
                section_items(*)
            `,
      )
      .order("display_order");

    console.log("[CMS] Fetch response:", { sections, error });

    if (error) throw error;

    if (!sections) {
      console.error("[CMS] Sections data is null/undefined");
      throw new Error("Received null data from Supabase");
    }

    console.log(`[CMS] Rendering ${sections.length} sections`);
    renderCMS(sections);
  } catch (err) {
    console.error("[CMS] Critical Error:", err);
    container.innerHTML = `
            <div style="color: var(--danger); text-align: center; padding: 2rem;">
                <strong>Error loading content</strong><br>
                ${err.message}<br>
                <small>Open console (F12) for details</small>
            </div>
        `;
  }
};

function renderCMS(sections) {
  const container = document.getElementById("cms-container");
  container.innerHTML = ""; // Clear loading state

  if (!sections || sections.length === 0) {
    container.innerHTML =
      '<div style="text-align: center; padding: 2rem;">No CMS content found.</div>';
    return;
  }

  sections.forEach((section) => {
    const sectionEl = document.createElement("div");
    sectionEl.className = "cms-section";

    // Sort items by display_order
    const items = section.section_items
      ? section.section_items.sort((a, b) => a.display_order - b.display_order)
      : [];

    // Filter out Home section (attempting to remove first duplicate)
    if (section.section_name === "Home") return;

    if (items.length === 0) return; // Skip sections without items

    let itemsHtml = "";
    items.forEach((item) => {
      itemsHtml += `
                <div class="form-group">
                    <label>${formatLabel(item.field_key)}</label>
                    <textarea 
                        class="form-control" 
                        rows="${item.field_value.length > 50 ? 3 : 1}"
                        onchange="updateCMSItem('${item.id}', this.value)"
                    >${item.field_value}</textarea>
                </div>
            `;
    });

    sectionEl.innerHTML = `
            <div class="cms-section-header">
                <h3>${section.section_name}</h3>
                <span class="badge badge--new" style="background:var(--bg-color); color:var(--text-color);">${section.section_type}</span>
            </div>
            <div class="cms-section-body">
                ${itemsHtml}
            </div>
        `;
    container.appendChild(sectionEl);
  });
}

function formatLabel(key) {
  // text_top -> Text Top
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

window.updateCMSItem = async (id, value) => {
  try {
    const { error } = await supabaseAdmin
      .from("section_items")
      .update({ field_value: value })
      .eq("id", id);

    if (error) throw error;

    // Lightweight Toast
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "success",
      title: "Saved successfully",
    });
  } catch (err) {
    console.error("Error updating item:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to save changes.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
    });
  }
};
