from sqlalchemy import Column, Integer, ForeignKey, LargeBinary, String
from db import Base
from sqlalchemy.orm import relationship

class UserImage(Base):
    __tablename__ = 'user_images'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    image_data = Column(LargeBinary, nullable=False)
    mime_type = Column(String, nullable=False)

    user = relationship("User", back_populates="image")
