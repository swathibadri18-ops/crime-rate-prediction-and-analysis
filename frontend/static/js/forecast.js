console.log("forecast.js loaded");

document.addEventListener("DOMContentLoaded", loadForecast);

function loadForecast() {

  fetch("/api/predictive/forecast")
    .then(res => {
      if (!res.ok) throw new Error("Forecast API not reachable");
      return res.json();
    })
    .then(data => {
      renderYearForecast(data);
      renderMonthForecast(data);
      renderRiskForecast(data);
    })
    .catch(err => {
      console.error("Forecast load failed:", err);
    });
}

/* ===============================
   YEAR-WISE FORECAST
=============================== */
function renderYearForecast(data) {

  const canvas = document.getElementById("forecastYear");
  if (!canvas) return;

  new Chart(canvas, {
    type: "line",
    data: {
      labels: data.years,
      datasets: [{
        label: "Predicted Crime Count",
        data: data.year_values,
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34,211,238,0.25)",
        tension: 0.4,
        fill: true
      }]
    },
    options: baseOptions()
  });
}

/* ===============================
   MONTHLY FORECAST
=============================== */
function renderMonthForecast(data) {

  const canvas = document.getElementById("forecastMonth");
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.months,
      datasets: [{
        label: "Monthly Prediction",
        data: data.month_values,
        backgroundColor: "#ec4899"
      }]
    },
    options: baseOptions()
  });
}

/* ===============================
   RISK DISTRIBUTION
=============================== */
function renderRiskForecast(data) {

  const canvas = document.getElementById("forecastRisk");
  if (!canvas) return;

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["High Risk", "Medium Risk", "Low Risk"],
      datasets: [{
        data: data.risk_values,
        backgroundColor: ["#ef4444", "#f59e0b", "#22c55e"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

/* ===============================
   COMMON OPTIONS
=============================== */
function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };
}
