console.log("anomaly.js loaded");

document.addEventListener("DOMContentLoaded", loadAnomalies);

function loadAnomalies() {

  fetch("/api/predictive/anomalies")
    .then(res => {
      if (!res.ok) throw new Error("Anomaly API not reachable");
      return res.json();
    })
    .then(data => {
      renderTrend(data);
      renderCity(data);
      renderRatio(data);
    })
    .catch(err => {
      console.error("Anomaly load failed:", err);
    });
}

/* ===============================
   ANOMALY TREND
=============================== */
function renderTrend(data) {

  const canvas = document.getElementById("anomalyTrend");
  if (!canvas) return;

  new Chart(canvas, {
    type: "line",
    data: {
      labels: data.timeline,
      datasets: [{
        label: "Anomaly Score",
        data: data.scores,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.25)",
        tension: 0.4,
        fill: true
      }]
    },
    options: baseOptions()
  });
}

/* ===============================
   CITY ANOMALIES
=============================== */
function renderCity(data) {

  const canvas = document.getElementById("anomalyCity");
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.cities,
      datasets: [{
        label: "Anomaly Count",
        data: data.city_counts,
        backgroundColor: "#f59e0b"
      }]
    },
    options: baseOptions()
  });
}

/* ===============================
   RATIO
=============================== */
function renderRatio(data) {

  const canvas = document.getElementById("anomalyRatio");
  if (!canvas) return;

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Normal", "Anomalous"],
      datasets: [{
        data: data.ratio,
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };
}
