# auth_repository.py
from db import SessionLocal
from models.user import User


def get_user_by_name(name):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.name == name).first()
        return user
    finally:
        db.close()
