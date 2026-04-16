const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// GET all todos
app.get("/api/todos", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM todos ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a todo
app.post("/api/todos", async (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO todos (title) VALUES (?)",
      [title.trim()]
    );
    const [rows] = await db.query("SELECT * FROM todos WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT toggle completed
app.put("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { completed, title } = req.body;
  try {
    if (title !== undefined) {
      await db.query("UPDATE todos SET title = ? WHERE id = ?", [title, id]);
    }
    if (completed !== undefined) {
      await db.query("UPDATE todos SET completed = ? WHERE id = ?", [
        completed,
        id,
      ]);
    }
    const [rows] = await db.query("SELECT * FROM todos WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a todo
app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM todos WHERE id = ?", [id]);
    res.json({ message: "Todo deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});