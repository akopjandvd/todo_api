import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker,declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./todo.db")  # Használja a környezeti változót

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
metadata = MetaData()
