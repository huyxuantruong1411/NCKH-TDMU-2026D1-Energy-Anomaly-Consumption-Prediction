# He Thong Giam Sat va Phat Hien Bat Thuong Phu Tai Nang Luong
## Enterprise Energy Anomaly Detection and Forecasting System (EEADS)

De tai Nghien cuu Khoa hoc (NCKH) - Truong Dai hoc Thu Dau Mot (TDMU).  
Nghien cuu va ung dung mo hinh Machine Learning ket hop voi He thong phan nguong dong Hybrid (IQR va K-Means) cung co che Giai thich mo hinh (Explainable AI - XAI) trong bai toan giam sat phu tai dien nang thoi gian thuc.

---

## Muc luc

1. [Tong quan de tai va Dat van de nghien cuu](#1-tong-quan-de-tai-va-dat-van-de-nghien-cuu)
2. [Kien truc He thong (System Architecture)](#2-kien-truc-he-thong-system-architecture)
3. [Phuong phap luan Khoa hoc (Scientific Methodology)](#3-phuong-phap-luan-khoa-hoc-scientific-methodology)
   - 3.1. [Tien xu ly va Ky thuat dac trung (Feature Engineering)](#31-tien-xu-ly-va-ky-thuat-dac-trung-feature-engineering)
   - 3.2. [Mo hinh Du bao XGBoost toi uu bang Optuna](#32-mo-hinh-du-bao-xgboost-toi-uu-bang-optuna)
   - 3.3. [Thuat toan Phan nguong dong Hybrid (IQR + K-Means)](#33-thuat-toan-phan-nguong-dong-hybrid-iqr--k-means)
   - 3.4. [Co che Giai thich Mo hinh (Explainable AI - XAI)](#34-co-che-giai-thich-mo-hinh-explainable-ai---xai)
4. [Co so Du lieu Thuc nghiem (Benchmark Dataset)](#4-co-so-du-lieu-thuc-nghiem-benchmark-dataset)
5. [Ket qua Thuc nghiem va So sanh Doi chung](#5-ket-qua-thuc-nghiem-va-so-sanh-doi-chung)
6. [Cau truc Thu muc Repository](#6-cau-truc-thu-muc-repository)
7. [Quan ly Moi truong va Goi phu thuoc voi UV](#7-quan-ly-moi-truong-va-goi-phu-thuoc-voi-uv)
8. [Huong dan Cai dat va Van hanh He thong](#8-huong-dan-cai-dat-va-van-hanh-he-thong)
9. [Tai lieu Tham khao (References)](#9-tai-lieu-tham-khao-references)

---

## 1. Tong quan de tai va Dat van de nghien cuu

Trong boi canh van hanh luoi dien thong minh (Smart Grids) va he thong quan ly nang luong toa nha (Building Energy Management Systems - BEMS), su bien dong bat thuong cua phu tai tieu thu dien gay ra nhieu rui ro ve qua tai cuc bo, sut giam chat luong dien nang va lang phi chi phi van hanh. 

Cac phuong phap phat hien bat thuong truyen thong thuong dua vao nguong co dinh (Static Thresholds), dan den ty le bao dong gia (False Positives) cao khi phu tai bien dong theo chu ky gio, ngay va mua. Hon nua, cac mo hinh hoc may hop den (Black-box Models) thieu kha nang giai thich nguyen nhan gay ra di thuong, khien can bo quan ly van hanh kho khan trong viec ra quyet dinh dieu do va bao tri.

De tai de xuat he thong **EEADS (Enterprise Energy Anomaly Detection System)** nham giai quyet cac thach thuc tren thong qua ba dong gop chinh:
1. Xay dung pipeline truyen phat du lieu thoi gian thuc dua tren Apache Kafka va FastAPI, co kha nang giam sat dong thoi hang chuc cong trinh.
2. Phat trien thuat toan phan nguong dong ket hop (Hybrid Thresholding) giua phan vi thong ke Interquartile Range (IQR) va thuat toan gom cum khong giam sat K-Means, giup thich ung linh hoat theo bien do phu tai tung cong trinh.
3. Tich hop co che giai thich mo hinh (XAI) dua tren phan ra dong gop cua cac dac trung vi khi hau va chuoi thoi gian, tu dong chuyen doi thanh cac khuyen nghi ky thuat ro rang.

---

## 2. Kien truc He thong (System Architecture)

Kien truc tong the cua he thong duoc to chuc thanh 5 thanh phan doc lap theo mo hinh huong dich vu:

1. **IoT Stream Simulator (Producer)**: 
   - Doc va hop nhat chuoi thoi gian dien nang va thong so vi khi hau tu tap du lieu Building Data Genome 2.
   - Thuc hien tinh toan cac dac trung dong (lags, rolling statistics, enthalpy) va truyen phat vao he thong thong qua Apache Kafka.
   - Ho tro co che tiem loi nhan tao (Synthetic Fault Injection) phuc vu danh gia thuc nghiem.
2. **Message Broker (Apache Kafka)**:
   - Dong vai tro dem du lieu thoi gian thuc, dam bao tinh toan ven, kha nang chiu loi va thong luong cao.
   - Topic chinh: `energy_stream`.
3. **Backend Computing Service (FastAPI & AI Engine)**:
   - Kafka Consumer tiep nhan message theo thoi gian thuc.
   - Chay suy luan du bao tu mo hinh XGBoost va xac dinh nguong an toan bang thuat toan Hybrid K-Means + IQR.
   - Tinh toan ma tran dong gop dac trung XAI khi phu tai vuot nguong cho phep.
   - Cung cap he thong RESTful API phuc vu truy van du lieu va nhat ky su co.
4. **Co so Du lieu Quan he (PostgreSQL)**:
   - Luu tru toan bo chuoi thoi gian van hanh, du lieu quan trac vi khi hau va log danh gia XAI.
5. **Giao dien Giam sat Truc quan (Frontend SPA)**:
   - Xay dung bang Vanilla JavaScript va Chart.js theo kien truc Single Page Application.
   - Hien thi do thi dong hoc phu tai, dai an toan thong ke, tuong quan vi khi hau va anh chup trang thai su co (Snapshot Modal).

---

## 3. Phuong phap luan Khoa hoc (Scientific Methodology)

### 3.1. Tien xu ly va Ky thuat dac trung (Feature Engineering)
Du lieu tho duoc xu ly qua trinh noi suy tuyen tinh (linear interpolation) de xu ly cac gia tri thieu. Tap dac trung dau vao cua mo hinh bao gom:
- **Dac trung thoi gian tuan hoan**: `hour`, `dayofweek`, `month`, `is_weekend`, cung cac bien bien doi luong giac `hour_sin = sin(2*pi*hour/24)` va `hour_cos = cos(2*pi*hour/24)`.
- **Dac trung tre chuoi thoi gian (Autoregressive Lags)**: Cac bien tre o cac moc thoi gian chien luoc: `load_lag_1`, `load_lag_2`, `load_lag_3`, `load_lag_4`, `load_lag_5`, `load_lag_6`, `load_lag_24` (chu ky ngay), `load_lag_48`, va `load_lag_168` (chu ky tuan).
- **Thong ke trượt (Rolling Window Statistics)**: Trung binh trượt 3 gio (`roll_mean_3h`), do lech chuan trượt 3 gio (`roll_std_3h`), trung binh trượt 24 gio (`roll_mean_24h`), cung gia tri cuc dai (`roll_max_24h`) va cuc tieu (`roll_min_24h`).
- **Dac trung vi khi hau va nhiet dong luc hoc**: Nhiet do moi truong (`airTemperature`), do am diem suong (`dewTemperature`), van toc gio (`windSpeed`), ap suat (`seaLvlPressure`), cac bien tre nhiet do `temp_lag_1..6`, do lech chuan nhiet do `temp_roll_std_6h` va chi so Entanpi khong khi:
  $$\text{Enthalpy} = 1.006 \times T_{\text{air}} + 0.622 \times T_{\text{dew}}$$

### 3.2. Mo hinh Du bao XGBoost toi uu bang Optuna
Mo hinh loi duoc xay dung tren thuat toan Gradient Boosted Decision Trees (XGBoost), toi uu hoa ham muc tieu hoi quy tren bien doi logarit cua phu tai:
$$y_{\text{log}} = \ln(1 + \text{load})$$
Qua trinh tim kiem sieu tham so toi uu duoc thuc hien tu dong hoa thong qua framework Optuna voi giai thuat Tree-structured Parzen Estimator (TPE), toi uu cac tham so: `max_depth`, `learning_rate`, `n_estimators`, `subsample`, `colsample_bytree`, `reg_alpha` va `reg_lambda`.

### 3.3. Thuat toan Phan nguong dong Hybrid (IQR + K-Means)
Thay vi su dung do lech tuyet doi co dinh, do lech du bao (residual error):
$$e_t = |y_t - \hat{y}_t|$$
duoc dua vao bo nho dem truot gom $W = 168$ chu ky gio gan nhat. Nguong di thuong $\tau_t$ duoc xac dinh bang su giao thoa giua hai tieu chi:
1. **Nguong thong ke Interquartile Range (IQR)**:
   $$\tau_{\text{stat}} = \text{Median}(e) + k \times (Q_3 - Q_1)$$
   trong do $k = 3.0$, $Q_1$ va $Q_3$ lan luot la phan vi 25% va 75% cua sai so lich su.
2. **Nguong gom cum khong giam sat K-Means**:
   Du lieu sai so trong cua so truot duoc dua vao thuat toan K-Means voi so cum $C = 2$ (phan tach giua cum sai so on dinh va cum sai so dot bien). Nguong gom cum duoc tinh bang tam cum lon nhat:
   $$\tau_{\text{kmeans}} = \max(\mu_1, \mu_2)$$
3. **Quy tac ket hop (Hybrid Decision Rule)**:
   $$\tau_t = \max(\tau_{\text{stat}}, \tau_{\text{kmeans}}, 0.1 \times y_t)$$
   Dieu kien phat hien bat thuong:
   $$\text{IsAnomaly}(t) = \begin{cases} 1 & \text{neu } e_t > \tau_t \\ 0 & \text{nguoc lai} \end{cases}$$

### 3.4. Co che Giai thich Mo hinh (Explainable AI - XAI)
Khi he thong ghi nhan trang thai di thuong ($\text{IsAnomaly} = 1$), module XAI se tinh toan vector bien thien tuong doi giua vector dac trung hien tai $X_t$ va vector trung binh co so truoc do:
$$\Delta f_j = \frac{|X_{t,j} - \bar{X}_{\text{baseline},j}|}{|\bar{X}_{\text{baseline},j}| + \epsilon} \times 100\%$$
Cac dac trung co gia tri $\Delta f_j$ cao nhat duoc xac dinh la nguyen nhan trong yeu (Root Causes) va duoc a-nh xa sang tu dien quy trinh ky thuat de huong dan van hanh.

---

## 4. Co so Du lieu Thuc nghiem (Benchmark Dataset)

Nghien cuu su dung tap du lieu chuan hoa cong khai **Building Data Genome Project 2 (BDG2)**:
- Nguon: Miller et al., Scientific Data (Nature Research), 2020.
- Quy mo du lieu: 3.053 dong ho do dien nang tu 1.636 cong trinh phi nha o trai rong tren toan cau trong thoi gian 2 nam van hanh (2016-2017).
- Du lieu quan trac thoi tiet di kem: Tram khi tuong dia phuong voi tan suat 1 gio/lan ghi nhan nhiet do, diem suong, gio, ap suat va do phu may.

---

## 5. Ket qua Thuc nghiem va So sanh Doi chung

Ket qua danh gia mo hinh XGBoost toi uu hoa trong nghien cuu nay tren tap du lieu BDG2:

| Chi so Danh gia (Metric) | Gia tri Dat duoc | Y nghia Thong ke |
| :--- | :--- | :--- |
| **RMSE** (Root Mean Squared Error) | **2.1235 kWh** | Do lech can bac hai trung binh giua gia tri thuc te va du bao |
| **MAE** (Mean Absolute Error) | **0.7826 kWh** | Sai so tuyet doi trung binh tren moi gio van hanh |
| **R2 Score** (Coefficient of Determination) | **0.9997** | Ty le bien thien cua phu tai duoc mo hinh giai thich |
| **MAPE** (Mean Absolute Percentage Error) | **0.82%** | Sai so phan tram tuyet doi trung binh tren toan bo chuoi |

### So sanh doi chung voi cac nghien cuu quoc te:
1. **Nghien cuu cua Ambat et al. (2026)** (*Occupancy-Aware Spatio-Temporal Building Energy Forecasting with a Hybrid LSTM-GNN*):
   Mo hinh lai LSTM ket hop Graph Neural Network dat RMSE = 2.766 kWh tren tap BDG2. Mo hinh XGBoost toi uu hoa trong nghien cuu nay dat sai so thap hon (2.1235 kWh so voi 2.766 kWh).
2. **Nghien cuu cua MDPI Energies (2025)** (*Appropriate Source Domain Buildings for Building Energy Prediction in Transfer Learning*):
   Phuong phap Transfer Learning dat RMSE xap xi 6.5 kWh va he so R2 dat ~0.92.

---

## 6. Cau truc Thu muc Repository

Repository duoc to chuc theo kien truc phan tang ro rang:

```
energy_anomaly_project/
├── .gitignore                      # Quy tac loai tru cac tep tam, tep dataset nang (>100MB)
├── README.md                       # Tai lieu hoc thuat tong the cua de tai
├── docker-compose.yml              # Khoi tao container Apache Kafka va PostgreSQL
├── reset_system.py                 # Script don dep CSDL va Kafka topic truoc thuc nghiem
├── run_ui.py                       # May chu Web phuc vu giao dien giam sat Frontend
├── test_db.py                      # Kiem tra ket noi den co so du lieu PostgreSQL
│
├── backend/                        # Dich vu Backend API va Suy luan AI
│   ├── pyproject.toml              # Cau hinh quan ly goi phu thuoc bang UV
│   ├── uv.lock                     # Tep khoa phien ban cac thu vien chinh xac
│   ├── requirements.txt            # Danh muc thu vien du phong cho pip truyen thong
│   ├── README.md                   # Tai lieu ky thuat chi tiet cua Backend Service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── ai_core.py              # Logic mo hinh XGBoost, thuat toan Hybrid IQR/K-Means va XAI
│   │   ├── database.py             # Cau hinh SQLAlchemy ORM va Model EnergyRecord
│   │   ├── kafka_consumer.py       # Thread tiep nhan luong du lieu Kafka theo thoi gian thuc
│   │   └── main.py                 # RESTful API endpoints tren nen tang FastAPI
│   └── models_ai/                  # Tep trong so mo hinh phuc vu suy luan Backend
│       ├── label_encoder_optuna.pkl
│       └── xgboost_forecasting_optuna.json
│
├── frontend/                       # Giao dien giam sat Single Page Application (SPA)
│   ├── index.html                  # Giao dien dieu khien trung tam (Dashboard)
│   ├── css/
│   │   └── style.css               # He thong dinh kieu CSS chuyen nghiep
│   └── js/                         # Ma nguon JavaScript xu ly tuong tac va bieu do
│       ├── api.js
│       ├── app.js
│       ├── charts/
│       └── components/
│
├── Models/                         # Nghien cuu thuc nghiem va Tai lieu mo hinh
│   ├── README.md                   # Bao cao phuong phap luan cac mo hinh
│   ├── Transformer/                # Nghien cuu mo rong Deep Learning (Transformer & Mamba)
│   │   ├── Demo_Transformer_2.ipynb
│   │   ├── demo_transformer_2.py
│   │   ├── best_global_model.h5
│   │   ├── best_mamba_model.pth
│   │   └── best_transformer_model.keras
│   └── XGBoost/                    # Nghien cuu mo hinh loi XGBoost
│       ├── Code/
│       │   └── Demo_XGBoost_5.ipynb
│       ├── Paper (Reference)/      # Cac bai bao khoa hoc tham khao va tai lieu BDG2
│       ├── label_encoder_optuna.pkl
│       ├── result.txt              # Ket qua thuc nghiem do loi
│       └── xgboost_forecasting_optuna.json
│
└── simulator/                      # Trinh mo phong truyen phat du lieu cam bien IoT
    ├── README.md                   # Huong dan van hanh bo mo phong
    ├── producer.py                 # Kafka Producer truyen phat chuoi thoi gian
    ├── requirements.txt            # Cac goi phu thuoc toi thieu cua bo mo phong
    └── data/                       # Thu muc du lieu tho (loai tru khoi Git do >100MB)
```

---

## 7. Quan ly Moi truong va Goi phu thuoc voi UV

De giai quyet triet de tinh trang xung dot goi thu vien va toi uu hoa toc do cai dat, du an su dung **UV** - cong cu quan ly moi truong Python hien dai dua tren nen tang Rust.

### Cac uu diem khi su dung UV:
- **Hieu nang vuot troi**: Toc do giai quyet phu thuoc va cai dat nhanh gap 10-100 lan so voi `pip` va `virtualenv`.
- **Kiem soat phien ban tuyet doi**: Tep `uv.lock` luu tru chi tiet toan bo ma hash va phien ban cua cac goi thu vien con, dam bao moi truong tai tao dong nhat tren moi he dieu hanh.
- **Tu dong quan ly moi truong**: Tich hop co che tao `.venv` tu dong thong qua lenh `uv sync`.

---

## 8. Huong dan Cai dat va Van hanh He thong

### 8.1. Yeu cau tien quyet (Prerequisites)
- He dieu hanh: Windows 10/11, Linux (Ubuntu 20.04+) hoac macOS.
- Python: Phien ban 3.10 tro len.
- UV: Cong cu quan ly moi truong Python (`pip install uv` hoac cai qua curl/powershell).
- Docker va Docker Compose: De khoi chay container Apache Kafka va PostgreSQL.

### 8.2. Khoi dong ha tang Docker
Mo terminal tai thu muc goc cua du an va khoi chay cac container:
```bash
docker-compose up -d
```
Kiem tra trang thai container:
```bash
docker ps
```
Dam bao hai dich vu `kafka_kraft` (cong 29092) va `energy_postgres` (cong 5433) dang o trang thai `Up`.

### 8.3. Thiet lap moi truong Backend voi UV
Di chuyen vao thu muc `backend` va dong bo toan bo thu vien:
```bash
cd backend
uv sync
```
Kiem tra ket noi co so du lieu:
```bash
uv run python ../test_db.py
```
Khoi tao lai CSDL va xoa topic cu truoc khi chay thuc nghiem:
```bash
uv run python ../reset_system.py
```

### 8.4. Van hanh He thong
De he thong hoat dong day du, mo **3 cua so Terminal doc lap**:

#### Terminal 1: Khoi dong Backend API Service
```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
May chu API se khoi dong tai dia chi: `http://localhost:8000`. Cung luc do, tien trinh Consumer se tu dong lang nghe tren Kafka Topic `energy_stream`.

#### Terminal 2: Khoi dong May chu Giao dien Web (Frontend)
```bash
python run_ui.py
```
Truy cap Dashboard giam sat tai dia chi trinh duyet: **`http://localhost:8050`**.

#### Terminal 3: Khoi dong Trinh mo phong Streaming (IoT Producer)
```bash
cd simulator
python producer.py
```
Tien trinh se doc tap du lieu dien nang va khi tuong, tao dac trung va truyen phat deu dan moi 0.5 giay vao he thong.

---

## 9. Tai lieu Tham khao (References)

1. Miller, C., Kathirgamanathan, A., Picchetti, B., et al. (2020). *The Building Data Genome Project 2, energy meter data from the ASHRAE Great Energy Predictor III competition*. **Nature Scientific Data**, 7, 368. DOI: [10.1038/s41597-020-00712-x](https://doi.org/10.1038/s41597-020-00712-x).
2. Ambat, S., et al. (2026). *Occupancy-Aware Spatio-Temporal Building Energy Forecasting with a Hybrid Long Short-Term Memory and Graph Neural Network Benchmark Using Public Datasets*. **ResearchGate Preprint**. [Lien ket bai bao](https://www.researchgate.net/publication/399801780_Occupancy-Aware_Spatio-Temporal_Building_Energy_Forecasting_with_a_Hybrid_Long_ShortTerm_Memory_and_Graph_Neural_Network_Benchmark_Using_Public_Datasets).
3. Chen, T., & Guestrin, C. (2016). *XGBoost: A Scalable Tree Boosting System*. **Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining**, 785-794. DOI: [10.1145/2939672.2939785](https://doi.org/10.1145/2939672.2939785).
4. Akiba, T., Sano, S., Yanase, T., Ohta, T., & Koyama, M. (2019). *Optuna: A Next-generation Hyperparameter Optimization Framework*. **ACM SIGKDD International Conference on Knowledge Discovery and Data Mining**.
5. MDPI Energies (2025). *A Method for Selecting the Appropriate Source Domain Buildings for Building Energy Prediction in Transfer Learning*. **Energies**, 18(14), 3706. DOI: [10.3390/en18143706](https://doi.org/10.3390/en18143706).