console.log("Dynamic Risk Index JS loaded");

document.addEventListener("DOMContentLoaded", loadRiskIndex);

function loadRiskIndex() {

  fetch("/api/risk/index")
    .then(res => res.json())
    .then(data => {

      if (data.error) {
        console.error(data.error);
        return;
      }

      renderGauge(data.current_score);
      renderTrend(data);
      renderCityComparison(data);

    })
    .catch(err => console.error("Risk Index API failed:", err));
}

/* ===============================
   GAUGE CHART (Half Doughnut)
=============================== */
function renderGauge(score) {

  new Chart(document.getElementById("gaugeChart"), {
    type: "doughnut",
    data: {
      labels: ["Risk", "Remaining"],
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: ["#ef4444", "#1f2937"],
        borderWidth: 0
      }]
    },
    options: {
      circumference: 180,
      rotation: 270,
      cutout: "70%",
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false }
      }
    }
  });
}

/* ===============================
   RISK TREND LINE
=============================== */
function renderTrend(data) {

  new Chart(document.getElementById("riskTrend"), {
    type: "line",
    data: {
      labels: data.years,
      datasets: [{
        label: "Risk Score",
        data: data.risk_trend,
        borderColor: "#ec4899",
        backgroundColor: "rgba(236,72,153,0.2)",
        tension: 0.4,
        fill: true
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
   CITY COMPARISON BAR
=============================== */
function renderCityComparison(data) {

  new Chart(document.getElementById("cityComparison"), {
    type: "bar",
    data: {
      labels: data.cities,
      datasets: [{
        label: "City Risk Score",
        data: data.city_scores,
        backgroundColor: "#22d3ee"
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
