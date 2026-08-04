# 💰 FlowLedger - Advanced Personal Finance Tracker

A sophisticated, modular expense tracking application built with vanilla JavaScript, featuring advanced analytics, data export, and a beautiful responsive design.

## ✨ Features

### 🎯 Core Functionality
- **Add/Edit/Delete Transactions** - Full CRUD operations with validation
- **Smart Categories** - Organize transactions by income/expense categories
- **Real-time Search** - Find transactions instantly
- **Advanced Filtering** - Filter by type, category, date range, and amount
- **Local Storage** - Persistent data storage with automatic backups

### 📊 Analytics & Insights
- **Financial Summary** - Real-time balance, income, and expense tracking
- **Category Analytics** - Visual breakdown of spending by category
- **Monthly Trends** - Track income and expenses over time
- **Statistics** - Average amounts, transaction counts, and more

### 💾 Data Management
- **Export to JSON** - Complete data export with metadata
- **Export to CSV** - Spreadsheet-compatible export
- **Import Data** - Import from JSON or CSV files
- **Backup System** - Automatic backup creation and restore

### 🎨 User Experience
- **Modern UI** - Beautiful, responsive design with smooth animations
- **Dark Mode Support** - Easy on the eyes in any lighting
- **Keyboard Shortcuts** - Power user productivity features
- **Toast Notifications** - Non-intrusive feedback system
- **Mobile Responsive** - Works perfectly on all devices

## 🏗️ Architecture

### Modular Structure
```
expense_tracker/
├── index.html              # Main HTML file
├── styles.css              # Advanced CSS with animations
├── js/
│   ├── storage.js          # Data persistence and export
│   ├── transactions.js     # Transaction logic and calculations
│   ├── ui.js              # UI management and interactions
│   └── app.js             # Main application controller
├── README.md               # This file
└── .vscode/
    └── launch.json         # VS Code debugging config
```

### Module Responsibilities

#### 📦 Storage Module (`js/storage.js`)
- LocalStorage operations
- Data export/import (JSON/CSV)
- Backup creation and restore
- Storage statistics and management

#### 💳 Transactions Module (`js/transactions.js`)
- Transaction CRUD operations
- Financial calculations
- Filtering and searching
- Category management
- Statistics and analytics

#### 🎨 UI Module (`js/ui.js`)
- DOM manipulation and rendering
- Event handling
- Modal management
- Toast notifications
- Form validation feedback

#### 🚀 App Module (`js/app.js`)
- Application initialization
- Error handling
- Keyboard shortcuts
- Module coordination
- Global configuration

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation
1. Clone or download the project
2. Open `index.html` in your browser
3. Start tracking your finances!

### Development Setup
For local development with live reload:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server)
npx http-server

# Using VS Code Live Server extension
Right-click index.html → Open with Live Server
```

## 📱 Usage Guide

### Adding Transactions
1. Fill in the transaction form
2. Select type (Income/Expense)
3. Choose a category
4. Add optional description
5. Click "Add transaction" or press Enter

### Managing Transactions
- **Edit**: Click the ✏️ icon on any transaction
- **Delete**: Click the 🗑️ icon (with confirmation)
- **Search**: Use the search bar to find transactions
- **Filter**: Use filter buttons to show specific types

### Data Export/Import
- **Export JSON**: Complete data with metadata
- **Export CSV**: For spreadsheet applications
- **Import**: Load data from JSON or CSV files

### Keyboard Shortcuts
- `Ctrl/Cmd + N` - Focus on new transaction form
- `Ctrl/Cmd + E` - Export data as JSON
- `Ctrl/Cmd + I` - Import data
- `Ctrl/Cmd + /` - Show keyboard shortcuts help
- `Escape` - Close modal/dialog
- `Enter` - Submit form (when in input field)

## 🎨 Customization

### Adding Categories
Categories are defined in the `transactions.js` module:
```javascript
categories = {
    income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other']
};
```

### Theme Customization
CSS variables in `styles.css` control the appearance:
```css
:root {
    --primary-color: #1f4e6e;
    --success-color: #2b7a4b;
    --danger-color: #c23b22;
    /* ... more variables */
}
```

### Currency Format
Currency formatting is handled in the UI module:
```javascript
formatCurrency(amount) {
    return `₹${Math.abs(amount).toFixed(2)}`;
}
```

## 🔧 Technical Details

### Data Structure
Each transaction follows this structure:
```javascript
{
    id: 1234567890,              // Unique timestamp-based ID
    title: "Grocery shopping",   // Transaction title
    amount: 1250.00,            // Positive amount
    type: "expense",            // "income" or "expense"
    category: "Food",           // Category name
    description: "Weekly groceries", // Optional description
    timestamp: 1234567890000,   // Creation timestamp
    createdAt: 1234567890000,  // Creation timestamp
    updatedAt: 1234567890000   // Last update timestamp
}
```

### Storage Format
Data is stored in localStorage as JSON:
```javascript
localStorage.setItem('expenseTrackerData', JSON.stringify(transactions));
```

### Browser Compatibility
- **Modern Browsers**: Full support
- **IE 11**: Basic functionality (no animations)
- **Mobile**: Optimized for touch devices

## 🐛 Troubleshooting

### Common Issues

#### Data Not Saving
- Check browser localStorage is enabled
- Clear browser cache and try again
- Ensure no browser extensions are blocking storage

#### Charts Not Displaying
- Chart functionality is placeholder (ready for Chart.js integration)
- Add Chart.js library for full chart functionality

#### Import Failures
- Ensure file format is correct (JSON/CSV)
- Check file encoding (UTF-8 recommended)
- Validate data structure matches expected format

### Debug Mode
Enable console logging by opening browser developer tools and checking the Console tab for detailed error messages.

## 🚀 Future Enhancements

### Planned Features
- [ ] Chart.js integration for visual analytics
- [ ] Recurring transactions
- [ ] Budget tracking and alerts
- [ ] Multi-currency support
- [ ] Cloud sync integration
- [ ] Advanced reporting
- [ ] Receipt image upload
- [ ] Bank account integration

### Performance Optimizations
- [ ] Virtual scrolling for large datasets
- [ ] IndexedDB for better performance
- [ ] Service worker for offline support
- [ ] Data compression

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for bugs and feature requests.

### Development Guidelines
1. Follow the existing modular structure
2. Use semantic HTML5 elements
3. Write clean, documented JavaScript
4. Ensure mobile responsiveness
5. Test thoroughly before submitting

## 📞 Support

For support, questions, or feedback:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the documentation

---

**FlowLedger** - Track your finances with style and precision! 💰✨
