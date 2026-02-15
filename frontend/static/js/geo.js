console.log("geo.js loaded");

document.addEventListener("DOMContentLoaded", () => {

  fetch("/api/hotspots/geographic")
    .then(res => {
      if (!res.ok) {
        throw new Error("Hotspots API not reachable");
      }
      return res.json();
    })
    .then(data => {
      console.log("Geographic hotspot data:", data);

      /* ===============================
         1️⃣ CITY-WISE HOTSPOTS
      =============================== */
      const cityCanvas = document.getElementById("cityChart");
      if (cityCanvas) {
        new Chart(cityCanvas, {
          type: "bar",
          data: {
            labels: data.cities,
            datasets: [{
              label: "Crime Count",
              data: data.counts,
              backgroundColor: "#ec4899"
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            }
          }
        });
      }

      /* ===============================
         2️⃣ HOTSPOT CONCENTRATION INSIGHT
      =============================== */
      const concentrationCanvas =
        document.getElementById("concentrationChart");

      if (data.concentration && concentrationCanvas) {
        new Chart(concentrationCanvas, {
          type: "doughnut",
          data: {
            labels: data.concentration.labels,
            datasets: [{
              data: data.concentration.values,
              backgroundColor: [
                "#ef4444",
                "#f59e0b",
                "#6366f1",
                "#1f2937"
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: { color: "#e6eef8" }
              }
            }
          }
        });
      }

      /* ===============================
         3️⃣ CRIME DOMAIN DISTRIBUTION
      =============================== */
      const domainCanvas = document.getElementById("domainChart");

      if (
        domainCanvas &&
        data.domain &&
        data.cities &&
        data.cities.length > 0 &&
        data.domain[data.cities[0]]
      ) {
        const domains = Object.keys(data.domain[data.cities[0]]);

        const datasets = domains.map((domain, index) => ({
          label: domain,
          data: data.cities.map(
            city => data.domain[city]?.[domain] || 0
          ),
          backgroundColor: `hsl(${index * 60}, 70%, 60%)`
        }));

        new Chart(domainCanvas, {
          type: "bar",
          data: {
            labels: data.cities,
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true },
              y: { stacked: true }
            },
            plugins: {
              legend: { position: "bottom" }
            }
          }
        });
      }

    })
    .catch(err => {
      console.error("Failed to load geographic hotspot data:", err);
    });

});
