from db import get_db
from models.user import User
from sqlalchemy.exc import IntegrityError

def insert_user(name, email, hashed_password):
    db = next(get_db())

    # Verificar si el usuario ya existe
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise ValueError("El usuario ya existe en la base de datos")

    # Crear nuevo usuario
    nuevo_usuario = User(name=name, email=email, password=hashed_password)

    try:
        db.add(nuevo_usuario)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("No se pudo insertar el usuario. El correo ya está registrado.")
