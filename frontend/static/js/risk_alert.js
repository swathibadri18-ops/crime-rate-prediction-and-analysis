console.log("Risk Alert JS loaded");

document.addEventListener("DOMContentLoaded", loadRiskAlerts);

function loadRiskAlerts() {

  fetch("/api/risk/alerts")
    .then(res => res.json())
    .then(data => {

      if (data.error) {
        console.error(data.error);
        return;
      }

      renderROC(data);
      renderAlertDistribution(data);

    })
    .catch(err => console.error("Risk Alert API failed:", err));
}

/* ===============================
   ROC CURVE
=============================== */
function renderROC(data) {

  new Chart(document.getElementById("rocChart"), {
    type: "line",
    data: {
      labels: data.fpr,
      datasets: [{
        label: "ROC Curve (AUC: " + data.roc_auc.toFixed(2) + ")",
        data: data.tpr,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.2)",
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: "False Positive Rate" } },
        y: { title: { display: true, text: "True Positive Rate" } }
      }
    }
  });
}

/* ===============================
   ALERT DISTRIBUTION DONUT
=============================== */
function renderAlertDistribution(data) {

  new Chart(document.getElementById("alertDonut"), {
    type: "doughnut",
    data: {
      labels: ["High Risk", "Low Risk"],
      datasets: [{
        data: data.distribution,
        backgroundColor: ["#ef4444", "#22c55e"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
