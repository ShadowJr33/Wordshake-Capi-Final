from flask import Blueprint, request, jsonify
from spellchecker import SpellChecker

check_word = Blueprint('check_word', __name__)

# Aquí basicamente cree un diccioanrio para asi poder elegir si quiere espaniol o ingles como lenguaje pa buscar la palabra
spell_checkers = {
    "es": SpellChecker(language='es'),  
    "en": SpellChecker(language='en')   
}

# Calcula el score de la palabra basado en su longitud, de dos letras sera un punto y asi sucesivamnete hasta 10 letras
def calcular_score(palabra):
    longitud = len(palabra)
    return min(longitud - 1, 10)  

@check_word.route('/check', methods=['POST'])
def check_word_route():  
    data = request.get_json()
    palabra = data.get("word")
    idioma = data.get("language", "es")  

    if not palabra:
        return jsonify({"error": "Falta la palabra"}), 400

    if idioma not in spell_checkers:
        return jsonify({"error": "Idioma no soportado"}), 400

    # Seleccionar el corrector ortográfico del idioma elegido, esto se hacea traves del diccionario que se creo antes
    spell = spell_checkers[idioma]

    if palabra in spell:
        score = calcular_score(palabra)
        return jsonify({"score": score})  
    else:
        return jsonify({"error": "Palabra no encontrada"}), 400
