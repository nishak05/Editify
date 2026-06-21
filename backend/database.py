import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH     = os.path.join(BACKEND_DIR, "editify.db")
DB_URL      = f"sqlite:///{DB_PATH}"

# engine is the connection to the database file
engine = create_engine(
    DB_URL,
    connect_args={"check_same_thread": False}  # needed for SQLite with FastAPI
)

# each request gets its own session — like a transaction wrapper
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class all models inherit from
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session per request, closes after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()