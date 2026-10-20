# Enterprise Energy Anomaly Detection and Forecasting System (EEADS)

Scientific Research Project - Thu Dau Mot University (TDMU).  
A real-time big data and machine learning framework combining Optuna-optimized XGBoost forecasting, a hybrid IQR and K-Means dynamic thresholding mechanism, and Explainable AI (XAI) feature attribution for smart building energy management.

---

## Table of Contents

1. [Abstract and Problem Statement](#1-abstract-and-problem-statement)
2. [System Architecture](#2-system-architecture)
3. [Scientific Methodology](#3-scientific-methodology)
   - 3.1. [Data Preprocessing and Feature Engineering](#31-data-preprocessing-and-feature-engineering)
   - 3.2. [Forecasting Engine: Bayesian-Optimized XGBoost](#32-forecasting-engine-bayesian-optimized-xgboost)
   - 3.3. [Proposed Hybrid Anomaly Detection Thresholding (IQR + K-Means)](#33-proposed-hybrid-anomaly-detection-thresholding-iqr--k-means)
   - 3.4. [Explainable AI (XAI) Framework](#34-explainable-ai-xai-framework)
4. [Benchmark Dataset Reference](#4-benchmark-dataset-reference)
5. [Empirical Evaluation and Comparative Benchmark](#5-empirical-evaluation-and-comparative-benchmark)
6. [Repository Structure](#6-repository-structure)
7. [Environment and Dependency Management with UV](#7-environment-and-dependency-management-with-uv)
8. [Installation and Deployment Guide](#8-installation-and-deployment-guide)
9. [Academic References](#9-academic-references)

---

## 1. Abstract and Problem Statement

In the operation of modern smart grids and Building Energy Management Systems (BEMS), unexpected electricity consumption deviations and load anomalies pose severe risks to grid stability, induce local transformer overloads, degrade power quality, and drive excessive operational expenditures.

Conventional anomaly detection paradigms predominantly depend on static rule-based thresholds, which exhibit elevated false-positive rates due to the strong diurnal, weekly, and seasonal non-stationarity inherent in building load profiles. Furthermore, contemporary black-box deep learning models frequently lack interpretability, preventing facility operators and maintenance engineers from understanding the root thermodynamic or behavioral causes behind detected anomalies.

To address these limitations, this project introduces the **Enterprise Energy Anomaly Detection System (EEADS)**, offering three primary scientific and engineering contributions:
1. An asynchronous, high-throughput streaming data pipeline orchestrated by Apache Kafka and FastAPI capable of monitoring multi-building portfolios in real time.
2. An adaptive hybrid decision boundary algorithm integrating statistical Interquartile Range (IQR) estimation with unsupervised K-Means clustering, providing dynamic noise-tolerant thresholding across diverse building load regimes.
3. An Explainable AI (XAI) diagnostic module that computes relative feature attribution across microclimate indicators and historical lag metrics, translating mathematical deviations into actionable technical directives for facility engineering teams.

---

## 2. System Architecture

The end-to-end framework is decoupled into five modular layers:

```
[IoT Telemetry Simulator]
        |
        v (JSON Stream)
[Apache Kafka Broker: energy_stream]
        |
        v (Consumer Thread)
[FastAPI AI Core Engine] <---> [PostgreSQL Database]
        |
        v (REST API Endpoints)
[Frontend Monitoring SPA Dashboard]
```

1. **IoT Telemetry Simulator (Producer)**: Reads and synchronizes multivariate hourly electricity consumption and localized meteorological time series from the Building Data Genome 2 dataset, executes online feature engineering, and dispatches telemetry packets to the message broker. Supports synthetic fault injection for controlled benchmark validation.
2. **Message Broker (Apache Kafka)**: Delivers distributed, fault-tolerant message streaming on topic `energy_stream`, decoupling data generation from analytical inference.
3. **Backend Analytical Service (FastAPI & AI Engine)**: Operates a dedicated background consumer thread, executes XGBoost predictive inference, evaluates the hybrid anomaly decision boundary, derives XAI feature attributions, and exposes a high-performance RESTful API.
4. **Relational Data Persistence (PostgreSQL)**: Stores operational logs, meteorological covariates, load expectations, and structured diagnostic payloads.
5. **Interactive Dashboard (Frontend SPA)**: A responsive Single Page Application built on Vanilla JavaScript and Chart.js, rendering real-time load curves, statistical safety envelopes, environmental correlation charts, and an incident state snapshot modal.

---

## 3. Scientific Methodology

### 3.1. Data Preprocessing and Feature Engineering
Missing values within raw meter series are treated via bounded linear interpolation. The engineered feature space incorporates:
- **Cyclical Temporal Encodings**: Hour of day, day of week, month, weekend binary flags, and harmonic sine/cosine trigonometric transformations:
  $$\text{hour}_{\sin} = \sin\left(\frac{2\pi \cdot \text{hour}}{24}\right), \quad \text{hour}_{\cos} = \cos\left(\frac{2\pi \cdot \text{hour}}{24}\right)$$
- **Autoregressive Lag Variables**: Sequential historical load observations capturing localized short-term inertia and macro temporal periodicities:
  $$\text{load\_lag}_{k} \in \{1, 2, 3, 4, 5, 6, 24, 48, 168\} \text{ hours}$$
- **Rolling Window Aggregations**: Moving average and moving standard deviation computed across 3-hour and 24-hour windows (`roll_mean_3h`, `roll_std_3h`, `roll_mean_24h`), alongside daily extremes (`roll_max_24h`, `roll_min_24h`) and the short-term demand ratio (`load_ratio_24h`).
- **Microclimate and Thermodynamic Covariates**: Ambient dry-bulb temperature (`airTemperature`), dew point temperature (`dewTemperature`), wind velocity (`windSpeed`), atmospheric pressure (`seaLvlPressure`), multi-hour temperature lags (`temp_lag_1..6`), moving temperature variance (`temp_roll_std_6h`), and empirical air enthalpy:
  $$\text{Enthalpy} = 1.006 \cdot T_{\text{air}} + 0.622 \cdot T_{\text{dew}} \quad [\text{kJ/kg}]$$

### 3.2. Forecasting Engine: Bayesian-Optimized XGBoost
The base load forecaster uses Gradient Boosted Decision Trees (XGBoost) trained on logarithmic transformed load values to stabilize residual heteroscedasticity:
$$y_{\text{log}} = \ln(1 + \text{load})$$
Hyperparameter exploration was conducted using Optuna's Tree-structured Parzen Estimator (TPE), tuning tree depth (`max_depth`), learning rate (`learning_rate`), boosting rounds (`n_estimators`), row/column subsampling ratios (`subsample`, `colsample_bytree`), and L1/L2 regularization terms (`reg_alpha`, `reg_lambda`).

### 3.3. Proposed Hybrid Anomaly Detection Thresholding (IQR + K-Means)
Given actual consumption $y_t$ and the inverse-transformed model prediction $\hat{y}_t$, the absolute prediction residual is defined as:
$$e_t = |y_t - \hat{y}_t|$$
Residuals are collected within a sliding historical window of length $W = 168$ hours (one full weekly operational cycle). The dynamic threshold $\tau_t$ is determined through the confluence of parametric statistical dispersion and non-parametric clustering:

1. **Statistical Interquartile Range (IQR) Formulation**:
   $$\tau_{\text{stat}} = \text{Median}(e) + k \cdot (Q_3 - Q_1)$$
   where $k = 3.0$ acts as a conservative outlier scaling factor, and $Q_1$, $Q_3$ denote the 25th and 75th percentiles of historical residuals.
2. **Unsupervised K-Means Clustering Offset**:
   Residuals in the sliding window are partitioned into $C = 2$ clusters (distinguishing nominal residual variance from abnormal operational spikes). The clustering threshold is set to the higher cluster centroid:
   $$\tau_{\text{kmeans}} = \max(\mu_1, \mu_2)$$
3. **Hybrid Decision Rule**:
   $$\tau_t = \max\left(\tau_{\text{stat}}, \tau_{\text{kmeans}}, 0.1 \cdot y_t\right)$$
   where $0.1 \cdot y_t$ enforces a 10% lower-bound noise floor to prevent false triggers during low-load intervals. The binary anomaly classification function is formulated as:
   $$\text{IsAnomaly}(t) = \begin{cases} 1 & \text{if } e_t > \tau_t \\ 0 & \text{otherwise} \end{cases}$$

### 3.4. Explainable AI (XAI) Framework
Upon identifying an anomaly ($\text{IsAnomaly}(t) = 1$), the XAI engine computes the normalized feature divergence between the current feature vector $X_t$ and the trailing historical baseline mean $\bar{X}_{\text{baseline}}$:
$$\Delta f_j = \frac{|X_{t,j} - \bar{X}_{\text{baseline},j}|}{|\bar{X}_{\text{baseline},j}| + \epsilon} \times 100\%$$
Excluding trivial temporal identifiers, the top-ranking features by percentage divergence $\Delta f_j$ are isolated and mapped to technical advisory definitions (e.g., thermal lag compensation, excessive infiltration, equipment short-cycling, or unexpected after-hours demand).

---

## 4. Benchmark Dataset Reference

The experimental validation is conducted using the **Building Data Genome Project 2 (BDG2)** open benchmark:
- **Citation**: Miller, C., Kathirgamanathan, A., Picchetti, B., et al. (2020). *The Building Data Genome Project 2, energy meter data from the ASHRAE Great Energy Predictor III competition*. Nature Scientific Data, 7, 368. DOI: [10.1038/s41597-020-00712-x](https://doi.org/10.1038/s41597-020-00712-x).
- **Dataset Scope**: 3,053 hourly electric sub-meters across 1,636 non-residential commercial and institutional buildings globally over a two-year operational timeframe (2016-2017).
- **Meteorological Data**: Weather observation records from localized stations providing hourly dry-bulb temperature, dew point, wind velocity, sea-level pressure, and cloud coverage.

---

## 5. Empirical Evaluation and Comparative Benchmark

The optimized XGBoost forecasting pipeline achieved the following evaluation metrics on the BDG2 benchmark:

| Metric | Measured Value | Description |
| :--- | :--- | :--- |
| **RMSE** (Root Mean Squared Error) | **2.1235 kWh** | Quadratic mean of predictive residuals |
| **MAE** (Mean Absolute Error) | **0.7826 kWh** | Average absolute magnitude of forecast deviations |
| **R2 Score** (Coefficient of Determination) | **0.9997** | Proportion of load variance explained by the model |
| **MAPE** (Mean Absolute Percentage Error) | **0.82%** | Relative percentage error across all validation steps |

### Comparative Literature Benchmark:
1. **Ambat et al. (2026)** (*Occupancy-Aware Spatio-Temporal Building Energy Forecasting with a Hybrid LSTM-GNN*, ResearchGate Study):
   Reported an RMSE of **2.766 kWh** on the BDG2 benchmark. The present Bayesian-optimized XGBoost pipeline demonstrates superior accuracy (**2.1235 kWh** vs. 2.766 kWh).
2. **MDPI Energies (2025)** (*A Method for Selecting Appropriate Source Domain Buildings for Building Energy Prediction in Transfer Learning*, Energies 18(14), 3706):
   Reported an RMSE of approximately **6.5 kWh** with an R2 score of **~0.92**. The current system demonstrates higher explanatory power (R2 = 0.9997).

---

## 6. Repository Structure

```
energy_anomaly_project/
|-- .gitattributes                 # Git platform normalization and binary file rules
|-- .gitignore                      # Exclusion rules for virtual environments and large datasets
|-- README.md                       # Comprehensive project scientific documentation
|-- docker-compose.yml              # Multi-container orchestration (Kafka & PostgreSQL)
|-- reset_system.py                 # Automated database reset and Kafka topic cleanup utility
|-- run_ui.py                       # Lightweight HTTP server hosting the frontend dashboard
|-- test_db.py                      # PostgreSQL connectivity diagnostic script
|
|-- backend/                        # Backend RESTful API and analytical inference service
|   |-- pyproject.toml              # UV project configuration and dependency specifications
|   |-- uv.lock                     # Deterministic dependency lockfile generated by UV
|   |-- requirements.txt            # Fallback requirements list for standard pip environments
|   |-- README.md                   # Technical documentation for the backend service
|   |-- app/
|   |   |-- __init__.py
|   |   |-- ai_core.py              # XGBoost model loader, hybrid IQR/K-Means logic, XAI engine
|   |   |-- database.py             # SQLAlchemy ORM declarative models and connection engine
|   |   |-- kafka_consumer.py       # Background thread consuming real-time Kafka streams
|   |   `-- main.py                 # FastAPI routing definitions and application entrypoint
|   `-- models_ai/                  # Serialized production model weights
|       |-- label_encoder_optuna.pkl
|       `-- xgboost_forecasting_optuna.json
|
|-- frontend/                       # Interactive Single Page Application (SPA)
|   |-- index.html                  # Main operational monitoring dashboard
|   |-- css/
|   |   `-- style.css               # User interface stylesheet
|   `-- js/                         # Client-side scripts and chart renderers
|       |-- api.js
|       |-- app.js
|       |-- charts/
|       `-- components/
|
|-- Models/                         # Experimental machine learning research and documentation
|   |-- README.md                   # Model architecture overview and performance comparisons
|   |-- Transformer/                # Deep learning sequence modeling experiments (Transformer, Mamba)
|   |   |-- Demo_Transformer_2.ipynb
|   |   |-- demo_transformer_2.py
|   |   |-- best_global_model.h5
|   |   |-- best_mamba_model.pth
|   |   `-- best_transformer_model.keras
|   `-- XGBoost/                    # Primary XGBoost research workspace
|       |-- Code/
|       |   `-- Demo_XGBoost_5.ipynb
|       |-- Paper (Reference)/      # Academic reference literature and dataset descriptors
|       |-- label_encoder_optuna.pkl
|       |-- result.txt              # Empirical evaluation metrics and benchmark records
|       `-- xgboost_forecasting_optuna.json
|
`-- simulator/                      # IoT smart meter telemetry generator
    |-- README.md                   # Simulator operational instructions
    |-- producer.py                 # Kafka stream producer with synthetic fault injection
    |-- requirements.txt            # Minimal producer dependencies
    `-- data/                       # Local raw dataset files (excluded from version control)
```

---

## 7. Environment and Dependency Management with UV

The backend environment is managed using **UV**, a high-performance Python package installer and resolver written in Rust.

Key technical advantages:
- **Deterministic Resolution**: The `backend/uv.lock` file stores cryptographic hashes and pinned dependency sub-trees, guaranteeing identical execution environments across heterogeneous operating systems.
- **Enhanced Performance**: Dependency resolution and package installation operate up to 10-100x faster than legacy `pip` and `virtualenv` tools.
- **Unified Workspace Isolation**: Managed virtual environments reside within `backend/.venv` without polluting the global Python installation.

---

## 8. Installation and Deployment Guide

### 8.1. Prerequisites
- Operating System: Windows 10/11, Ubuntu 20.04+, or macOS
- Python: Version 3.10 or higher
- UV: Python package manager (`pip install uv` or installed via official standalone installer)
- Docker and Docker Compose: Required for containerized Apache Kafka and PostgreSQL

### 8.2. Infrastructure Initialization (Docker)
From the repository root, start the background infrastructure services:
```bash
docker-compose up -d
```
Verify container operational status:
```bash
docker ps
```
Confirm that `kafka_kraft` (port `29092`) and `energy_postgres` (mapped to host port `5433`) are in an active `Up` state.

### 8.3. Backend Environment Setup with UV
Navigate to the `backend/` directory and synchronize all required packages:
```bash
cd backend
uv sync
```
Verify PostgreSQL connectivity:
```bash
uv run python ../test_db.py
```
Initialize database tables and flush residual Kafka topics:
```bash
uv run python ../reset_system.py
```

### 8.4. Starting System Services
To run the full operational pipeline, open **three independent terminal windows**:

#### Terminal 1: Launch Backend API Service
```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The FastAPI server will be accessible at `http://localhost:8000`. The Kafka consumer thread will automatically initialize upon application startup.

#### Terminal 2: Launch Frontend Web Server
```bash
python run_ui.py
```
Access the operational dashboard via your web browser at: **`http://localhost:8050`**.

#### Terminal 3: Launch Telemetry Producer (Simulator)
```bash
cd simulator
python producer.py
```
The producer will sequentially ingest building time series, compute dynamic lag and microclimate features, and stream events to Kafka at 0.5-second intervals.

---

## 9. Academic References

1. Miller, C., Kathirgamanathan, A., Picchetti, B., et al. (2020). *The Building Data Genome Project 2, energy meter data from the ASHRAE Great Energy Predictor III competition*. **Nature Scientific Data**, 7, 368. DOI: [10.1038/s41597-020-00712-x](https://doi.org/10.1038/s41597-020-00712-x).
2. Ambat, S., et al. (2026). *Occupancy-Aware Spatio-Temporal Building Energy Forecasting with a Hybrid Long Short-Term Memory and Graph Neural Network Benchmark Using Public Datasets*. **ResearchGate Preprint**. [Article Link](https://www.researchgate.net/publication/399801780_Occupancy-Aware_Spatio-Temporal_Building_Energy_Forecasting_with_a_Hybrid_Long_ShortTerm_Memory_and_Graph_Neural_Network_Benchmark_Using_Public_Datasets).
3. Chen, T., & Guestrin, C. (2016). *XGBoost: A Scalable Tree Boosting System*. **Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining**, 785-794. DOI: [10.1145/2939672.2939785](https://doi.org/10.1145/2939672.2939785).
4. Akiba, T., Sano, S., Yanase, T., Ohta, T., & Koyama, M. (2019). *Optuna: A Next-generation Hyperparameter Optimization Framework*. **ACM SIGKDD International Conference on Knowledge Discovery and Data Mining**.
5. MDPI Energies (2025). *A Method for Selecting the Appropriate Source Domain Buildings for Building Energy Prediction in Transfer Learning*. **Energies**, 18(14), 3706. DOI: [10.3390/en18143706](https://doi.org/10.3390/en18143706).