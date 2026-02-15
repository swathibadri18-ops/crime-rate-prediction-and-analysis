console.log("Location-Based Prediction JS loaded");

document.addEventListener("DOMContentLoaded", loadLocationPrediction);

function loadLocationPrediction() {

  fetch("/api/classification/location")
    .then(res => res.json())
    .then(data => {

      if (data.error) {
        console.error(data.error);
        return;
      }

      renderRiskScores(data);
      renderTopFive(data);
      renderDistribution(data);

    })
    .catch(err => {
      console.error("Location API failed:", err);
    });
}

/* ===============================
   RISK SCORE BY AREA
=============================== */
function renderRiskScores(data) {

  const ctx = document.getElementById("risk");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.cities,
      datasets: [{
        label: "Risk Score (%)",
        data: data.risk_scores,
        backgroundColor: "#ef4444"
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
   TOP 5 HIGH-RISK ZONES
=============================== */
function renderTopFive(data) {

  const ctx = document.getElementById("top5");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.top5_labels,
      datasets: [{
        label: "Top Risk Zones",
        data: data.top5_values,
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
   RISK DISTRIBUTION DONUT
=============================== */
function renderDistribution(data) {

  const ctx = document.getElementById("donut");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["High Risk", "Medium Risk", "Low Risk"],
      datasets: [{
        data: data.distribution,
        backgroundColor: ["#ef4444", "#f59e0b", "#22c55e"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
