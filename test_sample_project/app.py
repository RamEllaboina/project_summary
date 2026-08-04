#!/usr/bin/env python3
"""
Simple Flask application for testing
"""
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "Hello World"})

@app.route('/api/users')
def get_users():
    # TODO: Implement user fetching from database
    users = [
        {"id": 1, "name": "John Doe"},
        {"id": 2, "name": "Jane Smith"}
    ]
    return jsonify(users)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
