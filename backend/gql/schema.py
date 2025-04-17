
import graphene
from gql.queries import Query  
from gql.types import ScoreResultType  

# Aqui basiamente lo que se hace es crear el Squema de GraphQL, que es el que se va a usar para las consultas 
schema = graphene.Schema(query=Query)
