from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from sqlalchemy.exc import OperationalError
from repositories.auth_repository import get_user_by_name

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    usuario = data.get("name")
    contrasenia = data.get("password")

    if not usuario or not contrasenia:
        return jsonify({"error": "Faltan datos"}), 400

    try:
        user = get_user_by_name(usuario)
        
        if user:
            if check_password_hash(user.password, contrasenia):
                # Devuelve el ID del usuario en la respuesta
                return jsonify({
                    "success": True,
                    "user_id": user.id  # Asegúrate de que esto coincida con tu modelo
                })
        
        return jsonify({"success": False})
    
    except OperationalError:
        return jsonify({"error": "No se pudo conectar a la base de datos. Verifica tu conexión a Internet o el servidor de base de datos."}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500