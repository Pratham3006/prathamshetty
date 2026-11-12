// === DOM References ===
const nav = document.querySelector(".nav");
const navMenu = document.querySelector(".nav-items");
const btnToggleNav = document.querySelector(".menu-btn");
const workEls = document.querySelectorAll(".work-box");
const workImgs = document.querySelectorAll(".work-img");
const mainEl = document.querySelector("main");
const yearEl = document.querySelector(".footer-text span");
const switchThemeEl = document.querySelector('input[type="checkbox"]');
const lastFocusedEl = document.querySelector('a[data-focused="last-focused"]');
const targets = ["GitHub", "Next.js","Microsoft","Notion"];
const selector = targets.map((alt) => `img[alt="${alt}"]`).join(", ");

// === Navigation Toggle ===
const toggleNav = () => {
  nav.classList.toggle("hidden");
  document.body.classList.toggle("lock-screen");

  if (nav.classList.contains("hidden")) {
    btnToggleNav.textContent = "menu";
  } else {
    setTimeout(() => {
      btnToggleNav.textContent = "close";
    }, 475);
  }
};

btnToggleNav.addEventListener("click", toggleNav);

navMenu.addEventListener("click", (e) => {
  if (e.target.localName === "a") toggleNav();
});

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !nav.classList.contains("hidden")) toggleNav();
});

// === Work Section Scroll Animation ===
workImgs.forEach((workImg) => workImg.classList.add("transform"));

const observer = new IntersectionObserver(
  (entries) => {
    const [entry] = entries;
    const [textbox, picture] = Array.from(entry.target.children);
    if (entry.isIntersecting) {
      picture.classList.remove("transform");
      Array.from(textbox.children).forEach(
        (el) => (el.style.animationPlayState = "running")
      );
    }
  },
  { threshold: 0.3 }
);

workEls.forEach((workEl) => observer.observe(workEl));

// === Image Inversion Utility ===
function applyImageFilter(theme) {
  const images = document.querySelectorAll(selector);
  images.forEach((img) => {
    img.style.filter = theme === "dark" ? "invert(1)" : "invert(0)";
  });
}

// === Theme Logic ===
const storedTheme = localStorage.getItem("theme") || "dark";
document.body.classList.add(storedTheme);
switchThemeEl.checked = storedTheme === "dark";
applyImageFilter(storedTheme);

switchThemeEl.addEventListener("click", () => {
  const isDark = switchThemeEl.checked;
  const newTheme = isDark ? "dark" : "light";

  document.body.classList.remove("light", "dark");
  document.body.classList.add(newTheme);
  localStorage.setItem("theme", newTheme);
  applyImageFilter(newTheme);
});

// === Trap Tab Navigation when Menu Open ===
document.body.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && document.activeElement === lastFocusedEl) {
    e.preventDefault();
    btnToggleNav.focus();
  }
});

// === Logo Rotating Animation ===
const logosWrappers = document.querySelectorAll(".logo-group");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

logosWrappers.forEach(async (logoWrapper, i) => {
  const logos = Array.from(logoWrapper.children);
  await sleep(1400 * i);

  setInterval(() => {
    const temp = logos[0];
    logos[0] = logos[1];
    logos[1] = logos[2];
    logos[2] = temp;

    logos[0].classList.add("hide", "to-top");
    logos[1].classList.remove("hide", "to-top", "to-bottom");
    logos[2].classList.add("hide", "to-bottom");
  }, 5600);
});

// === Dynamic Footer Year ===
yearEl.textContent = new Date().getFullYear();

const contactForm = document.querySelector('.contact-form');
const submitBtn = contactForm.querySelector('button[type="submit"]');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get form data
  const formData = new FormData(contactForm);
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message')
  };

  // Update button state
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('https://portfoliobackend-production-b1be.up.railway.app/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      // Success message
      showMessage('Message sent successfully! I\'ll get back to you soon.', 'success');
      contactForm.reset();
    } else {
      // Error message
      showMessage(result.message || 'Failed to send message. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Network error. Please check your connection and try again.', 'error');
  } finally {
    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Message display function
function showMessage(message, type) {
  // Remove existing messages
  const existingMessage = document.querySelector('.form-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = `form-message ${type}`;
  messageEl.textContent = message;
  
  // Insert message after form
  contactForm.insertAdjacentElement('afterend', messageEl);
  
  // Remove message after 5 seconds
  setTimeout(() => {
    messageEl.remove();
  }, 5000);
}
