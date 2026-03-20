const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for tasks
let tasks = [];
let nextId = 1;

// Load initial tasks from task.json
try {
    const taskData = fs.readFileSync(path.join(__dirname, 'task.json'), 'utf8');
    const taskJson = JSON.parse(taskData);
    tasks = taskJson.tasks || [];
    // Set nextId to be one more than the highest existing ID
    if (tasks.length > 0) {
        nextId = Math.max(...tasks.map(task => task.id)) + 1;
    }
} catch (error) {
    console.log('Could not load tasks from task.json, starting with empty task list');
}

// Validation helper function
function validateTask(task, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate && !task.title) {
        errors.push('title is required');
    }
    if (!isUpdate && !task.description) {
        errors.push('description is required');
    }
    if (!isUpdate && task.completed === undefined) {
        errors.push('completed is required');
    }
    
    // Validate types when fields are provided
    if (task.title !== undefined && typeof task.title !== 'string') {
        errors.push('title must be a string');
    }
    if (task.description !== undefined && typeof task.description !== 'string') {
        errors.push('description must be a string');
    }
    if (task.completed !== undefined && typeof task.completed !== 'boolean') {
        errors.push('completed must be a boolean');
    }
    
    return errors;
}

// GET /tasks - Retrieve all tasks
app.get('/tasks', (req, res) => {
    res.status(200).json(tasks);
});

// GET /tasks/:id - Retrieve a specific task by ID
app.get('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(200).json(task);
});

// POST /tasks - Create a new task
app.post('/tasks', (req, res) => {
    const { title, description, completed } = req.body;
    
    // Validate the task
    const errors = validateTask(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ error: 'Invalid task data', details: errors });
    }
    
    // Create new task
    const newTask = {
        id: nextId++,
        title,
        description,
        completed
    };
    
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// PUT /tasks/:id - Update an existing task
app.put('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    const { title, description, completed } = req.body;
    
    // Validate the update data
    const errors = validateTask(req.body, true);
    if (errors.length > 0) {
        return res.status(400).json({ error: 'Invalid task data', details: errors });
    }
    
    // Update task
    tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(completed !== undefined && { completed })
    };
    
    res.status(200).json(tasks[taskIndex]);
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    const deletedTask = tasks.splice(taskIndex, 1)[0];
    res.status(200).json(deletedTask);
});

app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err);
    }
    console.log(`Server is listening on ${port}`);
});

module.exports = app;