# Backend Service: Enterprise Energy Anomaly Detection System (EEADS)

## 1. Tong quan kien truc Backend (Architecture Overview)

Backend du an EEADS dong vai tro la trung tam dieu phoi tinh toan thoi gian thuc, bao gom cac module chinh:
1. **Streaming Consumer Module (`app/kafka_consumer.py`)**: Tiep nhan dong thoi du lieu phu tai dien nang va quan trac vi khi hau tu Apache Kafka thong qua topic `energy_stream`.
2. **AI Inference & XAI Engine (`app/ai_core.py`)**: Thuc thi mo hinh XGBoost da duoc toi uu hoa sieu tham so bang Optuna de du bao phu tai ky vong; dong thoi ap dung thuat toan phan nguong dong Hybrid (ket hop giua phuong phap thong ke Interquartile Range - IQR va gom cum khong giam sat K-Means). Khi phat hien di thuong, engine se thuc hien phan ra dong gop dac trung (Feature Attribution) de phuc vu giai thich mo hinh (Explainable AI - XAI).
3. **Data Persistence Module (`app/database.py`)**: Ket noi PostgreSQL ORM (SQLAlchemy) de luu tru toan bo nhat ky van hanh, chi so khi tuong va phan tich nguyen nhan XAI.
4. **RESTful API Service (`app/main.py`)**: Cung cap he thong diem cuoi (Endpoints) hieu nang cao dua tren FastAPI phuc vu giao dien giam sat SPA.

## 2. Quan ly moi truong va goi phu thuoc voi UV (Environment Setup with UV)

He thong backend duoc chuan hoa quan ly bang cong cu **UV** thay the cho `virtualenv` va `pip` truyen thong nham dam bao tinh nhat quan cua cac goi phu thuoc (dependency lock) va toi uu toc do bien dich.

### 2.1. Cai dat goi phu thuoc
Tu thu muc `backend`, thuc hien khoi tao va dong bo moi truong bang lenh:
```bash
uv sync
```
Qua trinh nay se tu dong doc file cau hinh `pyproject.toml`, kiem tra tinh tuong thich va thiet lap moi truong cuc bo tai `.venv/`.

### 2.2. Khoi dong dich vu Backend API
Su dung lenh `uv run` de thuc thi may chu Uvicorn:
```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 3. Danh muc API Endpoints (API Specification)

- `GET /api/buildings`: Tra ve danh sach ma dinh danh cac cong trinh dang duoc giam sat trong he thong.
- `GET /api/data?building_name={name}&limit={limit}`: Truy van chuoi thoi gian phu tai thuc te, phu tai du bao, nguong an toan va nhan di thuong gan nhat.
- `GET /api/stats/summary?building_name={name}`: Tinh toan thong ke tong dien nang tieu thu, dinh phu tai (max) va phu tai nen (min) trong 24 gio.
- `GET /api/weather/correlation?building_name={name}&limit={limit}`: Cung cap chuoi du lieu tuong quan giua phu tai va cac yeu to vi khi hau (nhiet do, diem suong, van toc gio, khi ap).
- `GET /api/explain?building_name={name}`: Tra ve ket qua phan tich XAI ve dac trung dong gop lon nhat vao bien dong bat thuong gan nhat.
- `GET /api/alerts/global`: Liet ke danh sach 10 su co phu tai vuot nguong gan nhat tren toan bo mang luoi cong trinh.
- `GET /api/alerts/history?building_name={name}`: Truy xuat nhat ky chi tiet cac su co phu tai lich su cua mot cong trinh cu the phuc vu che do chup trang thai (Snapshot Modal).
- `GET /api/analytics/hourly_profile?building_name={name}`: Tinh toan ho so phu tai trung binh theo tung khung gio trong ngay (24h profile) dua tren du lieu lich su dai han.
