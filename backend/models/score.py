from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from db import Base 

class UserScore(Base):
    __tablename__ = 'user_scores'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  
    easy = Column(Integer, default=0)
    normal = Column(Integer, default=0)
    hard = Column(Integer, default=0)
    hardcore = Column(Integer, default=0)

    # Asegúrate de que el 'back_populates' coincida con la relación en User
    user = relationship("User", back_populates="user_scores")

    def __repr__(self):
        return f"<UserScore(user_id={self.user_id}, easy={self.easy}, normal={self.normal}, hard={self.hard}, hardcore={self.hardcore})>"

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'easy': self.easy,
            'normal': self.normal,
            'hard': self.hard,
            'hardcore': self.hardcore
        }
