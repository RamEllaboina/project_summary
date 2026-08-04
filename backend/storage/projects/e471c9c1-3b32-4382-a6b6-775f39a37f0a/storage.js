/**
 * Storage Module - Handles all localStorage operations
 * Provides data persistence and backup/restore functionality
 */

class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'expenseTrackerData';
        this.BACKUP_KEY = 'expenseTrackerBackup';
        this.SETTINGS_KEY = 'expenseTrackerSettings';
    }

    /**
     * Load transactions from localStorage
     * @returns {Array} Array of transaction objects
     */
    loadTransactions() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const transactions = JSON.parse(stored);
                return Array.isArray(transactions) ? transactions : this.getDefaultTransactions();
            }
            return this.getDefaultTransactions();
        } catch (error) {
            console.error('Error loading transactions:', error);
            return this.getDefaultTransactions();
        }
    }

    /**
     * Save transactions to localStorage
     * @param {Array} transactions - Array of transaction objects
     */
    saveTransactions(transactions) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
            this.createBackup(transactions);
            return true;
        } catch (error) {
            console.error('Error saving transactions:', error);
            return false;
        }
    }

    /**
     * Create automatic backup
     * @param {Array} transactions - Array of transaction objects
     */
    createBackup(transactions) {
        try {
            const backup = {
                data: transactions,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
        } catch (error) {
            console.error('Error creating backup:', error);
        }
    }

    /**
     * Restore from backup
     * @returns {Array|null} Restored transactions or null if no backup
     */
    restoreFromBackup() {
        try {
            const backup = localStorage.getItem(this.BACKUP_KEY);
            if (backup) {
                const parsedBackup = JSON.parse(backup);
                return parsedBackup.data || null;
            }
            return null;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return null;
        }
    }

    /**
     * Get default demo transactions
     * @returns {Array} Array of default transaction objects
     */
    getDefaultTransactions() {
        return [
            { 
                id: Date.now() + 1, 
                title: "Freelance project", 
                amount: 4500, 
                type: "income", 
                category: "Freelance",
                timestamp: Date.now() - 86400000 
            },
            { 
                id: Date.now() + 2, 
                title: "Grocery shopping", 
                amount: 1250, 
                type: "expense", 
                category: "Food",
                timestamp: Date.now() - 172800000 
            },
            { 
                id: Date.now() + 3, 
                title: "Movie night", 
                amount: 680, 
                type: "expense", 
                category: "Entertainment",
                timestamp: Date.now() - 43200000 
            }
        ];
    }

    /**
     * Export data to JSON file
     * @param {Array} transactions - Array of transaction objects
     * @param {Object} settings - App settings
     */
    exportToJSON(transactions, settings = {}) {
        try {
            const exportData = {
                transactions: transactions,
                settings: settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `flowledger-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    }

    /**
     * Export data to CSV
     * @param {Array} transactions - Array of transaction objects
     */
    exportToCSV(transactions) {
        try {
            const headers = ['Date', 'Title', 'Category', 'Type', 'Amount'];
            const rows = transactions.map(tx => [
                new Date(tx.timestamp).toLocaleDateString(),
                tx.title,
                tx.category || 'Uncategorized',
                tx.type,
                tx.amount
            ]);

            let csvContent = headers.join(',') + '\n';
            rows.forEach(row => {
                csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `flowledger-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error exporting CSV:', error);
            return false;
        }
    }

    /**
     * Import data from file
     * @param {File} file - JSON or CSV file to import
     * @returns {Promise<Array>} Imported transactions
     */
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    let importedData = [];

                    if (file.type === 'application/json' || file.name.endsWith('.json')) {
                        const parsed = JSON.parse(content);
                        importedData = parsed.transactions || parsed;
                    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                        importedData = this.parseCSV(content);
                    } else {
                        throw new Error('Unsupported file format');
                    }

                    // Validate and sanitize imported data
                    const validTransactions = importedData.filter(tx => 
                        tx.title && 
                        typeof tx.amount === 'number' && 
                        tx.amount > 0 && 
                        ['income', 'expense'].includes(tx.type)
                    ).map(tx => ({
                        id: Date.now() + Math.random(),
                        title: tx.title,
                        amount: parseFloat(tx.amount),
                        type: tx.type,
                        category: tx.category || 'Uncategorized',
                        timestamp: tx.timestamp || Date.now()
                    }));

                    resolve(validTransactions);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Parse CSV content
     * @param {string} csvContent - CSV string content
     * @returns {Array} Parsed transactions
     */
    parseCSV(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, '').trim());
            const transaction = {};
            
            headers.forEach((header, index) => {
                const value = values[index];
                if (header.toLowerCase().includes('amount')) {
                    transaction.amount = parseFloat(value) || 0;
                } else if (header.toLowerCase().includes('type')) {
                    transaction.type = value.toLowerCase();
                } else if (header.toLowerCase().includes('date')) {
                    transaction.timestamp = new Date(value).getTime() || Date.now();
                } else if (header.toLowerCase().includes('categor')) {
                    transaction.category = value;
                } else {
                    transaction[header] = value;
                }
            });
            
            return transaction;
        });
    }

    /**
     * Clear all data
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.BACKUP_KEY);
            localStorage.removeItem(this.SETTINGS_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * Get storage statistics
     * @returns {Object} Storage usage information
     */
    getStorageStats() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            const backup = localStorage.getItem(this.BACKUP_KEY);
            const settings = localStorage.getItem(this.SETTINGS_KEY);
            
            return {
                dataSize: data ? data.length : 0,
                backupSize: backup ? backup.length : 0,
                settingsSize: settings ? settings.length : 0,
                totalSize: (data?.length || 0) + (backup?.length || 0) + (settings?.length || 0)
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return { dataSize: 0, backupSize: 0, settingsSize: 0, totalSize: 0 };
        }
    }
}

// Export for use in other modules
window.StorageManager = StorageManager;
