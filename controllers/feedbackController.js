const multer = require('multer');
const Feedback = require('../models/Feedback');
// Set up multer for file uploads
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 50 }, // 50MB limit per file
}).any(); // Accept any file fields

exports.createFeedback = [
    upload,
    async (req, res) => {
     
        try {
            const { courseId, studentId, coachId, feedbackCycle, rating, text, taskId, organizationId } = req.body;
            console.log(req.body);  // Log the body data
            console.log(req.files); // Log the uploaded files
            const feedback = new Feedback({
                courseId,
                studentId,
                coachId,
                taskId,
                organizationId,
                feedbackCycle,
                rating,
                text,
                audio: req.files['audio'] ? { data: req.files['audio'][0].buffer, contentType: req.files['audio'][0].mimetype } : undefined,
                video: req.files['video'] ? { data: req.files['video'][0].buffer, contentType: req.files['video'][0].mimetype } : undefined,
                image: req.files['image'] ? req.files['image'].map(file => ({ data: file.buffer, contentType: file.mimetype })) : undefined,
            });

            await feedback.save();
            res.status(201).json({ message: 'Feedback created successfully', feedback });
        } catch (error) {
            console.error('Error creating feedback:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
];

exports.getFeedbackByCourseAndStudent = async (req, res) => {
    try {
        const { courseId, studentId } = req.params;
        const feedback = await Feedback.find({ courseId, studentId }).populate('coachId');

        if (!feedback || feedback.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Convert the binary data to Base64 and include it in the response
        const feedbackWithMedia = feedback.map(fb => {
            // Check if the audio exists and has data
            const audioUrl = fb.audio && fb.audio.data ? 
                `data:${fb.audio.contentType};base64,${fb.audio.data.toString('base64')}` : null;

            // Check if the video exists and has data
            const videoUrl = fb.video && fb.video.data ? 
                `data:${fb.video.contentType};base64,${fb.video.data.toString('base64')}` : null;

            // Check if images exist and have data
            const imageUrls = fb.image && fb.image.length > 0 ? 
                fb.image.map(img => img.data ? `data:${img.contentType};base64,${img.data.toString('base64')}` : null) : [];

            return {
                ...fb._doc,
                audioUrl,
                videoUrl,
                imageUrls
            };
        });

        res.status(200).json(feedbackWithMedia);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
