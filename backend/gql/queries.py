
from gql.types import ScoreResultType  
from graphene import ObjectType, String, List
from db import SessionLocal
from models.score import UserScore
import graphene
# lo que hace es importar el tipo de resultado que se va a usar en la consulta, en este caso el tipo de resultado de los scores
# de la base de datos, y el tipo de consulta que se va a hacer, en este caso la consulta de los scores que puede pues muatrse o cambiarde de cuantos quieras en 
# este caso lo haremnos de 3 por el momento

class Query(ObjectType):
    top_scores = List(ScoreResultType, language=String(), level=String())

    def resolve_top_scores(self, info, language='en', level='easy'):
        db = SessionLocal()
        try:
            level_map = {
                'en': ['easy', 'normal', 'hard', 'hardcore'],
                'es': ['facil', 'normal_2', 'dificil', 'diablo']
            }
            # aqui enviamos los errores que pueden ocurrir en la consulta, en este caso si el idioma no es soportado o si el nivel no es valido para el idioma
            if language not in level_map:
                raise Exception("Idioma no soportado")

            if level not in level_map[language]:
                raise Exception(f"El nivel '{level}' no es válido para el idioma '{language}'.")

            column = getattr(UserScore, level, None)
            if not column:
                raise Exception(f"Columna no encontrada para el nivel '{level}'.")

            top_scores = db.query(UserScore).order_by(column.desc()).limit(3).all()

            return [
                ScoreResultType(
                    user_name=score.user.name if score.user else "Desconocido",
                    score=getattr(score, level, 0)
                )
                for score in top_scores
            ]
        except Exception as e:
            raise Exception(f"Error en la consulta: {str(e)}")
        finally:
            db.close()
