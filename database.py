import os
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./clinic.db")

# Render's PostgreSQL URL starts with "postgres://", but SQLAlchemy needs "postgresql://"
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String)
    phone_number = Column(String)
    date = Column(String)
    time = Column(String)
    service = Column(String)
    status = Column(String, default="confirmed")
    created_at = Column(String, default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))

    