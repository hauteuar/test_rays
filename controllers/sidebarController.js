const Sidebar = require('../models/Sidebar');

// Controller to get sidebar settings for both roles
exports.getAppSettings = async (req, res) => {
    try {
        // Fetch sidebar settings for both roles
        console.log('app request came here');
        const sidebarSettings = await Sidebar.find({ role: { $in: ['student', 'coach'] } });
        
        if (sidebarSettings && sidebarSettings.length > 0) {
            res.json(sidebarSettings);
        } else {
            res.status(404).json({ message: 'Sidebar settings not found for the specified roles' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};


// Controller to initialize the sidebar settings
exports.initializeSidebar = async (req, res) => {
    try {
        // Sidebar details for students
        const studentSidebar = {
            role: 'student',
            sidebar_urls_list: [
                // ... add student sidebar URLs here
            ]
        };

        // Sidebar details for coaches
        const coachSidebar = {
            role: 'coach',
            sidebar_urls_list: [
                // ... add coach sidebar URLs here
            ]
        };

        await Sidebar.create([studentSidebar, coachSidebar]);
        res.status(201).json({ message: 'Sidebar details inserted successfully for both student and coach' });
    } catch (error) {
        res.status(500).json({ message: 'Error inserting sidebar details', error });
    }
};
