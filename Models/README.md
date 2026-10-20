# Machine Learning Models and Empirical Evaluation

This directory contains experimental implementations, model training workflows, serialized model weights, and benchmark evaluation records for building energy forecasting and anomaly detection.

## 1. Primary Model: XGBoost with Optuna Hyperparameter Optimization (`Models/XGBoost`)

### 1.1. Directory Structure
- `Code/Demo_XGBoost_5.ipynb`: Interactive Jupyter Notebook containing exploratory data analysis, feature engineering pipelines, automated Bayesian hyperparameter optimization with Optuna, and residual diagnostics.
- `xgboost_forecasting_optuna.json`: Serialized booster artifact containing trained decision tree ensembles and feature mapping metadata.
- `label_encoder_optuna.pkl`: Serialized Scikit-learn LabelEncoder instance for categorical building identifiers.
- `result.txt`: Empirical error metric summaries and comparative benchmarks against peer-reviewed international publications.
- `Paper (Reference)/`: Curated collection of scientific reference papers and technical documentation pertaining to the Building Data Genome Project 2 (BDG2).

### 1.2. Empirical Evaluation and Benchmark Comparison
The optimized XGBoost model evaluated on the BDG2 benchmark achieved the following performance metrics:
- **RMSE (Root Mean Squared Error)**: 2.1235 kWh
- **MAE (Mean Absolute Error)**: 0.7826 kWh
- **R2 Score (Coefficient of Determination)**: 0.9997
- **MAPE (Mean Absolute Percentage Error)**: 0.82%

Comparative findings against recent literature:
- **Benchmark 1 (Occupancy-Aware Spatio-Temporal LSTM-GNN, 2026)**: Reported an RMSE of 2.766 kWh on BDG2. The present optimized formulation achieves superior error reduction (RMSE of 2.1235 kWh).
- **Benchmark 2 (Domain Selection in Transfer Learning, MDPI Energies 2025)**: Reported an RMSE of approximately 6.5 kWh and R2 of ~0.92.

## 2. Extended Research: Deep Learning for Time-Series (`Models/Transformer`)

Exploratory implementations evaluating contemporary deep neural network architectures for sequence modeling:
- `Demo_Transformer_2.ipynb` and `demo_transformer_2.py`: Experimental pipelines evaluating multi-head self-attention mechanisms (Transformer) and structured state space sequence models (Mamba).
- `best_global_model.h5`: Serialized baseline global neural network weights.
- `best_mamba_model.pth`: Serialized PyTorch checkpoint for the Mamba sequence model.
- `best_transformer_model.keras`: Serialized Keras model checkpoint for the Transformer architecture.
