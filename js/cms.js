// Supabase Configuration (Ensure this matches your credentials)
const SUPABASE_URL_CMS = "https://muviicdrytagcbdgqbvn.supabase.co";
const SUPABASE_KEY_CMS =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11dmlpY2RyeXRhZ2NiZGdxYnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTI0MjcsImV4cCI6MjA4NjE4ODQyN30.cJ86VJ40vICeIVKPG5-smOhI41F9NmH49kick3RYZ7c";

// Initialize Client if not already done in script.js (checking window.supabase)
let supabaseCMS;
if (window.supabase) {
  supabaseCMS = window.supabase.createClient(
    SUPABASE_URL_CMS,
    SUPABASE_KEY_CMS,
  );
}

document.addEventListener("DOMContentLoaded", () => {
  if (supabaseCMS) {
    loadContent();
  } else {
    console.error("Supabase client not initialized.");
  }
});

async function loadContent() {
  try {
    console.log("Fetching CMS content...");

    // Fetch all sections and their items
    // We use a join here: sections -> section_items
    const { data: sections, error } = await supabaseCMS.from("sections")
      .select(`
                id,
                section_name,
                section_items (
                    field_key,
                    field_value
                )
            `);

    if (error) throw error;

    if (!sections || sections.length === 0) {
      console.warn("No CMS content found.");
      return;
    }

    // Iterate through fetched sections and map to DOM
    sections.forEach((section) => {
      const sectionName = section.section_name;
      const items = section.section_items;

      if (!items) return;

      // Find all DOM elements for this section
      // We look for elements with data-section="SectionName"
      // and data-field="field_key"

      items.forEach((item) => {
        const element = document.querySelector(
          `[data-section="${sectionName}"][data-field="${item.field_key}"]`,
        );

        if (element) {
          // Update content
          // Check if it should be innerHTML (for spans/formatting) or innerText
          // Generally, safe to use innerHTML if we trust the Admin, but textContent is safer.
          // For this use case, we might have some <br> or <span> so let's use innerHTML carefully.

          // Special cases for links
          if (element.tagName === "A" && item.field_key.includes("link")) {
            element.href = item.field_value;
          }
          // Special case for images (src) - if we had them
          else if (
            element.tagName === "IMG" &&
            item.field_key.includes("src")
          ) {
            element.src = item.field_value;
          } else {
            element.innerHTML = item.field_value;
          }

          // Add a class to show it's CMS managed (optional, for debugging)
          element.classList.add("cms-loaded");
        }
      });
    });

    console.log("CMS content loaded successfully.");
  } catch (err) {
    console.error("Error loading CMS content:", err);
  }
}
