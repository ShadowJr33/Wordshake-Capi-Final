from flask import Blueprint, jsonify
from sqlalchemy.orm import Session
from models.score import UserScore  
from db import get_db  

scores_bp = Blueprint('scores', __name__)

@scores_bp.route('/top_scores', methods=['GET'])
def get_top_scores():
    try:
        db = next(get_db())

        # Trae los mejores puntajes con el usuario incluido
        easy_scores = db.query(UserScore).join(UserScore.user).order_by(UserScore.easy.desc()).limit(3).all()
        normal_scores = db.query(UserScore).join(UserScore.user).order_by(UserScore.normal.desc()).limit(3).all()
        hard_scores = db.query(UserScore).join(UserScore.user).order_by(UserScore.hard.desc()).limit(3).all()
        hardcore_scores = db.query(UserScore).join(UserScore.user).order_by(UserScore.hardcore.desc()).limit(3).all()

        # Crea diccionarios con el nombre del usuario como clave
        return jsonify({
            'easy': {score.user.name: score.easy for score in easy_scores},
            'normal': {score.user.name: score.normal for score in normal_scores},
            'hard': {score.user.name: score.hard for score in hard_scores},
            'hardcore': {score.user.name: score.hardcore for score in hardcore_scores}
        })

    except Exception as e:
        return jsonify({"error": f"No se pudo conectar a la base de datos. Detalles: {str(e)}"}), 500
