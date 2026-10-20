from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

# Đã đổi port sang 5433
DATABASE_URL = "postgresql://postgres:14112002@localhost:5433/energy_db"

def test_connection():
    print(f"[INFO] Testing connection to database: {DATABASE_URL} ...\n")
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            print("[INFO] Database connection established successfully.")
            print("[INFO] Database 'energy_db' is accessible and ready to accept transactions.")
            
    except OperationalError as e:
        print("[ERROR] Database connection failed.")
        print("[ERROR] Please verify the following prerequisites:")
        print(" 1. Ensure Docker services are running: 'docker-compose up -d'")
        print(" 2. Verify that container 'energy_postgres' status is 'Up'")
        print(" 3. Verify user credentials and port forwarding (port 5433).")
        print(f"\n[DETAILS] Exception message:\n{e}")
    except Exception as e:
        print(f"[ERROR] An unexpected error occurred: {e}")

if __name__ == "__main__":
    test_connection()