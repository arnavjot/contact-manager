const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(express.static('public'));

// Create MySQL connection pool
const db = mysql.createPool({
    host: 'localhost',  // Change this if you're using a different host
    user: 'root',       // Your MySQL username
    password: '1234',  // Your MySQL password
    database: 'contact_manager',  // Database you created
    post:3306
});

// Initialize the database (ensure the table exists and data is added)
fs.readFile('./contacts.sql', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading SQL file:', err.message);
        return;
    }
    
    const queries = data.split(';').map(query => query.trim()).filter(query => query.length > 0);

    queries.forEach((query, index) => {
        db.query(query, (err) => {
            if (err) {
                console.error(`Error executing SQL query at index ${index}:`, err.message);
            } else {
                console.log(`SQL query at index ${index} executed successfully.`);
            }
        });
    });
});

// Routes to manage contacts

// Get all contacts, optionally sorting by name
app.get('/contacts', (req, res) => {
    const order = req.query.order === 'asc' ? 'ASC' : req.query.order === 'desc' ? 'DESC' : '';
    const sql = `SELECT * FROM Contacts ${order ? 'ORDER BY name ' + order : ''}`;
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(results);
        }
    });
});

// Search contacts by name
app.get('/search', (req, res) => {
    const sql = "SELECT * FROM Contacts WHERE name LIKE ?";
    const params = [`%${req.query.name}%`];
    db.query(sql, params, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(results);
        }
    });
});

// Add a new contact
app.post('/contacts', (req, res) => {
    const { name, phone } = req.body;

    const checkPhoneSql = 'SELECT * FROM Contacts WHERE phone = ?';
    db.query(checkPhoneSql, [phone], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (results.length > 0) {
            res.status(400).json({ error: 'Phone number already exists' });
        } else {
            const sql = 'INSERT INTO Contacts (name, phone) VALUES (?, ?)';
            db.query(sql, [name, phone], (err, result) => {
                if (err) {
                    res.status(400).json({ error: err.message });
                } else {
                    res.json({
                        message: "Contact added successfully",
                        data: req.body,
                        id: result.insertId
                    });
                }
            });
        }
    });
});

// Update a contact
app.put('/contacts/:id', (req, res) => {
    const { name, phone } = req.body;
    const id = req.params.id;

    const sql = 'UPDATE Contacts SET name = ?, phone = ? WHERE id = ?';
    db.query(sql, [name, phone, id], (err) => {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ message: "Contact updated successfully" });
        }
    });
});

// Delete a contact
app.delete('/contacts/:id', (req, res) => {
    const sql = 'DELETE FROM Contacts WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ message: "Contact deleted successfully" });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
