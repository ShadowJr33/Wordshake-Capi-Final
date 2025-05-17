from flask import Blueprint, jsonify, request
from models.score import UserScore
from models.user import User  
from db import get_db

delete_user_bp = Blueprint('delete_user', __name__)

@delete_user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        confirmacion = request.args.get('confirmacion')

        if confirmacion != 'no_acabo':
            return jsonify({'error': 'Confirmación inválida o no proporcionada'}), 400

        db = next(get_db())

        # Borrar puntajes primero
        user_score = db.query(UserScore).filter_by(user_id=user_id).first()
        if user_score:
            db.delete(user_score)

        # Borrar usuario después
        user = db.query(User).filter_by(id=user_id).first()
        if user:
            db.delete(user)
            db.commit()
            return jsonify({'message': f'Usuario {user_id} y su puntaje han sido eliminados.'}), 200

        return jsonify({'error': 'Usuario no encontrado'}), 404

    except Exception as e:
        return jsonify({'error': f'Ocurrió un error: {str(e)}'}), 500
