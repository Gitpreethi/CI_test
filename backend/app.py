"""Study Planner API backed by SQLite."""
from pathlib import Path
import sqlite3

from flask import Flask, jsonify, request

app = Flask(__name__)
DATABASE = Path(__file__).with_name("study_planner.db")


@app.after_request
def allow_local_frontend(response):
    origin = request.headers.get("Origin", "")
    if origin in {"http://localhost:5173", "http://127.0.0.1:5173"}:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Vary"] = "Origin"
    return response


def connect():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db


def initialize_database():
    with connect() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            topic TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            duration INTEGER NOT NULL CHECK(duration >= 5 AND duration <= 600),
            completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1))
        )""")


def as_task(row):
    task = dict(row)
    task["completed"] = bool(task["completed"])
    return task


def validation_error(data, partial=False):
    allowed = {"subject", "topic", "date", "time", "duration", "completed"}
    unknown = set(data) - allowed
    if unknown:
        return f"Unknown field: {sorted(unknown)[0]}"
    required = {"subject", "topic", "date", "time", "duration"}
    if not partial:
        missing = required - data.keys()
        if missing:
            return f"Missing required field: {sorted(missing)[0]}"
    for key in ("subject", "topic", "date", "time"):
        if key in data and (not isinstance(data[key], str) or not data[key].strip()):
            return f"{key.capitalize()} must be a non-empty string."
    if "duration" in data:
        try:
            duration = int(data["duration"])
            if duration < 5 or duration > 600:
                return "Duration must be between 5 and 600 minutes."
        except (ValueError, TypeError):
            return "Duration must be a whole number of minutes."
    if "completed" in data and not isinstance(data["completed"], bool):
        return "Completed must be true or false."
    if "date" in data:
        from datetime import date
        try:
            date.fromisoformat(data["date"])
        except ValueError:
            return "Date must use YYYY-MM-DD format."
    if "time" in data:
        from datetime import datetime
        try:
            datetime.strptime(data["time"], "%H:%M")
        except ValueError:
            return "Time must use HH:MM format."
    return None


@app.get("/api/tasks")
def list_tasks():
    with connect() as db:
        rows = db.execute("SELECT * FROM tasks ORDER BY date, time, id").fetchall()
    return jsonify([as_task(row) for row in rows])


@app.post("/api/tasks")
def create_task():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Request body must be a JSON object."), 400
    error = validation_error(data)
    if error:
        return jsonify(error=error), 400
    values = (data["subject"].strip(), data["topic"].strip(), data["date"], data["time"], int(data["duration"]), int(data.get("completed", False)))
    with connect() as db:
        cursor = db.execute("INSERT INTO tasks(subject, topic, date, time, duration, completed) VALUES (?, ?, ?, ?, ?, ?)", values)
        row = db.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(as_task(row)), 201


@app.put("/api/tasks/<int:task_id>")
def update_task(task_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not data:
        return jsonify(error="Request body must be a non-empty JSON object."), 400
    error = validation_error(data, partial=True)
    if error:
        return jsonify(error=error), 400
    fields = dict(data)
    if "duration" in fields:
        fields["duration"] = int(fields["duration"])
    if "completed" in fields:
        fields["completed"] = int(fields["completed"])
    columns = ", ".join(f"{column} = ?" for column in fields)
    with connect() as db:
        cursor = db.execute(f"UPDATE tasks SET {columns} WHERE id = ?", (*fields.values(), task_id))
        if cursor.rowcount == 0:
            return jsonify(error="Task not found."), 404
        row = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return jsonify(as_task(row))


@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id):
    with connect() as db:
        cursor = db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    if cursor.rowcount == 0:
        return jsonify(error="Task not found."), 404
    return jsonify(message="Task deleted."), 200


initialize_database()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
