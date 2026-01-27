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
    ".section__title, .section__subtitle, .service__card, .process__step, .work__card, .testimonial__card, .hero__content > *, .contact__wrapper",
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
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector(".btn");
      const originalText = btn.innerHTML;

      // Loading state
      btn.innerHTML = "Sending...";
      btn.style.opacity = "0.8";

      setTimeout(() => {
        btn.innerHTML = "Message Sent!";
        btn.style.backgroundColor = "var(--success-color)";
        btn.style.opacity = "1";

        contactForm.reset();
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.backgroundColor = "";
        }, 3000);
      }, 1000);
    });
  }
});
