# Backend Service: Enterprise Energy Anomaly Detection System (EEADS)

## 1. System Architecture Overview

The EEADS backend service operates as the core computational and data coordination engine, comprising four primary architectural modules:

1. **Streaming Consumer Module (`app/kafka_consumer.py`)**: Continuously consumes real-time telemetry payloads containing building energy readings and local meteorological features from the Apache Kafka broker on topic `energy_stream`.
2. **AI Inference and Explainable AI Engine (`app/ai_core.py`)**: Executes inference using the pre-trained, Optuna-tuned XGBoost model to generate baseline load expectations. Concurrently, it computes dynamic anomaly thresholds via a hybrid algorithm combining statistical Interquartile Range (IQR) analysis and unsupervised K-Means clustering. When an anomaly is detected, the engine performs relative feature attribution to isolate primary root causes.
3. **Data Persistence Module (`app/database.py`)**: Leverages SQLAlchemy ORM connected to PostgreSQL to record operational histories, microclimate observations, model predictions, dynamic decision thresholds, and XAI diagnosis payloads.
4. **RESTful API Service (`app/main.py`)**: High-performance HTTP service built on FastAPI delivering real-time telemetry, historical aggregates, time-series correlations, and incident logs to the Single Page Application (SPA) dashboard.

## 2. Environment and Dependency Management via UV

The backend environment is standardized using **UV**, a high-performance Python package and project manager that provides deterministic resolution and accelerated environment synchronization.

### 2.1. Environment Synchronization
From within the `backend/` directory, initialize and synchronize dependencies:
```bash
uv sync
```
This command inspects `pyproject.toml`, ensures cross-package compatibility, and builds the isolated virtual environment at `.venv/`.

### 2.2. Executing the Backend Service
Launch the Uvicorn ASGI server through `uv run`:
```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 3. REST API Specifications

- `GET /api/buildings`: Retrieves the unique identifiers of all monitored buildings within the system.
- `GET /api/data?building_name={name}&limit={limit}`: Queries the latest time series of actual load, predicted expectation, safety bounds, and anomaly classifications.
- `GET /api/stats/summary?building_name={name}`: Computes 24-hour summary statistics including aggregate energy consumption (sum), peak load (max), and base load (min).
- `GET /api/weather/correlation?building_name={name}&limit={limit}`: Returns multi-variate environmental series (ambient temperature, dew point, wind velocity, atmospheric pressure) correlated with electrical demand.
- `GET /api/explain?building_name={name}`: Delivers the latest Explainable AI (XAI) feature attribution breakdown for an identified anomaly.
- `GET /api/alerts/global`: Aggregates the 10 most recent anomaly events detected across the entire building portfolio.
- `GET /api/alerts/history?building_name={name}`: Returns the historical incident log for a designated building, enabling detailed state snapshot inspections.
- `GET /api/analytics/hourly_profile?building_name={name}`: Derives 24-hour baseline consumption profiles averaged over historical operational data.
