from flask import Flask, request, jsonify
from flask_cors import CORS
from routes.users import users_bp  
from routes.auth import auth_bp  
from routes.check import check_word  
from routes.insert import insert_bd
from routes.scores import scores_bp
from gql.schema import schema  # Tu esquema GraphQL
import graphene

app = Flask(__name__)
CORS(app)

# Rutas REST
app.register_blueprint(users_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(check_word, url_prefix='/api')  
app.register_blueprint(insert_bd, url_prefix='/api')
app.register_blueprint(scores_bp, url_prefix='/api')

# Endpoint manual de GraphQL (sin flask-graphql)

@app.route('/graphql', methods=['POST'])
def graphql_server():
    data = request.get_json()
    result = schema.execute(data.get("query"))
    return jsonify({
        "data": result.data,
        "errors": [str(e) for e in result.errors] if result.errors else None
    })

if __name__ == '__main__':
    app.run(debug=True)
