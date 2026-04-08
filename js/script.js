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

  // HEADER SCROLL EFFECT WITH HIDE/SHOW
  const header = document.querySelector(".header");
  let lastScrollTop = 0;
  let scrollThreshold = 50;

  window.addEventListener("scroll", () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Add scrolled class for styling
    if (scrollTop > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    // Hide/show header based on scroll direction
    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
      // Scrolling down - hide header
      header.classList.add("header--hidden");
    } else {
      // Scrolling up - show header
      header.classList.remove("header--hidden");
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
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

  // FORM HANDLING (Google Forms)
  const contactForm = document.getElementById("contact-form");

  window.handleFormSuccess = () => {
    const btn = contactForm.querySelector(".btn");
    btn.innerHTML = "Message Sent!";
    btn.style.backgroundColor = "#10b981";
    btn.style.opacity = "1";
    contactForm.reset();

    setTimeout(() => {
      btn.innerHTML = "Send Message";
      btn.style.backgroundColor = "";
      btn.disabled = false;
      window.submitted = false; // Reset for next submission
    }, 3000);
  };

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      const btn = contactForm.querySelector(".btn");
      btn.innerHTML = "Sending...";
      btn.style.opacity = "0.8";
      btn.disabled = true;
      // The actual submission is handled by the form's target="hidden_iframe"
    });
  }

  // HOMEPAGE SHOWCASE RENDERING
  function renderHomepageShowcase() {
    const container = document.getElementById("homepage-showcase-grid");
    if (!container || !window.worksData) return;

    // Latest works first - Reverse and take first 3
    const latestWorks = [...window.worksData].reverse().slice(0, 3);

    container.innerHTML = latestWorks
      .map(
        (work, index) => `
      <div class="showcase__item" data-aos="fade-up" data-aos-delay="${index * 100}">
        <a href="${work.link}" class="work__card" target="_blank" rel="noopener noreferrer">
          <div class="work__img-wrapper">
             <img src="${work.image}" alt="${work.title}">
          </div>
          <div class="work__content">
            <span class="work__category">${work.category}</span>
            <h3 class="work__title">${work.title}</h3>
            <p class="work__description">${work.description}</p>
            <div class="btn btn--small btn--secondary">
               View Live Site
               <i data-lucide="external-link" class="btn__icon" style="width: 14px; height: 14px;"></i>
            </div>
          </div>
        </a>
      </div>
    `,
      )
      .join("");

    // Re-trigger Lucide for new icons if any
    if (window.lucide) lucide.createIcons();
  }

  // Initialize Showcase on Load (Disabled for hardcoded home page cards)
  // renderHomepageShowcase();

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
