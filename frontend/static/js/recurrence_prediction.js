console.log("Recurrence Prediction JS loaded");

document.addEventListener("DOMContentLoaded", loadRecurrence);

function loadRecurrence() {

  fetch("/api/recurrence/prediction")
    .then(res => res.json())
    .then(data => {

      renderSurvival(data);
      renderRecurrence(data);
      renderCityRisk(data);

    })
    .catch(err => console.error(err));
}

function renderSurvival(data) {
  new Chart(document.getElementById("survivalChart"), {
    type: "line",
    data: {
      labels: data.days,
      datasets: [{
        label: "Survival Probability",
        data: data.survival,
        borderColor: "#22c55e",
        fill: true
      }]
    }
  });
}

function renderRecurrence(data) {
  new Chart(document.getElementById("recurrenceChart"), {
    type: "line",
    data: {
      labels: data.days,
      datasets: [{
        label: "Recurrence Probability",
        data: data.recurrence,
        borderColor: "#ef4444",
        fill: true
      }]
    }
  });
}

function renderCityRisk(data) {
  new Chart(document.getElementById("cityRecurrence"), {
    type: "bar",
    data: {
      labels: data.cities,
      datasets: [{
        label: "Recurrence Risk (%)",
        data: data.city_scores,
        backgroundColor: "#ec4899"
      }]
    }
  });
}
