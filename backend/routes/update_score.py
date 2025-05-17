from flask import Blueprint, jsonify, request
from models.score import UserScore
from db import get_db

update_score_bp = Blueprint('update_score', __name__)

LEVEL_MAP = {
    'en': ['easy', 'normal', 'hard', 'hardcore'],
    'es': ['facil', 'normal_2', 'dificil', 'diablo']
}

def get_level_column(language, level):
    if language not in LEVEL_MAP or level not in LEVEL_MAP[language]:
        return None
    return level if hasattr(UserScore, level) else None

def update_user_score(db, user_score, column_name, new_score):
    current = getattr(user_score, column_name)
    if new_score > current:
        setattr(user_score, column_name, new_score)
        db.commit()

def is_in_top_10(db, column, user_id):
    top_scores = db.query(UserScore).order_by(column.desc()).limit(10).all()
    for idx, score in enumerate(top_scores, start=1):
        if score.user_id == user_id:
            return idx
    return None

@update_score_bp.route('/update_score', methods=['PATCH'])
def update_score():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        language = data.get('language')
        level = data.get('level')
        score = data.get('score')

        if not all([user_id, language, level]) or score is None:
            return jsonify({'error': 'Faltan campos requeridos'}), 400

        column_name = get_level_column(language, level)
        if not column_name:
            return jsonify({'error': 'Nivel o idioma no válido'}), 400

        db = next(get_db())
        column = getattr(UserScore, column_name)

        # Buscar si el usuario ya tiene un puntaje registrado
        user_score = db.query(UserScore).filter_by(user_id=user_id).first()

        if not user_score:
            # Si el usuario no tiene puntaje, creamos un nuevo registro con el puntaje
            user_score = UserScore(user_id=user_id)
            db.add(user_score)
            db.commit()

        # Actualizar el puntaje del usuario
        update_user_score(db, user_score, column_name, score)

        # Verificar si está en el top 10
        position = is_in_top_10(db, column, user_id)
        if position:
            return jsonify({'message': f'Estás en el top {position} dentro del top 10.'})
        else:
            return jsonify({'message': 'No estás en el top 10.'})

    except Exception as e:
        return jsonify({'error': f'Ocurrió un error: {str(e)}'}), 500
