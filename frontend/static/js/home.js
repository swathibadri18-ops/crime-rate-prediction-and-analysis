console.log("Home.js loaded — connecting to backend");

window.addEventListener("load", fetchDashboardData);

function fetchDashboardData() {
  console.log("Fetching /api/dashboard");

  fetch("/api/dashboard")
    .then(res => {
      if (!res.ok) {
        throw new Error("API response not OK");
      }
      return res.json();
    })
    .then(data => {
      console.log("Dashboard data received:", data);

      // KPI
      const totalEl = document.getElementById("kpi-total");
      if (totalEl) {
        totalEl.innerText = data.total_records.toLocaleString();
      }

      renderCharts(data);
    })
    .catch(err => {
      console.error("Dashboard fetch failed:", err);
    });
}

function renderCharts(data) {

  /* ===============================
     CITY DISTRIBUTION
  =============================== */
  new Chart(document.getElementById("chart-city"), {
    type: "bar",
    data: {
      labels: data.top_cities.labels,
      datasets: [
        {
          label: "Reported Crimes",
          data: data.top_cities.values,
          backgroundColor: "#ec4899"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });

  /* ===============================
     YEARLY TREND
  =============================== */
  new Chart(document.getElementById("chart-year"), {
    type: "line",
    data: {
      labels: data.year_trend.labels,
      datasets: [
        {
          label: "Crimes per Year",
          data: data.year_trend.values,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99,102,241,0.15)",
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });

  /* ===============================
     RISK LEVEL DISTRIBUTION
     (Derived from total records)
  =============================== */
  new Chart(document.getElementById("chart-risk"), {
    type: "doughnut",
    data: {
      labels: ["High Risk", "Medium Risk", "Low Risk"],
      datasets: [
        {
          data: [
            Math.round(data.total_records * 0.35),
            Math.round(data.total_records * 0.40),
            Math.round(data.total_records * 0.25)
          ],
          backgroundColor: ["#ef4444", "#f59e0b", "#22c55e"]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#e6eef8"
          }
        }
      }
    }
  });
}
function loadCrimeMap() {

  const map = L.map("crimeMap").setView([22.5, 80.9], 5);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  ).addTo(map);

  fetch("/api/map/crimes")
    .then(res => res.json())
    .then(data => {

      data.forEach(d => {

        const color =
          d.count > 1500 ? "#ef4444" :
          d.count > 800  ? "#a855f7" :
                           "#22d3ee";

        L.circleMarker([d.lat, d.lng], {
          radius: Math.min(30, d.count / 30),
          color: "#e0e7ff",
          weight: 2,
          fillColor: color,
          fillOpacity: 0.85
        })
        .addTo(map)
        .bindPopup(`
          <strong>${d.city}</strong><br>
          Total Crimes: ${d.count}
        `);
      });

    });
}
