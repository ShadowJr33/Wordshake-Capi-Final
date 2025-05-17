from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import Config

# Conexión a la base de datos usando SQLAlchemy para PostgreSQL
DATABASE_URL = f"postgresql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:{Config.DB_PORT}/{Config.DB_NAME}"

# Crear el motor de la base de datos
engine = create_engine(DATABASE_URL, echo=True)  # Usa la URI correcta de PostgreSQL

# Definir la clase base que heredarán todos los modelos
Base = declarative_base()

# Crear la sesión de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Función para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()  # Se obtiene la sesión local de la base de datos
    try:
        yield db
    finally:
        db.close()
