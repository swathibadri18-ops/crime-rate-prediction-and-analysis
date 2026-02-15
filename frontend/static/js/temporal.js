console.log("Temporal Trends JS loaded");

document.addEventListener("DOMContentLoaded", () => {

  fetch("/api/hotspots/temporal")
    .then(res => {
      if (!res.ok) {
        throw new Error("Temporal API not reachable");
      }
      return res.json();
    })
    .then(data => {
      if (data.year) renderYearChart(data.year);
      if (data.month) renderMonthChart(data.month);
      if (data.day) renderDayChart(data.day);
    })
    .catch(err => {
      console.error("Temporal API error:", err);
    });

});


/* ===============================
   YEARLY TREND
=============================== */
function renderYearChart(yearData) {

  const canvas = document.getElementById("yearChart");
  if (!canvas) return;

  new Chart(canvas, {
    type: "line",
    data: {
      labels: Object.keys(yearData),
      datasets: [{
        label: "Crimes per Year",
        data: Object.values(yearData),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.15)",
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
   MONTHLY TREND
=============================== */
function renderMonthChart(monthData) {

  const canvas = document.getElementById("monthChart");
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: Object.keys(monthData),
      datasets: [{
        label: "Monthly Crimes",
        data: Object.values(monthData),
        backgroundColor: "#22c55e"
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
   DAY-WISE DISTRIBUTION
=============================== */
function renderDayChart(dayData) {

  const canvas = document.getElementById("dayChart");
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: Object.keys(dayData),
      datasets: [{
        label: "Crimes by Day",
        data: Object.values(dayData),
        backgroundColor: "#f59e0b"
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
