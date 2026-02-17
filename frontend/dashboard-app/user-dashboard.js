// User Dashboard JavaScript
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

// Mobile Menu Functions
function toggleMobileMenu() {
  const mainNav = document.getElementById("mainNav");
  const menuToggle = document.querySelector(".mobile-menu-toggle");
  const icon = menuToggle.querySelector("i");

  mainNav.classList.toggle("mobile-open");

  if (mainNav.classList.contains("mobile-open")) {
    icon.classList.remove("fa-bars");
    icon.classList.add("fa-times");
    document.body.style.overflow = "hidden";
  } else {
    icon.classList.remove("fa-times");
    icon.classList.add("fa-bars");
    document.body.style.overflow = "";
  }
}

// Close mobile menu when clicking outside
document.addEventListener("click", function (e) {
  const mainNav = document.getElementById("mainNav");
  const menuToggle = document.querySelector(".mobile-menu-toggle");

  if (
    mainNav &&
    mainNav.classList.contains("mobile-open") &&
    !menuToggle.contains(e.target) &&
    !mainNav.contains(e.target)
  ) {
    toggleMobileMenu();
  }
});

// Transaction Functions
function filterTransactions() {
  const filterType = document.getElementById("transactionFilter").value;
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  const searchTerm = document
    .getElementById("searchTransaction")
    .value.toLowerCase();

  const transactions = document.querySelectorAll(".transaction-item");

  transactions.forEach((transaction) => {
    let show = true;

    // Filter by type
    if (filterType !== "all") {
      const hasIncome = transaction.querySelector(
        ".transaction-amount.positive",
      );
      const hasExpense = transaction.querySelector(
        ".transaction-amount.negative",
      );
      const isPending = transaction.classList.contains("pending");

      if (filterType === "income" && !hasIncome) show = false;
      if (filterType === "expenses" && !hasExpense) show = false;
      if (filterType === "pending" && !isPending) show = false;
    }

    // Filter by search term
    if (searchTerm) {
      const text = transaction.textContent.toLowerCase();
      if (!text.includes(searchTerm)) show = false;
    }

    transaction.style.display = show ? "flex" : "none";
  });

  showNotification("Filters applied successfully", "success");
}

// Wallet Functions
function showAddFundsModal() {
  showNotification("Add funds modal coming soon!", "info");
}

function showAddCardModal() {
  showNotification("Add card modal coming soon!", "info");
}

function showAddBankModal() {
  showNotification("Add bank account modal coming soon!", "info");
}

// Analytics Functions
function exportAnalytics() {
  // Create CSV content for analytics export
  let csvContent =
    "Period,Total Spent,Total Received,Transactions,Average Transaction\n";

  // Add sample data
  const periods = ["Week", "Month", "Quarter", "Year"];
  periods.forEach((period) => {
    const spent = Math.floor(Math.random() * 5000);
    const received = Math.floor(Math.random() * 8000);
    const transactions = Math.floor(Math.random() * 200);
    const avg = ((spent + received) / transactions).toFixed(2);

    csvContent += `${period},$${spent},$${received},${transactions},$${avg}\n`;
  });

  // Create download link
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);

  showNotification("Analytics exported successfully!", "success");
}

// Initialize analytics period selectors
function initializeAnalytics() {
  const periodButtons = document.querySelectorAll(".period-btn");
  periodButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      periodButtons.forEach((btn) => btn.classList.remove("active"));
      // Add active class to clicked button
      this.classList.add("active");

      // Update analytics data based on period
      const period = this.dataset.period;
      updateAnalyticsData(period);
    });
  });

  // Initialize chart controls
  const chartButtons = document.querySelectorAll(".chart-btn");
  chartButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const chartType = this.dataset.chart;
      const chartContainer = this.closest(".chart-container");

      // Remove active class from sibling buttons
      chartContainer
        .querySelectorAll(".chart-btn")
        .forEach((btn) => btn.classList.remove("active"));
      // Add active class to clicked button
      this.classList.add("active");

      // Update chart type
      updateChart(chartContainer, chartType);
    });
  });
}

function updateAnalyticsData(period) {
  // Simulate updating analytics data based on period
  console.log(`Updating analytics for period: ${period}`);

  // Update metric values with animation
  const metricValues = document.querySelectorAll(
    ".analytics-metrics .metric-value",
  );
  metricValues.forEach((element) => {
    const currentValue = element.textContent;
    const newValue = generateRandomMetricValue();
    animateValue(element, currentValue, newValue, 500);
  });

  showNotification(`Analytics updated for ${period}`, "success");
}

function updateChart(chartContainer, chartType) {
  const canvas = chartContainer.querySelector("canvas");
  if (canvas) {
    // In a real application, this would update the actual chart
    console.log(`Updating chart to ${chartType}`);
    showNotification(`Chart type changed to ${chartType}`, "info");
  }
}

function generateRandomMetricValue() {
  const types = ["$1,234.56", "$8,234.56", "142", "$82.45"];
  return types[Math.floor(Math.random() * types.length)];
}

