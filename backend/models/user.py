from sqlalchemy import Column, Integer, String
from db import Base  
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)  
    name = Column(String, index=True)  
    email = Column(String, unique=True, index=True) 
    password = Column(String)  
    score = Column(Integer)  

    # Agrega esta relación para vincularlo con UserScore
    user_scores = relationship("UserScore", back_populates="user")

    def __repr__(self):
        return f"<User(name={self.name}, email={self.email})>"
    
    image = relationship("UserImage", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'score': self.score
        }
