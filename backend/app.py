import os
import pandas as pd
import joblib
from flask import Flask, render_template, jsonify
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import roc_curve, auc
from sklearn.linear_model import LogisticRegression


# ==================================================
# PATH CONFIGURATION
# ==================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")
CRIME_DATA = os.path.join(DATA_DIR, "crime_dataset_india.csv")

# Model directory (relative path for deployment)
MODEL_DIR = os.path.join(BASE_DIR, "models")
FORECAST_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "final_crime_case_prediction_model.joblib"
)

# ==================================================
# LOAD MODEL ONCE
# ==================================================
try:
    forecast_model = joblib.load(FORECAST_MODEL_PATH)
    print("✅ Forecast model loaded successfully")
except Exception as e:
    forecast_model = None
    print("❌ Forecast model load failed:", e)

# ==================================================
# FLASK APP CONFIG
# ==================================================
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "..", "frontend", "templates"),
    static_folder=os.path.join(BASE_DIR, "..", "frontend", "static"),
    static_url_path="/static"
)

# ==================================================
# AUTH / HOME
# ==================================================
@app.route("/")
def login_page():
    return render_template("login.html")

@app.route("/home")
def home_page():
    return render_template("home.html")

# ==================================================
# DASHBOARD API
# ==================================================
@app.route("/api/dashboard")
def dashboard_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()

        total_records = len(df)
        top_cities = df["City"].value_counts().head(5)

        df["Date Reported"] = pd.to_datetime(df["Date Reported"], errors="coerce")
        df["Year"] = df["Date Reported"].dt.year
        year_trend = df["Year"].value_counts().sort_index()

        return jsonify({
            "total_records": total_records,
            "top_cities": {
                "labels": top_cities.index.tolist(),
                "values": top_cities.values.tolist()
            },
            "year_trend": {
                "labels": year_trend.index.astype(str).tolist(),
                "values": year_trend.values.tolist()
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ==================================================
# MAP API — CRIME DISTRIBUTION (HOMEPAGE MAP)
# ==================================================
@app.route("/api/map/crimes")
def crime_map_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()

        # City-level aggregation
        city_counts = (
            df.groupby("City")
              .size()
              .reset_index(name="count")
        )

        # Hardcoded city coordinates (stable & acceptable)
        city_coords = {
            "Delhi": [28.6139, 77.2090],
            "Mumbai": [19.0760, 72.8777],
            "Bangalore": [12.9716, 77.5946],
            "Chennai": [13.0827, 80.2707],
            "Hyderabad": [17.3850, 78.4867],
            "Kolkata": [22.5726, 88.3639]
        }

        data = []
        for _, row in city_counts.iterrows():
            city = row["City"]
            if city in city_coords:
                data.append({
                    "city": city,
                    "lat": city_coords[city][0],
                    "lng": city_coords[city][1],
                    "count": int(row["count"])
                })

        return jsonify(data)

    except Exception as e:
        print("Map API Error:", e)
        return jsonify({"error": str(e)}), 500


# ==================================================
# MODULE 1 — CRIME HOTSPOTS
# ==================================================
@app.route("/hotspots")
def hotspots_page():
    return render_template("hotspots.html")

@app.route("/hotspots/geographic")
def geo_page():
    return render_template("geo.html")

@app.route("/hotspots/temporal")
def temporal_page():
    return render_template("temporal.html")

@app.route("/api/hotspots/geographic")
def hotspots_geographic_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()
        df = df.dropna(subset=["City", "Crime Domain"])

        city_counts = df["City"].value_counts()
        top_cities = city_counts.head(5)
        other_count = city_counts.iloc[5:].sum()

        concentration = {
            "labels": top_cities.index.tolist() + ["Other Cities"],
            "values": top_cities.values.tolist() + [int(other_count)]
        }

        domain_pivot = (
            df.pivot_table(
                index="City",
                columns="Crime Domain",
                values="Report Number",
                aggfunc="count",
                fill_value=0
            ).loc[top_cities.index]
        )

        domain_data = {
            city: domain_pivot.loc[city].to_dict()
            for city in domain_pivot.index
        }

        return jsonify({
            "cities": top_cities.index.tolist(),
            "counts": top_cities.values.tolist(),
            "concentration": concentration,
            "domain": domain_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/hotspots/temporal")
def hotspots_temporal_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()

        df["Date Reported"] = pd.to_datetime(df["Date Reported"], errors="coerce")
        df["Year"] = df["Date Reported"].dt.year
        df["Month"] = df["Date Reported"].dt.month
        df["Day"] = df["Date Reported"].dt.day_name()

        return jsonify({
            "year": df["Year"].value_counts().sort_index().to_dict(),
            "month": df["Month"].value_counts().sort_index().to_dict(),
            "day": df["Day"].value_counts().to_dict()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================================================
# MODULE 2 — PREDICTIVE POLICING
# ==================================================
@app.route("/predictive")
def predictive_page():
    return render_template("predictive.html")

@app.route("/predictive/forecast")
def predictive_forecast_page():
    return render_template("forecast.html")

@app.route("/predictive/anomalies")
def predictive_anomaly_page():
    return render_template("anomaly.html")

# ==================================================
# PREDICTIVE APIs
# ==================================================
@app.route("/api/predictive/forecast")
def predictive_forecast_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()

        # ---- Date cleanup ----
        df["Date Reported"] = pd.to_datetime(
            df["Date Reported"], errors="coerce"
        )
        df = df.dropna(subset=["Date Reported"])

        if df.empty:
            return jsonify({"error": "No valid date records found"}), 400

        # ---- Time features ----
        df["year"] = df["Date Reported"].dt.year
        df["month"] = df["Date Reported"].dt.month

        yearly = (
            df.groupby("year")
              .size()
              .reset_index(name="count")
              .sort_values("year")
        )

        monthly = (
            df.groupby("month")
              .size()
              .reset_index(name="count")
              .sort_values("month")
        )

        if yearly.empty:
            return jsonify({"error": "Yearly aggregation failed"}), 400

        # ---- Safe growth calculation ----
        avg_growth = yearly["count"].pct_change().mean()
        avg_growth = 0 if pd.isna(avg_growth) else avg_growth

        last_year = int(yearly["year"].iloc[-1])
        last_value = int(yearly["count"].iloc[-1])

        future_years = [last_year + 1, last_year + 2]
        future_values = []

        for _ in future_years:
            last_value = int(last_value * (1 + avg_growth))
            future_values.append(last_value)

        # ---- Risk distribution ----
        mean_val = yearly["count"].mean()
        high = int(sum(v > mean_val for v in future_values))
        medium = int(len(future_values) - high)
        low = 0

        return jsonify({
            "years": yearly["year"].astype(int).tolist() + future_years,
            "year_values": yearly["count"].astype(int).tolist() + future_values,
            "months": monthly["month"].astype(int).tolist(),
            "month_values": monthly["count"].astype(int).tolist(),
            "risk_values": [high, medium, low]
        })

    except Exception as e:
        print("❌ Forecast API Error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/predictive/anomalies")
def predictive_anomaly_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df["Date Reported"] = pd.to_datetime(df["Date Reported"], errors="coerce")
        df = df.dropna(subset=["Date Reported"])

        df["Year"] = df["Date Reported"].dt.year
        yearly = df.groupby("Year").size().reset_index(name="count")

        mean = yearly["count"].mean()
        std = yearly["count"].std() or 1

        yearly["z_score"] = (yearly["count"] - mean) / std
        anomalies = yearly[yearly["z_score"].abs() > 1.5]

        city_counts = df.groupby("City").size().sort_values(ascending=False).head(6)

        return jsonify({
            "timeline": yearly["Year"].tolist(),
            "scores": yearly["z_score"].round(2).tolist(),
            "cities": city_counts.index.tolist(),
            "city_counts": city_counts.tolist(),
            "ratio": [len(anomalies), len(yearly) - len(anomalies)]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================================================
# MODULE 3 — SOCIO-ECONOMIC FACTORS API
# ==================================================
@app.route("/criminogenic")
def criminogenic_page():
    return render_template("criminogenic.html")
@app.route("/criminogenic/socio")
def criminogenic_socio_page():
    return render_template("socio.html")
@app.route("/criminogenic/environment")
def criminogenic_environment_page():
    return render_template("environment.html")

@app.route("/api/criminogenic/socio")
def socio_api():
    df = pd.read_csv(CRIME_DATA)
    df.columns = df.columns.str.strip()

    # Victim Age
    ages = df["Victim Age"].dropna().astype(int).tolist()

    # Correlation matrix
    corr_df = df[["Victim Age", "Police Deployed"]].dropna()
    corr = corr_df.corr().round(2).values.tolist()

    # Radar values (normalized)
    radar = {
        "labels": ["Age Vulnerability", "Police Presence", "Crime Pressure"],
        "values": [
            float(df["Victim Age"].mean() / 80),
            float(df["Police Deployed"].mean() / 20),
            1.0
        ]
    }

    return jsonify({
        "ages": ages,
        "corr": corr,
        "radar": radar
    })
@app.route("/api/criminogenic/environment")
def environment_api():
    df = pd.read_csv(CRIME_DATA)
    df.columns = df.columns.str.strip()

    df["Date Reported"] = pd.to_datetime(df["Date Reported"], errors="coerce")

    df["hour"] = (
        pd.to_numeric(df["Time of Occurrence"].str[:2], errors="coerce")
        .fillna(0)
        .astype(int)
    )

    df["weekday"] = df["Date Reported"].dt.dayofweek

    # Time heatmap
    heat = pd.crosstab(
      df["weekday"],
      df["hour"]
    ).reindex(index=range(7), fill_value=0)


    # Stacked bar (Gender × Crime)
    df["Victim Gender"] = (
    df["Victim Gender"]
    .astype(str)
    .str.strip()
    .str.upper()
    )

    df["Victim Gender"] = df["Victim Gender"].map({
    "M": "Male",
    "F": "Female",
    "X": "Other"
    }).fillna("Other")

    stacked = pd.crosstab(df["Crime Domain"], df["Victim Gender"])

    male = stacked.get("Male", pd.Series()).fillna(0).astype(int)
    female = stacked.get("Female", pd.Series()).fillna(0).astype(int)
    other = stacked.get("Other", pd.Series()).fillna(0).astype(int)



    return jsonify({
        "heat": heat.values.tolist(),
        "hours": heat.columns.astype(int).tolist(),
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "domains": stacked.index.tolist(),
        "male": male.tolist(),
        "female": female.tolist(),
        "other" : other.tolist(),
     })
@app.route("/api/criminogenic/map")
def criminogenic_map():
    df = pd.read_csv(CRIME_DATA)
    df.columns = df.columns.str.strip()

    coords = {
        "Delhi": [28.61, 77.20],
        "Mumbai": [19.07, 72.87],
        "Bangalore": [12.97, 77.59],
        "Chennai": [13.08, 80.27],
        "Hyderabad": [17.38, 78.48],
        "Kolkata": [22.57, 88.36]
    }

    out = []
    for city, cnt in df.groupby("City").size().items():
        if city in coords:
            out.append({
                "city": city,
                "lat": coords[city][0],
                "lng": coords[city][1],
                "count": int(cnt)
            })

    return jsonify(out)
# ==================================================
# MODULE 4 — ML CLASSIFICATION PAGES
# ==================================================

@app.route("/classification")
def classification_main_page():
    return render_template("classification.html")

@app.route("/classification/category")
def classification_category_page():
    return render_template("classification_category.html")

@app.route("/classification/location")
def classification_location_page():
    return render_template("classification_location.html")


# ==================================================
# MODULE 4.1 — CRIME CATEGORY CLASSIFICATION
# ==================================================

@app.route("/api/classification/category")
def classification_category_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()

        # Clean & Prepare Data
        df["Date Reported"] = pd.to_datetime(df["Date Reported"], errors="coerce")
        df = df.dropna(subset=["Crime Domain", "Date Reported"])

        df["Month"] = df["Date Reported"].dt.month
        df["Hour"] = pd.to_numeric(
            df["Time of Occurrence"].astype(str).str[:2],
            errors="coerce"
        ).fillna(0)

        features = [
            "City",
            "Victim Age",
            "Victim Gender",
            "Police Deployed",
            "Month",
            "Hour"
        ]

        df = df.dropna(subset=features)

        X = df[features].copy()
        y = df["Crime Domain"]

        # Encoding
        le_city = LabelEncoder()
        le_gender = LabelEncoder()
        le_target = LabelEncoder()

        X["City"] = le_city.fit_transform(X["City"])
        X["Victim Gender"] = le_gender.fit_transform(X["Victim Gender"])
        y_encoded = le_target.fit_transform(y)

        # Train Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded,
            test_size=0.3,
            random_state=42
        )

        # Model
        model = RandomForestClassifier(
            n_estimators=150,
            random_state=42
        )
        model.fit(X_train, y_train)

        # Predictions
        y_pred = model.predict(X_test)
        probs = model.predict_proba(X_test)
        cm = confusion_matrix(y_test, y_pred)

        return jsonify({
            "labels": le_target.classes_.tolist(),
            "confusion_matrix": cm.tolist(),
            "probabilities": probs.mean(axis=0).round(3).tolist(),
            "feature_importance": model.feature_importances_.round(3).tolist(),
            "feature_names": features
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ==================================================
# MODULE 4.2 — LOCATION RISK CLASSIFICATION
# ==================================================

# ==================================================
# MODULE 4.2 — LOCATION-BASED CRIME PREDICTION
# ==================================================

@app.route("/api/classification/location")
def classification_location_api():
    try:
        # -----------------------------
        # Load Data
        # -----------------------------
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()

        df["Date Reported"] = pd.to_datetime(
            df["Date Reported"],
            errors="coerce"
        )

        df = df.dropna(subset=["City", "Date Reported"])

        df["Month"] = df["Date Reported"].dt.month

        # -----------------------------
        # Encode City
        # -----------------------------
        le_city = LabelEncoder()
        df["City_encoded"] = le_city.fit_transform(df["City"])

        # -----------------------------
        # Define Risk Threshold
        # -----------------------------
        city_counts = df["City"].value_counts()
        threshold = city_counts.mean()

        df["High_Risk"] = df["City"].map(
            lambda x: 1 if city_counts[x] > threshold else 0
        )

        # -----------------------------
        # Feature Set
        # -----------------------------
        feature_cols = [
            "City_encoded",
            "Month",
            "Victim Age",
            "Police Deployed"
        ]

        X = df[feature_cols].fillna(0)
        y = df["High_Risk"]

        # -----------------------------
        # Train/Test Split
        # -----------------------------
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.3,
            random_state=42
        )

        # -----------------------------
        # Model Training
        # -----------------------------
        model = GradientBoostingClassifier(random_state=42)
        model.fit(X_train, y_train)

        # -----------------------------
        # Predict Risk for Each City
        # -----------------------------
        city_risk = {}

        for city in df["City"].unique():
            encoded = le_city.transform([city])[0]

            sample_df = pd.DataFrame([{
                "City_encoded": encoded,
                "Month": 6,
                "Victim Age": 30,
                "Police Deployed": 5
            }])

            prob = model.predict_proba(sample_df)[0][1]

            # Convert to native float
            city_risk[city] = float(round(prob * 100, 2))

        # -----------------------------
        # Sort Risk
        # -----------------------------
        sorted_risk = dict(
            sorted(city_risk.items(),
                   key=lambda x: x[1],
                   reverse=True)
        )

        top5 = list(sorted_risk.items())[:5]

        # -----------------------------
        # Risk Distribution
        # -----------------------------
        high = int(sum(v > 60 for v in city_risk.values()))
        medium = int(sum(30 <= v <= 60 for v in city_risk.values()))
        low = int(sum(v < 30 for v in city_risk.values()))

        # -----------------------------
        # Return JSON (SAFE)
        # -----------------------------
        return jsonify({
            "cities": list(city_risk.keys()),
            "risk_scores": list(city_risk.values()),
            "top5_labels": [str(x[0]) for x in top5],
            "top5_values": [float(x[1]) for x in top5],
            "distribution": [high, medium, low]
        })

    except Exception as e:
        print("Location Classification Error:", e)
        return jsonify({"error": str(e)}), 500
# ==================================================
# MODULE 5 — REAL-TIME CRIME RISK SCORING
# ==================================================

@app.route("/risk")
def risk_main_page():
    return render_template("risk.html")

@app.route("/risk/index")
def risk_index_page():
    return render_template("risk_index.html")

@app.route("/risk/alerts")
def risk_alert_page():
    return render_template("risk_alert.html")

@app.route("/api/risk/index")
def risk_index_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()

        df["Date Reported"] = pd.to_datetime(df["Date Reported"], errors="coerce")
        df = df.dropna(subset=["Date Reported", "City"])

        df["Year"] = df["Date Reported"].dt.year

        yearly_counts = df.groupby("Year").size().reset_index(name="count")

        # Risk Score scaled 0–100
        max_count = yearly_counts["count"].max()
        yearly_counts["risk_score"] = (
            yearly_counts["count"] / max_count * 100
        )

        current_score = float(round(yearly_counts["risk_score"].iloc[-1], 2))

        # City comparison
        city_counts = df["City"].value_counts().head(6)
        city_risk = (
            city_counts / city_counts.max() * 100
        ).round(2)

        return jsonify({
            "current_score": current_score,
            "years": yearly_counts["Year"].astype(str).tolist(),
            "risk_trend": yearly_counts["risk_score"].round(2).tolist(),
            "cities": city_risk.index.tolist(),
            "city_scores": city_risk.tolist()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/api/risk/alerts")
def risk_alert_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()

        df["Date Reported"] = pd.to_datetime(df["Date Reported"], errors="coerce")
        df = df.dropna(subset=["Date Reported"])

        df["Year"] = df["Date Reported"].dt.year

        yearly = df.groupby("Year").size().reset_index(name="count")

        threshold = yearly["count"].mean()

        yearly["High_Risk"] = (yearly["count"] > threshold).astype(int)

        X = yearly[["Year"]]
        y = yearly["High_Risk"]

        model = LogisticRegression()
        model.fit(X, y)

        y_prob = model.predict_proba(X)[:, 1]

        fpr, tpr, _ = roc_curve(y, y_prob)
        roc_auc = float(auc(fpr, tpr))

        high = int(sum(yearly["High_Risk"]))
        low = int(len(yearly) - high)

        return jsonify({
            "fpr": fpr.tolist(),
            "tpr": tpr.tolist(),
            "roc_auc": roc_auc,
            "distribution": [high, low]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ==================================================
# MODULE 6 — CRIME RECURRENCE & PERSISTENCE
# ==================================================

@app.route("/recurrence")
def recurrence_main_page():
    return render_template("recurrence.html")

@app.route("/recurrence/prediction")
def recurrence_prediction_page():
    return render_template("recurrence_prediction.html")

@app.route("/recurrence/persistence")
def recurrence_persistence_page():
    return render_template("recurrence_persistence.html")
@app.route("/api/recurrence/prediction")
def recurrence_prediction_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()

        df["Date Reported"] = pd.to_datetime(
            df["Date Reported"],
            errors="coerce"
        )

        df = df.dropna(subset=["Date Reported", "City"])
        df = df.sort_values("Date Reported")

        # Time difference in days
        df["Days_Since_Last"] = (
            df["Date Reported"].diff().dt.days.fillna(0)
        )

        # Survival probability (inverse scale)
        survival_days = list(range(1, 31))
        survival_prob = [
            float(round(max(0, 1 - (d / 30)), 2))
            for d in survival_days
        ]

        # Recurrence probability curve
        recurrence_prob = [
            float(round(min(1, d / 30), 2))
            for d in survival_days
        ]

        # City recurrence risk
        city_counts = df["City"].value_counts().head(6)
        city_risk = (
            city_counts / city_counts.max() * 100
        ).round(2)

        return jsonify({
            "days": survival_days,
            "survival": survival_prob,
            "recurrence": recurrence_prob,
            "cities": city_risk.index.tolist(),
            "city_scores": city_risk.tolist()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/api/recurrence/persistence")
def recurrence_persistence_api():
    try:
        df = pd.read_csv(CRIME_DATA)
        df.columns = df.columns.str.strip()

        df["Date Reported"] = pd.to_datetime(
            df["Date Reported"],
            errors="coerce"
        )

        df = df.dropna(subset=["Date Reported", "City"])

        df["Year"] = df["Date Reported"].dt.year

        yearly_city = (
            df.groupby(["Year", "City"])
            .size()
            .reset_index(name="count")
        )

        # Stability trend (total yearly crimes)
        yearly_total = (
            df.groupby("Year")
            .size()
            .reset_index(name="count")
        )

        # Persistence distribution
        high = int(sum(yearly_total["count"] > yearly_total["count"].mean()))
        low = int(len(yearly_total) - high)

        return jsonify({
            "years": yearly_total["Year"].astype(str).tolist(),
            "trend": yearly_total["count"].tolist(),
            "distribution": [high, low]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================================================
# MISC
# ==================================================
@app.route("/favicon.ico")
def favicon():
    return app.send_static_file("favicon.ico")


# ==================================================
# RUN SERVER
# ==================================================

if __name__ == "__main__":
    app.run()
