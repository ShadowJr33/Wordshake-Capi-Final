from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import OperationalError
from repositories.insert_repository import insert_user

insert_bd = Blueprint('insert_bd', __name__)

@insert_bd.route('/insert', methods=['POST'])
def insert_user1():
    data = request.get_json()

    if not data or not all(key in data for key in ("name", "email", "password")):
        return jsonify({"error": "Faltan datos requeridos"}), 400

    try:
        hashed_password = generate_password_hash(data["password"])
        insert_user(data["name"], data["email"], hashed_password)
        return jsonify({"message": "Usuario insertado exitosamente"}), 201

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    except OperationalError:
        return jsonify({"error": "No se pudo conectar a la base de datos. Verifica tu conexión a Internet o el servidor de base de datos."}), 503

    except Exception as e:
        return jsonify({"error": "Error interno del servidor: " + str(e)}), 500
