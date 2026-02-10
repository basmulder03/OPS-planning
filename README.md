# OPS Planning

A browser-based application for managing weekly operations (OPS) schedules. Everything lives in the browser, URL, and localStorage - no backend required!

## Live Demo

🔗 **[Try it now on GitHub Pages](https://basmulder03.github.io/OPS-planning/)**

## Features

- 🌙 **Dark Mode UI** - Beautiful dark theme with blue accents
- 📅 **Weekly View** - Visual calendar showing the current week's assignments
- 🔄 **Repeating Pattern** - Define a pattern that automatically rotates through team members
- ✏️ **Easy Management** - Add, remove, and reorder people in the pattern
- 🔀 **Swap & Reorder** - Use arrows or drag-and-drop to change positions
- 📌 **Specific Assignments** - Override the pattern for specific dates with optional notes
- 🔗 **URL Sharing** - Share your schedule via URL (all data encoded in the URL)
- 💾 **Export/Import** - Save and load schedule data as JSON files
- 📱 **Responsive** - Works on desktop, tablet, and mobile devices

## Usage

Simply open `index.html` in your web browser. No installation or build process required!

### Getting Started

1. **Add People to Pattern**: Enter names in the "Schedule Pattern" section to define who will be on OPS rotation
2. **View Schedule**: The current week view shows who's assigned to each day based on the pattern
3. **Navigate Weeks**: Use Previous/Next/Today buttons to view different weeks
4. **Add Specific Assignments**: Override the pattern for specific dates (e.g., emergency coverage, vacation swaps)
5. **Reorder Pattern**: Use up/down arrows or drag items to change the rotation order
6. **Share**: Click "Copy URL to Share" to share your schedule with the team

### Data Storage

All data is stored in three places:
- **localStorage**: Persists data in your browser
- **URL parameters**: Encoded in the URL for easy sharing
- **Export/Import**: Save as JSON files for backup or transfer

## Technical Details

Built with vanilla HTML, CSS, and JavaScript - no frameworks or dependencies required.

- `index.html` - Main application structure
- `styles.css` - Dark mode styling and responsive layout
- `app.js` - Application logic and state management
