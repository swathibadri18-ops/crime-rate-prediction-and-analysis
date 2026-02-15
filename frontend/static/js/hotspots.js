// hotspots.js
console.log("Hotspots module loaded");

// Highlight active module in navbar (optional UX polish)
document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".modules button");
  navItems.forEach(btn => {
    if (btn.innerText.toLowerCase().includes("hotspot")) {
      btn.classList.add("active");
    }
  });
});

// Navigation helpers (explicit, readable)
function goToGeographic() {
  window.location.href = "/hotspots/geographic";
}

function goToTemporal() {
  window.location.href = "/hotspots/temporal";
}
<script src="/static/js/hotspots.js"></script>
