from flask import Blueprint, jsonify, request
from models.score import UserScore
from db import get_db

challenges_bp = Blueprint('challenges', __name__)

LEVELS = {
    'easy': 40,
    'facil': 40,
    'normal': 30,
    'normal_2': 30,
    'hard': 20,
    'dificil': 20,
    'hardcore': 10,
    'diablo': 10
}

def get_challenge_status(user_score):
    status = {}
    for level, threshold in LEVELS.items():
        # Comprobamos si el puntaje es suficiente para completar el desafío
        score = getattr(user_score, level)
        status[level] = {
            'completed': score >= threshold,
            'points_needed': threshold - score if score < threshold else 0
        }
    return status

@challenges_bp.route('/challenge_status', methods=['POST'])
def challenge_status():
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({'error': 'Falta el user_id en el cuerpo de la solicitud'}), 400

        db = next(get_db())
        user_score = db.query(UserScore).filter_by(user_id=user_id).first()

        if not user_score:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        status = get_challenge_status(user_score)

        return jsonify({
            'user_id': user_id,
            'challenge_status': status
        })

    except Exception as e:
        return jsonify({'error': f'Ocurrió un error: {str(e)}'}), 500
