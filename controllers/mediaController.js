const Media = require('../models/Media'); // Import the Media model
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });
const uploadMiddleware = upload.array('mediaFiles', 10);

exports.uploadNewMedia = async (req, res) => {
    uploadMiddleware(req, res, async function (err) {
        if (err) {
            return res.status(500).json({ error: 'File upload error' });
        }

        try {
            const { studentId, organizationId, taskId } = req.body;

            // Save each file as a new media document
            const mediaFiles = req.files.map(file => ({
                studentId,
                organizationId,
                taskId: taskId || null, // Optional taskId
                mediaType: file.mimetype.split('/')[0],
                mediaPath: `/uploads/${file.filename}`
            }));

            const mediaDocs = await Media.insertMany(mediaFiles);

            // Optionally, link the media to a task
            if (taskId) {
                await Task.findByIdAndUpdate(taskId, { $push: { media: { $each: mediaDocs.map(doc => doc._id) } } });
            }

            res.status(200).json({ message: 'Media uploaded successfully', mediaDocs });
        } catch (error) {
            console.error('Error uploading media:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};
exports.getStudentMedia = async (req, res) => {
    try {
        const { studentId, organizationId } = req.params;

        const media = await Media.find({
            studentId,
            organizationId
        });

        res.status(200).json(media);
    } catch (error) {
        console.error('Error fetching student media:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
