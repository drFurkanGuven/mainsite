/**
 * Navigation: mobile menu and scroll spy.
 */

const SECTIONS = ["hero", "projects", "experience", "github", "skills"];

export function initNavigation() {
  const toggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const navLinks = document.querySelectorAll("[data-nav]");
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          const match = link.getAttribute("href") === `#${id}`;
          link.setAttribute("aria-current", match ? "true" : "false");
        });
      }
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );

  SECTIONS.forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}
