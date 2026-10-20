import time
from sqlalchemy import create_engine, text
from kafka.admin import KafkaAdminClient
from kafka.errors import UnknownTopicOrPartitionError

# Đã đổi port sang 5433
DATABASE_URL = "postgresql://postgres:14112002@localhost:5433/energy_db"
KAFKA_BROKER = "localhost:29092"
TOPIC_NAME = "energy_stream"

def reset_database():
    print(f"[INFO] Connecting to database: {DATABASE_URL}")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.begin() as conn:
            conn.execute(text("DROP TABLE IF EXISTS energy_records CASCADE;"))
        print("[INFO] Database reset completed. Table 'energy_records' dropped successfully.")
    except Exception as e:
        print(f"[ERROR] Database reset encountered an error: {e}")

def reset_kafka():
    print(f"[INFO] Connecting to Kafka broker: {KAFKA_BROKER}")
    try:
        admin_client = KafkaAdminClient(bootstrap_servers=KAFKA_BROKER)
        admin_client.delete_topics([TOPIC_NAME])
        print(f"[INFO] Kafka topic '{TOPIC_NAME}' deleted successfully.")
        time.sleep(2) 
    except UnknownTopicOrPartitionError:
        print(f"[WARNING] Kafka topic '{TOPIC_NAME}' does not exist.")
    except Exception as e:
        print(f"[ERROR] Kafka reset encountered an error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("[SYSTEM] Initiating full system reset...")
    reset_database()
    reset_kafka()
    print("[SYSTEM] System reset completed successfully.")