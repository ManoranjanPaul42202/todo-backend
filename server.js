const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// GET all todos (optionally filter by date)
app.get("/api/todos", async (req, res) => {
  try {
    const { date } = req.query;
    let query = "SELECT * FROM todos ORDER BY FIELD(priority,'high','medium','low'), created_at DESC";
    let params = [];

    if (date) {
      query = "SELECT * FROM todos WHERE due_date = ? ORDER BY FIELD(priority,'high','medium','low'), created_at DESC";
      params = [date];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET distinct dates that have todos
app.get("/api/todos/dates", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT due_date FROM todos ORDER BY due_date ASC"
    );
    res.json(rows.map((r) => r.due_date));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a todo
app.post("/api/todos", async (req, res) => {
  const { title, priority = "medium", due_date } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!due_date) {
    return res.status(400).json({ error: "Due date is required" });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO todos (title, priority, due_date) VALUES (?, ?, ?)",
      [title.trim(), priority, due_date]
    );
    const [rows] = await db.query("SELECT * FROM todos WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update a todo
app.put("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { completed, title, priority, due_date } = req.body;
  try {
    const fields = [];
    const values = [];

    if (title !== undefined)     { fields.push("title = ?");     values.push(title); }
    if (completed !== undefined) { fields.push("completed = ?"); values.push(completed); }
    if (priority !== undefined)  { fields.push("priority = ?");  values.push(priority); }
    if (due_date !== undefined)  { fields.push("due_date = ?");  values.push(due_date); }

    if (fields.length === 0) return res.status(400).json({ error: "Nothing to update" });

    values.push(id);
    await db.query(`UPDATE todos SET ${fields.join(", ")} WHERE id = ?`, values);

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