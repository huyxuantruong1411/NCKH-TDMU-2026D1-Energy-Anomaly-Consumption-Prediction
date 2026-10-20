# IoT Telemetry Simulator: Stream Producer

## 1. Operating Principles

The simulator emulates an enterprise IoT smart meter and environmental sensor network using the Building Data Genome Project 2 (BDG2) dataset.

- **Multi-Source Data Alignment**: Aligns high-resolution hourly electrical load records (`electricity_cleaned.csv`) with co-located meteorological observations (`weather.csv`).
- **Dynamic Feature Engineering**:
  - Autoregressive Lag Features: `load_lag_1`, `load_lag_2`, `load_lag_3`, `load_lag_4`, `load_lag_5`, `load_lag_6`, `load_lag_24`, `load_lag_48`, `load_lag_168`.
  - Rolling Window Statistics: `roll_mean_3h`, `roll_std_3h`, `roll_mean_24h`, `roll_max_24h`, `roll_min_24h`, and `load_ratio_24h`.
  - Meteorological and Thermodynamic Metrics: `temp_lag_1..6`, `temp_roll_mean_6h`, `temp_roll_std_6h`.
  - Empirical Air Enthalpy:

$$
\text{Enthalpy} = 1.006 \cdot T_{\text{air}} + 0.622 \cdot T_{\text{dew}} \quad [\text{kJ/kg}]
$$

- **Synthetic Fault Injection Mechanism**: Embeds controlled artificial anomalies with configurable injection probability (`INJECT_FAULT_RATE = 0.02`) and load spike multipliers (`FAULT_MULTIPLIER = 1.8`) to validate detection sensitivity and benchmark threshold robustness.

## 2. Execution Instructions

Execute the telemetry producer from the `simulator/` directory:
```bash
python producer.py
```
Each simulated reading is packaged into a structured JSON payload and dispatched to Apache Kafka under topic `energy_stream` at regular 0.5-second intervals.
