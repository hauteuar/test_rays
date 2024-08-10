const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/Users');
const multer = require('multer');

// Configure multer storage
const storage = multer.memoryStorage(); // Store files in memory for simplicity
const upload = multer({ storage: storage });

// Middleware to handle file uploads
const uploadMiddleware = upload.any(); // Use .any() to accept all file types

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const { title, description, assignedBy, courseId, batchId, assignedTo, media, organizationId } = req.body;

        const task = new Task({
            title,
            description,
            assignedBy,
            courseId,
            batchId,
            assignedTo,
            media,
            organizationId,
        });

        await task.save();
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get tasks for a coach in an organization
exports.getTasksForCoach = async (req, res) => {
    try {
        const { coachId, courseId, batchId, organizationId } = req.params;
        const tasks = await Task.find({
            assignedBy: coachId,
            courseId,
            batchId,
            organizationId
        }).populate('assignedTo');
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getTasksForCoachByOrg = async (req, res) => {
    try {
        const { coachId, organizationId } = req.params;

        // Validate that coachId and organizationId are valid ObjectId strings
        if (!coachId || !organizationId) {
            return res.status(400).json({ error: 'Invalid coachId or organizationId' });
        }

        const tasks = await Task.find({
            assignedBy: coachId,
            organizationId: organizationId
        }).populate('assignedTo');
        
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// Get task details for a specific task
exports.getTaskDetails = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId).populate('assignedTo submissions.studentId');
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Submit a task by a student
exports.submitTask = async (req, res) => {
    try {
        const { taskId, studentId, submissionType, submissionContent } = req.body;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const submission = {
            studentId,
            submissionType,
            submissionContent,
            status: 'submitted',
        };

        task.submissions.push(submission);
        task.updatedAt = Date.now();
        await task.save();

        res.status(200).json({ message: 'Task submitted successfully', task });
    } catch (error) {
        console.error('Error submitting task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update progress and status for a submission
exports.updateTaskProgress = async (req, res) => {
    try {
        const { taskId, studentId, progressNotes } = req.body;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const submission = task.submissions.find(sub => sub.studentId.toString() === studentId);
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        submission.progressNotes = progressNotes;
        submission.status = 'completed';
        submission.updatedAt = Date.now();

        await task.save();
        res.status(200).json({ message: 'Task progress updated successfully', task });
    } catch (error) {
        console.error('Error updating task progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, media } = req.body;

        // Find the task by ID
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Update the task fields
        if (title) task.title = title;
        if (description) task.description = description;
        if (media && Object.keys(media).length > 0) {
            task.media = media;
        }

        task.updatedAt = Date.now();

        // Save the updated task
        await task.save();

        res.status(200).json({ message: 'Task updated successfully', task });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getTasksForCoachByOrg = async (req, res) => {
    try {
        const { coachId, organizationId } = req.params;

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(coachId) || !mongoose.Types.ObjectId.isValid(organizationId)) {
            return res.status(400).json({ error: 'Invalid coachId or organizationId' });
        }

        const tasks = await Task.find({
            assignedBy: mongoose.Types.ObjectId(coachId),
            organizationId: mongoose.Types.ObjectId(organizationId)
        }).populate('assignedTo');
        
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Backend - taskController.js

exports.submitTaskByStudent = async (req, res) => {
    uploadMiddleware(req, res, async function (err) {
        if (err) {
            return res.status(500).json({ error: 'File upload error' });
        }

        try {
            const { taskId, studentId, submissionContent } = req.body;

            // Find the task by its ID
            const task = await Task.findById(taskId);

            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            // Ensure that the student is assigned to this task
            if (!task.assignedTo.includes(studentId)) {
                return res.status(403).json({ error: 'Student not assigned to this task' });
            }

            // Find the student's submission or create a new one
            let submission = task.submissions.find(sub => sub.studentId.toString() === studentId);

            if (!submission) {
                submission = {
                    studentId,
                    submissionType: 'text', // default or adjust based on content
                    submissionContent,
                    media: {},
                    status: 'submitted',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                task.submissions.push(submission);
            } else {
                submission.submissionContent = submissionContent;
                submission.status = 'submitted';
                submission.updatedAt = Date.now();
            }

            // Process and add media files to the submission
            if (req.files && req.files.length > 0) {
                req.files.forEach((file, index) => {
                    const mediaKey = `media${index}`;
                    const mediaType = file.mimetype.split('/')[0]; // video, audio, image, etc.
                    const base64Data = file.buffer.toString('base64');
                    const mediaUrl = `data:${file.mimetype};base64,${base64Data}`;
                    
                    submission.media[mediaKey] = mediaUrl;
                    submission.submissionType = mediaType;
                });
            }

            task.updatedAt = Date.now();
            
            // Save the task with the updated submission
            await task.save();
           
            res.status(200).json({ message: 'Task submitted successfully', task });
        } catch (error) {
            console.error('Error submitting task:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};

exports.getTasksForStudent = async (req, res) => {
    try {
        const { studentId, orgId } = req.params;
        const { organizationId } = req.headers;  // Assuming organizationId is sent in headers
        console.log('studentId:', studentId, orgId);
        // Find tasks where the studentId is in the assignedTo array
        const tasks = await Task.find({
            assignedTo: studentId
            //organizationId: orgId
        }).populate('assignedBy').populate('courseId').populate('batchId');

        if (!tasks || tasks.length === 0) {
            return res.status(404).json({ message: 'No tasks found for this student.' });
        }

        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks for student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
