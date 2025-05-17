
import graphene
#se van a defiir los tipos de datos que se van a usar en las consultas, en este caso el tipo de resultado de la consulta de los scores
class ScoreResultType(graphene.ObjectType):
    user_name = graphene.String()
    score = graphene.Int()
