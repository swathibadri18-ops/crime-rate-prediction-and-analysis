console.log("Crime Category Prediction JS loaded");

document.addEventListener("DOMContentLoaded", loadCategoryPrediction);

function loadCategoryPrediction() {

  fetch("/api/classification/category")
    .then(res => res.json())
    .then(data => {

      if (data.error) {
        console.error(data.error);
        return;
      }

      renderConfusionMatrix(data);
      renderProbabilities(data);
      renderFeatureImportance(data);

    })
    .catch(err => {
      console.error("Category API failed:", err);
    });
}

/* ===============================
   CONFUSION MATRIX
=============================== */
function renderConfusionMatrix(data) {

  const ctx = document.getElementById("confusion");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: data.confusion_matrix.map((row, index) => ({
        label: data.labels[index],
        data: row,
        backgroundColor: `hsl(${index * 60}, 70%, 55%)`
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

/* ===============================
   PROBABILITY BAR
=============================== */
function renderProbabilities(data) {

  const ctx = document.getElementById("prob");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [{
        label: "Prediction Probability",
        data: data.probabilities,
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
   FEATURE IMPORTANCE
=============================== */
function renderFeatureImportance(data) {

  const ctx = document.getElementById("importance");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.feature_names,
      datasets: [{
        label: "Importance Score",
        data: data.feature_importance,
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