function animateValue(element, start, end, duration) {
  const startValue = parseFloat(start.replace(/[^0-9.-]+/g, ""));
  const endValue = parseFloat(end.replace(/[^0-9.-]+/g, ""));
  const range = endValue - startValue;
  const increment = range / (duration / 16);
  let current = startValue;

  const timer = setInterval(() => {
    current += increment;
    if (
      (increment > 0 && current >= endValue) ||
      (increment < 0 && current <= endValue)
    ) {
      element.textContent = end;
      clearInterval(timer);
    } else {
      element.textContent = end.startsWith("$")
        ? `$${current.toFixed(2)}`
        : Math.floor(current);
    }
  }, 16);
}

// Extend the main initialization function
function initializeApp() {
  // Check if user is logged in (in real app, this would check session/token)
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (isLoggedIn) {
    showDashboard();
  } else {
    showAuthSection();
  }

  // Initialize event listeners
  initializeAuthListeners();
  initializeNavigation();
  initializeSettingsTabs();
  initializeForms();
  initializeAnalytics();
}

// Authentication Functions
function initializeAuthListeners() {
  // Login form
  const loginForm = document.getElementById("loginFormElement");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Register form
  const registerForm = document.getElementById("registerFormElement");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
}

function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const rememberMe = document.getElementById("rememberMe").checked;

  // Simulate authentication (in real app, this would make API call)
  if (email && password) {
    // Store login state
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);

    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
    }

    // Show success message
    showNotification("Login successful! Redirecting...", "success");

    // Redirect to dashboard
    setTimeout(() => {
      showDashboard();
    }, 1500);
  } else {
    showNotification("Please fill in all fields", "error");
  }
}

function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const agreeTerms = document.getElementById("agreeTerms").checked;

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    showNotification("Please fill in all fields", "error");
    return;
  }

  if (password !== confirmPassword) {
    showNotification("Passwords do not match", "error");
    return;
  }

  if (password.length < 8) {
    showNotification("Password must be at least 8 characters", "error");
    return;
  }

  if (!agreeTerms) {
    showNotification("Please agree to the terms and conditions", "error");
    return;
  }

  // Simulate registration (in real app, this would make API call)
  showNotification("Registration successful! Please login...", "success");

  // Switch to login form
  setTimeout(() => {
    showLogin();
    // Pre-fill email
    document.getElementById("loginEmail").value = email;
  }, 1500);
}

function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
}

function showRegister() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("rememberMe");

  showNotification("Logged out successfully", "success");

  setTimeout(() => {
    showAuthSection();
  }, 1000);
}

// Navigation Functions
function initializeNavigation() {
  // Main navigation
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const section = this.dataset.section;
      if (section) {
        showSection(section);
      }
    });
  });

  // User dropdown menu
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  dropdownItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const section = this.dataset.section;
      if (section) {
        showSection(section);
        closeUserMenu();
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    const userMenu = document.getElementById("userMenu");
    const userAvatarBtn = document.querySelector(".user-avatar-btn");

    if (!userAvatarBtn.contains(e.target) && !userMenu.contains(e.target)) {
      closeUserMenu();
    }
  });
}

function showSection(sectionName) {
  // Update navigation
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.dataset.section === sectionName) {
      link.classList.add("active");
    }
  });

  // Show corresponding section
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => {
    section.classList.remove("active");
  });

  const targetSection = document.getElementById(sectionName + "Section");
  if (targetSection) {
    targetSection.classList.add("active");
  }
}

function toggleUserMenu() {
  const userMenu = document.getElementById("userMenu");
  userMenu.classList.toggle("hidden");
}

function closeUserMenu() {
  const userMenu = document.getElementById("userMenu");
  userMenu.classList.add("hidden");
}

// Settings Functions
function initializeSettingsTabs() {
  const settingsNavItems = document.querySelectorAll(".settings-nav-item");
  settingsNavItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const tab = this.dataset.tab;
      showSettingsTab(tab);
    });
  });
}

function showSettingsTab(tabName) {
  // Update navigation
  const settingsNavItems = document.querySelectorAll(".settings-nav-item");
  settingsNavItems.forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.tab === tabName) {
      item.classList.add("active");
    }
  });

  // Show corresponding tab
  const settingsTabs = document.querySelectorAll(".settings-tab");
  settingsTabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  const targetTab = document.getElementById(tabName + "Tab");
  if (targetTab) {
    targetTab.classList.add("active");
  }
}

// Form Functions
function initializeForms() {
  // Profile form
  const profileForm = document.querySelector(".profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      showNotification("Profile updated successfully!", "success");
    });
  }

  // Settings forms
  const settingsForms = document.querySelectorAll(".settings-form");
  settingsForms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showNotification("Settings saved successfully!", "success");
    });
  });
}

// Utility Functions
function showAuthSection() {
  document.getElementById("authSection").classList.remove("hidden");
  document.getElementById("dashboardSection").classList.add("hidden");
}

function showDashboard() {
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("dashboardSection").classList.remove("hidden");

  // Load user data
  loadUserData();
}

