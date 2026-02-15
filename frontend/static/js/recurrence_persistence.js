console.log("Recurrence Persistence JS loaded");

document.addEventListener("DOMContentLoaded", loadPersistence);

function loadPersistence() {

  fetch("/api/recurrence/persistence")
    .then(res => res.json())
    .then(data => {

      renderTrend(data);
      renderDistribution(data);

    })
    .catch(err => console.error(err));
}

function renderTrend(data) {
  new Chart(document.getElementById("persistenceTrend"), {
    type: "line",
    data: {
      labels: data.years,
      datasets: [{
        label: "Crime Trend",
        data: data.trend,
        borderColor: "#22d3ee",
        fill: true
      }]
    }
  });
}

function renderDistribution(data) {
  new Chart(document.getElementById("persistenceDonut"), {
    type: "doughnut",
    data: {
      labels: ["Persistent High Crime", "Stable Periods"],
      datasets: [{
        data: data.distribution,
        backgroundColor: ["#ef4444", "#22c55e"]
      }]
    }
  });
}
