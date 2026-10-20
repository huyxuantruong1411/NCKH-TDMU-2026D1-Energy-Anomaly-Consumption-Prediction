# Module Mo Phong Du Lieu IoT: Data Simulator & Producer

## 1. Nguyen ly hoat dong (Working Principle)

Module Simulator dong vai tro mo phong mang luoi cam bien IoT cong to dien thoi gian thuc tu tap du lieu Building Data Genome Project 2 (BDG2).
- **Hop nhat du lieu da nguon**: Dong bo chuoi thoi gian phu tai dien nang (`electricity_cleaned.csv`) voi du lieu vi khi hau tai tram quan trac dia phuong (`weather.csv`).
- **Tao dac trung dong (Dynamic Feature Engineering)**:
  - Cac bien tre phu tai: `load_lag_1`, `load_lag_2`, `load_lag_3`, `load_lag_4`, `load_lag_5`, `load_lag_6`, `load_lag_24`, `load_lag_48`, `load_lag_168`.
  - Cac dac trung thong ke trượt: `roll_mean_3h`, `roll_std_3h`, `roll_mean_24h`, `roll_max_24h`, `roll_min_24h`, `load_ratio_24h`.
  - Dac trung vi khi hau va nhiet dong luc hoc: `temp_lag_1..6`, `temp_roll_mean_6h`, `temp_roll_std_6h`, `enthalpy`.
- **Co che tiem loi nhan tao (Synthetic Fault Injection)**: Tich hop module tiem loi ngau nhien voi ti le cau hinh (`INJECT_FAULT_RATE = 0.02`, he so tang vot `FAULT_MULTIPLIER = 1.8`) nham kiem thu do nhay va tinh on dinh cua thuat toan phat hien di thuong.

## 2. Huong dan van hanh (Execution Guide)

Tu thu muc `simulator`:
```bash
python producer.py
```
Du lieu sau khi dong goi duoc truyen phat vao Kafka Topic `energy_stream` duoi dinh dang JSON payload.
