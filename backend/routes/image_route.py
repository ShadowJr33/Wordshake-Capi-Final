from flask import Blueprint, request, jsonify, send_file
from models.user_image import UserImage
from db import SessionLocal
from sqlalchemy.exc import SQLAlchemyError
from io import BytesIO

image_bp = Blueprint('image', __name__)

@image_bp.route('/upload_image', methods=['POST'])
def upload_image():
    db_session = SessionLocal()
    try:
        user_id = request.form.get('user_id')
        image_file = request.files.get('image')

        if not user_id or not image_file:
            return jsonify({'error': 'Faltan datos'}), 400

        image_data = image_file.read()
        mime_type = image_file.content_type

        # Verificar si ya existe una imagen para el usuario en el que estamos actualmente ejemplo Capi
        existing_image = db_session.query(UserImage).filter_by(user_id=user_id).first()

        if existing_image:
            # Si ya existe, actualiza sus campos osea se va a actualizar la imagen qeu teniamos antes
            existing_image.image_data = image_data
            existing_image.mime_type = mime_type
        else:
            # Si no existe, crea una nueva :D
            new_image = UserImage(
                user_id=user_id,
                image_data=image_data,
                mime_type=mime_type
            )
            db_session.add(new_image)

        db_session.commit()
        return jsonify({'success': True, 'message': 'Imagen guardada correctamente'})

    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

    finally:
        db_session.close()


@image_bp.route('/user_image/<int:user_id>', methods=['GET'])
def get_user_image(user_id):
    db_session = SessionLocal()
    try:
        image_record = db_session.query(UserImage).filter_by(user_id=user_id).first()

        if not image_record:
            return jsonify({'error': 'Imagen no encontrada'}), 404

        return send_file(
            BytesIO(image_record.image_data),
            mimetype=image_record.mime_type,
            as_attachment=False
        )

    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

    finally:
        db_session.close()
