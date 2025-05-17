from sqlalchemy import Column, Integer, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from db import Base

class UserScore(Base):
    __tablename__ = 'user_scores'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Columnas en ingles
    easy = Column(Integer, default=0)
    normal = Column(Integer, default=0)
    hard = Column(Integer, default=0)
    hardcore = Column(Integer, default=0)

    # Columnas en espaniol
    facil = Column(Integer, default=0)
    normal_2 = Column(Integer, default=0)
    dificil = Column(Integer, default=0)
    diablo = Column(Integer, default=0)

    # Relación con el modelo User
    user = relationship("User", back_populates="user_scores")

    def __repr__(self):
        return (
            f"<UserScore(user_id={self.user_id}, easy={self.easy}, normal={self.normal}, "
            f"hard={self.hard}, hardcore={self.hardcore}, facil={self.facil}, "
            f"normal_2={self.normal_2}, dificil={self.dificil}, diablo={self.diablo})>"
        )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'easy': self.easy,
            'normal': self.normal,
            'hard': self.hard,
            'hardcore': self.hardcore,
            'facil': self.facil,
            'normal_2': self.normal_2,
            'dificil': self.dificil,
            'diablo': self.diablo
        }