function loadUserData() {
  const userEmail = localStorage.getItem("userEmail");
  if (userEmail) {
    // Update user name display
    const userNameElements = document.querySelectorAll(".user-name");
    userNameElements.forEach((element) => {
      element.textContent = userEmail.split("@")[0]; // Use email prefix as name
    });
  }
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = event.target.closest("button").querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => {
    notification.remove();
  });

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

  // Set background color based on type
  switch (type) {
    case "success":
      notification.style.backgroundColor = "#10b981";
      break;
    case "error":
      notification.style.backgroundColor = "#ef4444";
      break;
    case "warning":
      notification.style.backgroundColor = "#f59e0b";
      break;
    default:
      notification.style.backgroundColor = "#3b82f6";
  }

  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Add animation styles
const animationStyles = `
@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;

// Inject animation styles
const styleSheet = document.createElement("style");
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Simulate real-time updates
function simulateRealTimeUpdates() {
  // Update balance periodically
  setInterval(() => {
    const balanceElements = document.querySelectorAll(".balance-amount");
    balanceElements.forEach((element) => {
      const currentBalance = parseFloat(
        element.textContent.replace(/[^0-9.-]+/g, ""),
      );
      const change = (Math.random() - 0.5) * 100; // Random change between -50 and +50
      const newBalance = currentBalance + change;

      if (element.textContent.includes("$")) {
        element.textContent = `$${newBalance.toFixed(2)}`;
      }
    });
  }, 30000); // Update every 30 seconds

  // Add new transactions periodically
  setInterval(() => {
    const transactionList = document.querySelector(".transaction-list");
    if (transactionList) {
      const newTransaction = createRandomTransaction();
      transactionList.insertBefore(newTransaction, transactionList.firstChild);

      // Remove last transaction if list is too long
      const transactions =
        transactionList.querySelectorAll(".transaction-item");
      if (transactions.length > 5) {
        transactions[transactions.length - 1].remove();
      }
    }
  }, 60000); // Add new transaction every minute
}

function createRandomTransaction() {
  const transactions = [
    {
      name: "Coffee Shop",
      category: "Food & Drink",
      icon: "fa-coffee",
      amount: -4.5,
    },
    {
      name: "Salary Deposit",
      category: "Income",
      icon: "fa-briefcase",
      amount: 3500.0,
    },
    {
      name: "Netflix",
      category: "Entertainment",
      icon: "fa-tv",
      amount: -15.99,
    },
    {
      name: "Gas Station",
      category: "Transportation",
      icon: "fa-gas-pump",
      amount: -45.0,
    },
    {
      name: "Grocery Store",
      category: "Shopping",
      icon: "fa-shopping-cart",
      amount: -123.45,
    },
  ];

  const randomTransaction =
    transactions[Math.floor(Math.random() * transactions.length)];

  const transactionItem = document.createElement("div");
  transactionItem.className = "transaction-item";
  transactionItem.innerHTML = `
        <div class="transaction-icon">
            <i class="fas ${randomTransaction.icon}"></i>
        </div>
        <div class="transaction-details">
            <h4>${randomTransaction.name}</h4>
            <p>${randomTransaction.category}</p>
            <span class="transaction-time">Just now</span>
        </div>
        <div class="transaction-amount ${
          randomTransaction.amount > 0 ? "positive" : "negative"
        }">
            ${randomTransaction.amount > 0 ? "+" : ""}$${Math.abs(
    randomTransaction.amount,
  ).toFixed(2)}
        </div>
    `;

  return transactionItem;
}

// Initialize real-time updates when dashboard is shown
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (
      mutation.target.id === "dashboardSection" &&
      !mutation.target.classList.contains("hidden")
    ) {
      simulateRealTimeUpdates();
      observer.disconnect();
    }
  });
});

observer.observe(document.getElementById("dashboardSection"), {
  attributes: true,
  attributeFilter: ["class"],
});

// Add keyboard shortcuts
document.addEventListener("keydown", function (e) {
  // Ctrl/Cmd + K for quick search (if implemented)
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    // Implement quick search functionality
    showNotification("Quick search coming soon!", "info");
  }

  // Escape to close dropdowns
  if (e.key === "Escape") {
    closeUserMenu();
  }
});

// Add loading states for buttons
function addLoadingState(button, originalText) {
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
}

function removeLoadingState(button, originalText) {
  button.disabled = false;
  button.textContent = originalText;
}

// Form validation helpers
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

function validatePhone(phone) {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

// Initialize tooltips (if needed)
function initializeTooltips() {
  const tooltipElements = document.querySelectorAll("[data-tooltip]");
  tooltipElements.forEach((element) => {
    element.addEventListener("mouseenter", function (e) {
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.textContent = this.dataset.tooltip;
      tooltip.style.cssText = `
                position: absolute;
                background: #1e293b;
                color: white;
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                font-size: 0.875rem;
                z-index: 10000;
                pointer-events: none;
                white-space: nowrap;
            `;

      document.body.appendChild(tooltip);

      const rect = this.getBoundingClientRect();
      tooltip.style.left =
        rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px";
      tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + "px";
    });

    element.addEventListener("mouseleave", function () {
      const tooltip = document.querySelector(".tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    });
  });
}

// Initialize tooltips when DOM is ready
initializeTooltips();
