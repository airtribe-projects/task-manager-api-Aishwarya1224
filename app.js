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
    // Set default values for existing tasks
    tasks = tasks.map((task) => ({
        ...task,
        priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
        createdAt: task.createdAt || new Date().toISOString()
    }));
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

    if (!isUpdate) {
        if (task.title === undefined || task.title === null || String(task.title).trim() === '') {
            errors.push('title is required and cannot be empty');
        }
        if (task.description === undefined || task.description === null || String(task.description).trim() === '') {
            errors.push('description is required and cannot be empty');
        }
        if (task.completed === undefined) {
            errors.push('completed is required');
        }
    }

    if (task.title !== undefined && (typeof task.title !== 'string' || task.title.trim() === '')) {
        errors.push('title must be a non-empty string');
    }
    if (task.description !== undefined && (typeof task.description !== 'string' || task.description.trim() === '')) {
        errors.push('description must be a non-empty string');
    }
    if (task.completed !== undefined && typeof task.completed !== 'boolean') {
        errors.push('completed must be a boolean');
    }
    if (!isUpdate && (task.priority === undefined || task.priority === null || String(task.priority).trim() === '')) {
        errors.push('priority is required and cannot be empty');
    }
    if (task.priority !== undefined && !['low', 'medium', 'high'].includes(String(task.priority).toLowerCase())) {
        errors.push('priority must be one of low, medium, high');
    }

    return errors;
}

// GET /tasks - Retrieve all tasks
app.get('/tasks', (req, res) => {
    let results = [...tasks];

    // filter by completed status
    if (req.query.completed !== undefined) {
        const completedQuery = req.query.completed.toLowerCase();
        if (completedQuery !== 'true' && completedQuery !== 'false') {
            return res.status(400).json({ error: 'completed query must be true or false' });
        }
        const boolValue = completedQuery === 'true';
        results = results.filter((task) => task.completed === boolValue);
    }

    // filter by priority
    if (req.query.priority !== undefined) {
        const priorityQuery = req.query.priority.toLowerCase();
        if (!['low', 'medium', 'high'].includes(priorityQuery)) {
            return res.status(400).json({ error: 'priority query must be low, medium or high' });
        }
        results = results.filter((task) => task.priority.toLowerCase() === priorityQuery);
    }

    // sort by creation date
    results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.status(200).json(results);
});

// GET /tasks/priority/:level - Retrieve tasks by priority level
app.get('/tasks/priority/:level', (req, res) => {
    const level = String(req.params.level).toLowerCase();
    if (!['low', 'medium', 'high'].includes(level)) {
        return res.status(400).json({ error: 'Priority level must be low, medium, or high' });
    }
    const result = tasks.filter((t) => t.priority.toLowerCase() === level);
    result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.status(200).json(result);
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
    const { title, description, completed, priority } = req.body;
    
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
        completed,
        priority: String(priority).toLowerCase(),
        createdAt: new Date().toISOString()
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
    
    const { title, description, completed, priority } = req.body;
    
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
        ...(completed !== undefined && { completed }),
        ...(priority !== undefined && { priority: String(priority).toLowerCase() })
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