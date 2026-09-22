import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

SQLITE_FALLBACK_URL = "sqlite:///./shopsense.db"

def initialize_database():
    target_url = settings.DATABASE_URL or SQLITE_FALLBACK_URL

    if not target_url.startswith("sqlite"):
        try:
            # Test PostgreSQL connection with a short connection timeout
            test_engine = create_engine(
                target_url,
                connect_args={"connect_timeout": 3} if "postgres" in target_url else {},
                echo=False
            )
            with test_engine.connect():
                pass
            print(f"[Database] Successfully connected to primary database: {target_url.split('@')[-1] if '@' in target_url else target_url}")
            return test_engine
        except Exception as exc:
            print(f"[Database] Primary database is not available ({exc}).")
            print(f"[Database] Automatically falling back to SQLite: {SQLITE_FALLBACK_URL}")
            target_url = SQLITE_FALLBACK_URL

    connect_args = {"check_same_thread": False} if target_url.startswith("sqlite") else {}
    return create_engine(
        target_url,
        connect_args=connect_args,
        echo=False
    )

engine = initialize_database()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

