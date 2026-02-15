console.log("socio.js loaded");

fetch("/api/criminogenic/socio")
  .then(res => {
    if (!res.ok) throw new Error("Socio API failed");
    return res.json();
  })
  .then(data => {

    /* =========================
       1️⃣ BOX PLOT — AGE
    ========================= */
    Plotly.newPlot("ageBox", [{
      y: data.ages,
      type: "box",
      marker: { color: "#6366f1" }
    }], {
      title: "Victim Age Distribution",
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: "#e6eef8" }
    });

    /* =========================
       2️⃣ CORRELATION HEATMAP
    ========================= */
    Plotly.newPlot("corrHeatmap", [{
      z: data.corr,
      type: "heatmap",
      colorscale: "Viridis"
    }], {
      title: "Correlation: Age vs Police Deployed",
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: "#e6eef8" }
    });

    /* =========================
       3️⃣ RADAR CHART
    ========================= */
    const ctx = document.getElementById("radarChart");
    if (!ctx) return;

    new Chart(ctx, {
      type: "radar",
      data: {
        labels: data.radar.labels,
        datasets: [{
          label: "Socio-economic Risk",
          data: data.radar.values,
          backgroundColor: "rgba(236,72,153,0.25)",
          borderColor: "#ec4899",
          pointBackgroundColor: "#ec4899"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 1,
            ticks: { display: false },
            grid: { color: "rgba(255,255,255,0.1)" },
            angleLines: { color: "rgba(255,255,255,0.1)" }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

  })
  .catch(err => {
    console.error("Socio-economic charts failed:", err);
  });
