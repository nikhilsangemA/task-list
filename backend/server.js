// Backend: server.js (Node.js with Express.js and MySQL)

// First, install dependencies:
// npm init -y
// npm install express mysql2 cors

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = 6000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('API is working ✅🎉');
});


// MySQL connection pool (update credentials as needed)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'TK',
  password: '9814', // Set your MySQL password
  database: 'task_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// // Create database and table if not exists (run this once or use a migration tool)
// async function initializeDatabase() {
//   try {
//     await pool.query(`
//       CREATE DATABASE IF NOT EXISTS task_manager;
//     `);
//     await pool.query(`
//       USE task_manager;
//     `);
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS tasks (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         title VARCHAR(255) NOT NULL,
//         description TEXT,
//         priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
//         status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);
//     console.log('Database initialized');
//   } catch (error) {
//     console.error('Error initializing database:', error);
//   }
// }

// initializeDatabase();

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new task
app.post('/api/tasks', async (req, res) => {
  const { title, description, priority, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, priority, status) VALUES (?, ?, ?, ?)',
      [title, description, priority, status]
    );
    const [newTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update task (full update)
app.put('/api/tasks/:id', async (req, res) => {
  const { title, description, priority, status } = req.body;
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, priority = ?, status = ? WHERE id = ?',
      [title, description, priority, status, id]
    );
    const [updatedTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (updatedTask.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH update task status only
app.patch('/api/tasks/:id', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    const [updatedTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (updatedTask.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port} successfully 🎉`);
});