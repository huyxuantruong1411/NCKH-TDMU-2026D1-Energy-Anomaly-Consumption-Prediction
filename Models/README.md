# Danh muc mo hinh hoc may va danh gia thuc nghiem (Machine Learning Models & Evaluation)

Thu muc nay luu tru cac nghien cuu thuc nghiem, ma nguon huan luyen va tep trong so mo hinh phuc vu bai toan du bao phu tai nang luong va phat hien bat thuong.

## 1. Mo hinh XGBoost va Toi uu hoa Optuna (`Models/XGBoost`)

### 1.1. Cau truc thu muc
- `Code/Demo_XGBoost_5.ipynb`: Jupyter Notebook thuc nghiem qua trinh tien xu ly du lieu, ky thuat tao dac trung (Feature Engineering), toi uu hoa sieu tham so voi Optuna va danh gia do chinh xac.
- `xgboost_forecasting_optuna.json`: Tep trong so mo hinh XGBoost Booster da huan luyen va toi uu hoa.
- `label_encoder_optuna.pkl`: Tep ma hoa danh muc cac cong trinh (LabelEncoder).
- `result.txt`: Bang ket qua do luong do loi thuc nghiem va so sanh doi chung voi cac cong bo khoa hoc quoc te.
- `Paper (Reference)/`: Tap hop cac tai lieu nghien cuu tham chieu va tai lieu mo ta bo du lieu Building Data Genome Project 2.

### 1.2. Ket qua thuc nghiem va So sanh doi chung (Benchmark Metrics)
Mo hinh XGBoost toi uu hoa trong nghien cuu dat duoc cac chi so do luong tren tap du lieu BDG2 nhu sau:
- RMSE (Root Mean Squared Error): 2.1235 kWh
- MAE (Mean Absolute Error): 0.7826 kWh
- R2 Score (Coefficient of Determination): 0.9997
- MAPE (Mean Absolute Percentage Error): 0.82%

So sanh doi chung voi cac nghien cuu quoc te:
- **Paper 1 (Occupancy-Aware Spatio-Temporal Building Energy Forecasting with a Hybrid LSTM-GNN, 2026)**: Dat RMSE = 2.766 kWh tren tap du lieu BDG2. Mo hinh de xuat cua de tai dat do loi thap hon (2.1235 kWh so voi 2.766 kWh).
- **Paper 2 (A Method for Selecting Appropriate Source Domain Buildings in Transfer Learning, MDPI 2025)**: RMSE xap xi 6.5 kWh va R2 o muc 0.92.

## 2. Mo hinh Transformer va Deep Learning (`Models/Transformer`)

Nghien cuu mo rong kien truc Deep Learning cho chuoi thoi gian:
- `Demo_Transformer_2.ipynb` va `demo_transformer_2.py`: Thuc nghiem kien truc Transformer va mo hinh chuoi trang thai (Mamba State Space Model).
- `best_global_model.h5`: Trong so mo hinh mang no-ron toan cuc.
- `best_mamba_model.pth`: Trong so mo hinh Mamba.
- `best_transformer_model.keras`: Trong so mo hinh Transformer.
