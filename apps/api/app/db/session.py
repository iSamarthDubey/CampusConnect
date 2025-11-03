from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import make_url
from app.core.config import settings

# Normalize DB URL to use psycopg (v3) driver and SSL for Supabase
_db_url = make_url(settings.DATABASE_URL)
if _db_url.drivername == "postgresql":
    _db_url = _db_url.set(drivername="postgresql+psycopg")

# Ensure sslmode=require (Supabase external connections)
query = dict(_db_url.query)
if "sslmode" not in query:
    query["sslmode"] = "require"
_db_url = _db_url.set(query=query)

engine = create_engine(
    _db_url,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

