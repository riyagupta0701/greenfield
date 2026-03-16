from flask import Flask, request, jsonify

app = Flask(__name__)

# Pattern A: jsonify response
@app.route('/api/users', methods=['GET'])
def list_users():
    return jsonify({"userId": 1, "email": "a@b.com", "displayName": "Alice"})

# Pattern B: direct dict return
@app.route('/api/items', methods=['GET'])
def list_items():
    return {"itemId": 42, "price": 9.99, "inStock": True}

# Pattern A1: request.json.get()
@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    return jsonify({"token": "abc"})

# Pattern A2: request.json bracket access
@app.route('/api/register', methods=['POST'])
def register():
    email = request.json['email']
    role = request.json['role']
    return jsonify({"created": True})

# Pattern C: request.form.get()
@app.route('/api/upload', methods=['POST'])
def upload():
    title = request.form.get('title')
    description = request.form.get('description')
    return jsonify({"uploaded": True})

# Dynamic bracket access — must NOT be tracked (conservative rule)
@app.route('/api/dynamic', methods=['POST'])
def dynamic():
    data = request.json
    key = "someVar"
    val = data[key]  # dynamic — skip
    return jsonify({"ok": True})

# Pattern B (indirect via data = request.json)
@app.route('/api/profile', methods=['PUT'])
def update_profile():
    data = request.json
    first_name = data.get('firstName')
    last_name = data['lastName']
    return jsonify({"updated": True})
