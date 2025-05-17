from flask import Blueprint, jsonify, request
from sqlalchemy.orm import Session
from models.score import UserScore
from db import get_db

scores_bp = Blueprint('scores', __name__)

# Mapeo de niveles por idioma
LEVEL_MAP = {
    'en': ['easy', 'normal', 'hard', 'hardcore'],
    'es': ['facil', 'normal_2', 'dificil', 'diablo']
}

@scores_bp.route('/top_scores', methods=['POST'])
def obtener_top_scores():
    try:
        data = request.get_json()
        idioma = data.get('language', 'en')
        nivel = data.get('level', 'easy')

        # Verificar si el idioma está soportado
        if idioma not in LEVEL_MAP:
            return jsonify({'error': 'Idioma no soportado'}), 400

        # Verificar si el nivel existe en el idioma especificado
        if nivel not in LEVEL_MAP[idioma]:
            return jsonify({'error': f'Nivel {nivel} no válido para el idioma {idioma}'}), 400

        # Obtener el nombre de la columna según el nivel y el idioma
        columna_nombre = nivel  # Usamos el mismo nombre del nivel (simplificado)
        db = next(get_db())
        
        # Verificar si la columna existe en el modelo UserScore
        if not hasattr(UserScore, columna_nombre):
            return jsonify({'error': f'Columna {columna_nombre} no existe en el modelo'}), 500

        columna = getattr(UserScore, columna_nombre)

        # Obtener los 5 mejores puntajes
        top_scores = (
            db.query(UserScore)
            .join(UserScore.user)
            .order_by(columna.desc())
            .limit(5)
            .all()
        )

        # Preparar los datos de respuesta
        response_data = [
            {'user': score.user.name if score.user else 'Desconocido', 'score': getattr(score, columna_nombre, 0)}
            for score in top_scores
        ]

        return jsonify({
            'language': idioma,
            'level': nivel,
            'top_scores': response_data
        })

    except Exception as e:
        return jsonify({'error': f'Ocurrió un error: {str(e)}'}), 500
