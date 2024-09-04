const mongoose = require('mongoose');

// Define schema for sidebar URLs list
const sidebarUrlSchema = new mongoose.Schema({
    id: String,
    type: String,
    app_name: String,
    app_title: String,
    icon: String,
    bgimage: String,
    app_activity: String,
    app_url: String,
    icon_color: String
});

// Define schema for sidebar data
const sidebarSchema = new mongoose.Schema({
    role: String,
    sidebar_urls_list: [sidebarUrlSchema]
});

const Sidebar = mongoose.model('Sidebar', sidebarSchema);

module.exports = Sidebar;
