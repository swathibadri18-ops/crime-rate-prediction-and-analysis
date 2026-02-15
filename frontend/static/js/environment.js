console.log("environment.js loaded");

/* ===============================
   LOAD ALL VISUALS
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  loadTimeHeatmap();
  loadGenderCrime();
  loadEnvironmentMap();
});

/* ===============================
   1️⃣ HIGH-RISK TIME WINDOWS
   (Stacked Bar = Heatmap Style)
=============================== */
function loadTimeHeatmap() {
  fetch("/api/criminogenic/environment")
    .then(res => res.json())
    .then(data => {

      const datasets = data.days.map((day, i) => ({
        label: day,
        data: data.heat[i],     // one row per weekday
        backgroundColor: `hsl(${i * 45}, 70%, 55%)`
      }));

      new Chart(document.getElementById("timeHeat"), {
        type: "bar",
        data: {
          labels: data.hours,   // 0–23
          datasets: datasets
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            tooltip: { mode: "index", intersect: false }
          },
          scales: {
            x: {
              stacked: true,
              title: { display: true, text: "Hour of Day" }
            },
            y: {
              stacked: true,
              title: { display: true, text: "Crime Count" }
            }
          }
        }
      });
    })
    .catch(err => console.error("Time heatmap error:", err));
}

/* ===============================
   2️⃣ GENDER × CRIME TYPE
   (STACKED BAR)
=============================== */
function loadGenderCrime() {
  fetch("/api/criminogenic/environment")
    .then(res => res.json())
    .then(data => {

      new Chart(document.getElementById("stackedBar"), {
        type: "bar",
        data: {
          labels: data.domains,
          datasets: [
            {
              label: "Male",
              data: data.male,
              backgroundColor: "#6366f1"
            },
            {
              label: "Female",
              data: data.female,
              backgroundColor: "#ec4899"
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            tooltip: { mode: "index", intersect: false }
          },
          scales: {
            x: { stacked: true },
            y: {
              stacked: true,
              title: { display: true, text: "Number of Incidents" }
            }
          }
        }
      });
    })
    .catch(err => console.error("Gender crime chart error:", err));
}

/* ===============================
   3️⃣ SPATIAL ENVIRONMENTAL RISK
   (INTERACTIVE MAP)
=============================== */
function loadEnvironmentMap() {
  const map = L.map("crimeMap").setView([20.5937, 78.9629], 5);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { attribution: "&copy; OpenStreetMap & CARTO" }
  ).addTo(map);

  fetch("/api/criminogenic/map")
    .then(res => res.json())
    .then(data => {
      data.forEach(d => {
        L.circleMarker([d.lat, d.lng], {
          radius: Math.sqrt(d.count) / 6,
          fillColor: "#ef4444",
          fillOpacity: 0.5,
          color: "#ffffff",
          weight: 1
        })
        .bindPopup(
          `<strong>${d.city}</strong><br>
           Reported Crimes: ${d.count}`
        )
        .addTo(map);
      });
    })
    .catch(err => console.error("Environment map error:", err));
}
