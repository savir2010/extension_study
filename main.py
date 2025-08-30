from flask import Flask, request, jsonify
import openai
import os
import json
import dotenv
app = Flask(__name__)
from flask_cors import CORS
CORS(app)
dotenv.load_dotenv()
# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")
from flask_cors import CORS
CORS(app)
# Schema for flashcards (must be object at top level for function call)
flashcard_schema = {
    "type": "object",
    "properties": {
        "flashcards": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "Q": {"type": "string"},
                    "A": {"type": "string"}
                },
                "required": ["Q", "A"]
            }
        }
    },
    "required": ["flashcards"]
}

# Schema for quiz (MCQ)
quiz_schema = {
    "type": "object",
    "properties": {
        "quiz": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "options": {"type": "array", "items": {"type": "string"}},
                    "answer": {"type": "string"}
                },
                "required": ["question", "options", "answer"]
            }
        }
    },
    "required": ["quiz"]
}
@app.route('/check_text', methods=['POST'])
def check_text():
    text = request.get_json().get('text', '')

    response = openai.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": "You are an educational assistant."},
            {"role": "user", "content": f"Check if the following text is related to school subjects, lessons, homework, or academics. Answer only true or false:\n{text}"}
        ]
    )

    message = response.choices[0].message
    answer = message.content.strip().lower() if isinstance(message.content, str) else "false"
    school_related = answer == "true"

    return jsonify({"school_related": school_related})

# Route to generate flashcards
@app.route('/flashcards', methods=['POST'])
def flashcards():
    data = request.get_json()
    text = data.get('text', '')
    count = data.get('count', 5)  # Default to 5 if not provided

    response = openai.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": "You are an educational assistant."},
            {"role": "user", "content": f"Generate {count} flashcards from this text. Return JSON with keys Q and A.\n{text}"}
        ],
        functions=[{
            "name": "generate_flashcards",
            "description": "Create flashcards from the given text",
            "parameters": flashcard_schema
        }],
        function_call={"name": "generate_flashcards"}
    )

    # Use getattr instead of .get()
    message = response.choices[0].message
    func_call = getattr(message, "function_call", None)
    flashcards = []

    if func_call:
        args = getattr(func_call, "arguments", "{}")
        try:
            flashcards = json.loads(args).get("flashcards", [])
        except json.JSONDecodeError:
            flashcards = []

    return jsonify({"flashcards": flashcards})



# Route to generate practice quiz (MCQ)
@app.route('/quiz', methods=['POST'])
def quiz():
    data = request.get_json()
    text = data.get('text', '')
    count = data.get('count', 5)  # Default to 5 if not provided

    response = openai.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": "You are an educational assistant."},
            {"role": "user", "content": f"Generate {count} multiple-choice questions from this text. Each question must have 4 options and indicate the correct answer. Return only JSON with keys: question, options, answer.\n{text}"}
        ]
    )

    message = response.choices[0].message
    quiz = []

    # Parse JSON directly from message.content
    content = getattr(message, "content", "")
    if isinstance(content, str):
        try:
            quiz = json.loads(content)
        except json.JSONDecodeError:
            # Sometimes the model returns extra text before/after JSON
            try:
                start = content.index("[")
                end = content.rindex("]") + 1
                quiz = json.loads(content[start:end])
            except Exception:
                quiz = []

    return jsonify({"quiz": quiz})


@app.route('/ping')
def ping():
    return 'pong', 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=2132)
