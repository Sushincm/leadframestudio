document.addEventListener("DOMContentLoaded", () => {
  // Initial Icon Creation
  lucide.createIcons();

  // SMOOTH SCROLL FOR ANCH LINKS
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // HEADER SCROLL EFFECT
  const header = document.querySelector(".header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // MOBILE MENU TOGGLE
  const navMenu = document.getElementById("nav-menu"),
    navToggle = document.getElementById("nav-toggle"),
    navClose = document.getElementById("nav-close"),
    navLinks = document.querySelectorAll(".nav__link");

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.add("show-menu");
    });
  }

  if (navClose) {
    navClose.addEventListener("click", () => {
      navMenu.classList.remove("show-menu");
    });
  }

  navLinks.forEach((n) =>
    n.addEventListener("click", () => {
      navMenu.classList.remove("show-menu");
    }),
  );

  // SCROLL ANIMATIONS (Intersection Observer)
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target); // Trigger once
      }
    });
  }, observerOptions);

  // Elements to animate
  const animatedElements = document.querySelectorAll(
    ".section__title, .section__subtitle, .service__card, .process__step, .work__card, .testimonial__card, .insight__card, .hero__content > *, .contact__wrapper",
  );

  animatedElements.forEach((el, index) => {
    el.classList.add("reveal");
    // Add staggered delay for grid items
    if (
      el.classList.contains("service__card") ||
      el.classList.contains("process__step") ||
      el.classList.contains("work__card")
    ) {
      el.style.transitionDelay = `${(index % 3) * 0.1}s`;
    }
    observer.observe(el);
  });

  // FORM HANDLING
  const contactForm = document.getElementById("contact-form");

  // Supabase Configuration
  const SUPABASE_URL = "https://muviicdrytagcbdgqbvn.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11dmlpY2RyeXRhZ2NiZGdxYnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTI0MjcsImV4cCI6MjA4NjE4ODQyN30.cJ86VJ40vICeIVKPG5-smOhI41F9NmH49kick3RYZ7c";

  if (contactForm && window.supabase) {
    const supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
    );

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector(".btn");
      const originalText = btn.innerHTML;

      // Get form data
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;

      // Get Project Details (renamed from message)
      const projectDetailsEl = document.getElementById("project_details");
      const projectDetails = projectDetailsEl ? projectDetailsEl.value : "";

      // Use project details for both fields to ensure data compatibility
      const message = projectDetails;

      // Loading state
      btn.innerHTML = "Sending...";
      btn.style.opacity = "0.8";
      btn.disabled = true;

      try {
        const { error } = await supabaseClient.from("form_submissions").insert([
          {
            name,
            email,
            message: message, // Standard field
            project_details: projectDetails, // New specific field
            source_page: "landing_page",
            service_interest: "General Inquiry",
          },
        ]);

        if (error) throw error;

        // Success state
        btn.innerHTML = "Message Sent!";
        btn.style.backgroundColor = "var(--success-color)"; // Ensure this var exists or use specific color
        if (
          !getComputedStyle(document.documentElement).getPropertyValue(
            "--success-color",
          )
        ) {
          btn.style.backgroundColor = "#10b981";
        }
        btn.style.opacity = "1";

        contactForm.reset();

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.backgroundColor = "";
          btn.disabled = false;
        }, 3000);
      } catch (err) {
        console.error("Submission error:", err);
        btn.innerHTML = "Error. Try again.";
        btn.style.backgroundColor = "#ef4444";

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.backgroundColor = "";
          btn.disabled = false;
        }, 3000);
      }
    });
  }

  // Initialize AOS
  AOS.init({
    duration: 800,
    easing: "ease-out",
    once: true,
    offset: 50,
  });

  // Number Counter Animation
  const animateValue = (obj, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerHTML = end;
        // Restore original suffix if needed, but for now we replace content.
        // Better approach: use data attributes or just simple text replacement if strictly numbers.
        // Given the user request, we need specific counters.
      }
    };
    window.requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const counters = entry.target.querySelectorAll(
            ".solution__stat-value",
          );
          counters.forEach((counter) => {
            // Extract number from text (e.g. "3x" -> 3, "10+" -> 10)
            const text = counter.innerText;
            const number = parseFloat(text.replace(/[^0-9.]/g, ""));
            const suffix = text.replace(/[0-9.]/g, ""); // Keep 'x', '+', etc.

            if (!isNaN(number)) {
              animateValue(counter, 0, number, 2000);
              // Note: animateValue as written replaces innerHTML.
              // We need to preserve the suffix.
              // Let's modify animateValue slightly inline or wrapper.
              let startTimestamp = null;
              const duration = 2000;
              const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min(
                  (timestamp - startTimestamp) / duration,
                  1,
                );
                const currentVal = Math.floor(progress * number);
                counter.innerHTML = currentVal + suffix;
                if (progress < 1) {
                  window.requestAnimationFrame(step);
                } else {
                  counter.innerHTML = number + suffix;
                }
              };
              window.requestAnimationFrame(step);
            }
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  const solutionText = document.querySelector(".solution__text");
  if (solutionText) {
    counterObserver.observe(solutionText);
  }
});
