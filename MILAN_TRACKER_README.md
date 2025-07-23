# IT Milan Tracker Application

A comprehensive web application for tracking IT Milan events with beautiful RSS-inspired saffron theme.

## Features

### 📊 Dashboard with Statistics
- Overview cards showing total Milans, attendance, and new joiners
- Trend analysis and average attendance tracking
- Beautiful gradient design with RSS-inspired saffron theme

### 📝 Milan Entry Form
- Add/edit Milan entries with all required fields
- Participant management with names and types (SS, New, Other, Bala)
- Automatic Soochi (total) calculation
- Support for notes and additional details

### 📋 Data Management
- Responsive table view for desktop and card view for mobile
- Search functionality across Milan names, Valays, and participants
- Filter by Valay (location)
- Export data as JSON for backup/sharing
- Import data functionality

### 🎨 Beautiful Design
- RSS-inspired saffron/orange color scheme
- Smooth animations and transitions
- Responsive design that works on all devices
- Professional shadow effects and gradients

### 💾 Local Storage
- Automatic data persistence in browser storage
- No data loss between sessions
- Export/import capabilities

## Data Tracking

The application tracks:
- Number of Svayam Sevaks participated in each Milan
- Names of participants with their types
- Shaka attendees count
- New SS, Others, and Bala kids joined
- Sankhya (total count) for each Milan out of Milan soochi
- Overall statistics and trends

## Installation & Setup

### Prerequisites
- Java 8 or higher
- Maven 3.x
- Spring Boot

### Running the Application

1. Clone the repository
2. Navigate to the project directory
3. Run the application:
   ```bash
   mvn spring-boot:run
   ```
4. Open your browser and navigate to: `http://localhost:8080/milan-tracker`

## Usage

### Adding a Milan Entry
1. Click the "Add Milan" button in the header
2. Fill in the required fields:
   - Milan Name
   - Valay (Location)
   - Date
3. Add participant counts and names
4. The total Soochi will be automatically calculated
5. Add any additional notes
6. Click "Save Milan"

### Searching and Filtering
- Use the search box to find Milans by name, location, or participant names
- Use the Valay filter dropdown to filter by specific locations
- Search is real-time and case-insensitive

### Data Export/Import
- Click "Export Data" to download your data as a JSON file
- Use the import functionality to restore data from a backup

### Keyboard Shortcuts
- `Ctrl + N`: Add new Milan
- `Escape`: Close modal dialogs

## Technical Details

### Architecture
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Spring Boot with Thymeleaf templates
- **Data Storage**: Browser Local Storage
- **Styling**: Custom CSS with CSS variables for theming

### File Structure
```
src/main/resources/
├── static/
│   ├── css/
│   │   └── milan-tracker.css
│   └── js/
│       └── milan-tracker.js
├── templates/
│   └── milan-tracker.html
└── java/guru/springframework/controllers/
    └── MilanTrackerController.java
```

### Browser Compatibility
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Color Scheme

The application uses an RSS-inspired saffron theme:
- Primary: #FF6B35 (Saffron Orange)
- Secondary: #FFA366 (Light Orange)
- Accent: #FFD700 (Gold)
- Background: #FFF8F5 (Light Cream)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security

- Data is stored locally in the browser
- No sensitive information is transmitted over the network
- Export/import uses standard JSON format

## Future Enhancements

- Server-side data persistence
- Multi-user support with authentication
- Advanced analytics and reporting
- Mobile app version
- Integration with external calendar systems

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository.