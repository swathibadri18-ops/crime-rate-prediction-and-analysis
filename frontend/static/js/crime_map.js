console.log("Crime map JS loaded");

document.addEventListener("DOMContentLoaded", () => {

  // Initialize map centered on India
  const map = L.map("crimeMap", {
   zoomControl: true,
   attributionControl: false
}).setView([22.5937, 78.9629], 5);

// 🔥 Force Leaflet to recalculate size after render
setTimeout(() => {
  map.invalidateSize();
}, 300);


  // Dark theme tile layer (matches your UI)
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  // Fetch crime data from backend
  fetch("/api/map/crimes")
    .then(res => res.json())
    .then(data => {
      console.log("Map data:", data);

      data.forEach(item => {

        const radius = Math.sqrt(item.count) * 0.4;

        L.circleMarker([item.lat, item.lng], {
          radius: radius,
          fillColor: "#ec4899",
          color: "#ec4899",
          weight: 1,
          opacity: 0.9,
          fillOpacity: 0.45
        })
        .addTo(map)
        .bindPopup(`
          <strong>${item.city}</strong><br>
          Crimes Reported: ${item.count}
        `);
      });
    })
    .catch(err => {
      console.error("Map load failed:", err);
    });

});
