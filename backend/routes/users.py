from flask import Blueprint, jsonify
from db import get_db
from models.user import User
from sqlalchemy.exc import OperationalError  # Importar el error relacionado con la conexión

users_bp = Blueprint('users', __name__)

@users_bp.route('/usuarios', methods=['GET'])
def get_usuarios():
    """Endpoint para obtener todos los usuarios"""
    try:
        db = next(get_db())  # Intentamos obtener la conexión a la DB
        usuarios = db.query(User).all()  # Si la conexión es exitosa, obtenemos los usuarios
        
        usuarios_list = []
        for usuario in usuarios:
            usuarios_list.append({
                "identificación": usuario.id,
                "nombre": usuario.name,
                "correo electrónico": usuario.email,
                "contraseña": usuario.password,
                "puntaje": usuario.score
            })
        
        return jsonify(usuarios_list), 200

    except OperationalError as e:
        # Captura errores específicos relacionados con la conexión (por ejemplo, sin internet)cesto es del Sprint 4
        return jsonify({"error": "No se pudo conectar a la base de datos. Verifica tu conexión a Internet."}), 503

    except Exception as e:
        # Captura cualquier otro tipo de error que pueda ocurrir en algun momento especifico
        return jsonify({"error": str(e)}), 500
