/**
 * Transactions Module - Handles transaction logic and calculations
 * Provides CRUD operations and financial calculations
 */

class TransactionManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.transactions = [];
        this.categories = {
            income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'],
            expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other']
        };
    }

    /**
     * Initialize transaction manager
     */
    init() {
        this.transactions = this.storage.loadTransactions();
    }

    /**
     * Get all transactions
     * @returns {Array} Array of transaction objects
     */
    getAllTransactions() {
        return [...this.transactions];
    }

    /**
     * Add new transaction
     * @param {Object} transactionData - Transaction data
     * @returns {Object} Created transaction or null if validation fails
     */
    addTransaction(transactionData) {
        const validation = this.validateTransaction(transactionData);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        const transaction = {
            id: Date.now() + Math.random(),
            title: transactionData.title.trim(),
            amount: parseFloat(transactionData.amount),
            type: transactionData.type,
            category: transactionData.category || 'Uncategorized',
            description: transactionData.description || '',
            timestamp: Date.now(),
            createdAt: Date.now()
        };

        this.transactions.push(transaction);
        this.save();
        return transaction;
    }

    /**
     * Update existing transaction
     * @param {number} id - Transaction ID
     * @param {Object} updateData - Updated transaction data
     * @returns {Object|null} Updated transaction or null if not found
     */
    updateTransaction(id, updateData) {
        const index = this.transactions.findIndex(tx => tx.id === id);
        if (index === -1) return null;

        const validation = this.validateTransaction(updateData);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        this.transactions[index] = {
            ...this.transactions[index],
            title: updateData.title.trim(),
            amount: parseFloat(updateData.amount),
            type: updateData.type,
            category: updateData.category || 'Uncategorized',
            description: updateData.description || '',
            updatedAt: Date.now()
        };

        this.save();
        return this.transactions[index];
    }

    /**
     * Delete transaction by ID
     * @param {number} id - Transaction ID
     * @returns {boolean} True if deleted, false if not found
     */
    deleteTransaction(id) {
        const initialLength = this.transactions.length;
        this.transactions = this.transactions.filter(tx => tx.id !== id);
        
        if (this.transactions.length < initialLength) {
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Get transaction by ID
     * @param {number} id - Transaction ID
     * @returns {Object|null} Transaction object or null if not found
     */
    getTransactionById(id) {
        return this.transactions.find(tx => tx.id === id) || null;
    }

    /**
     * Filter transactions
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered transactions
     */
    filterTransactions(filters = {}) {
        let filtered = [...this.transactions];

        // Filter by type
        if (filters.type && filters.type !== 'all') {
            filtered = filtered.filter(tx => tx.type === filters.type);
        }

        // Filter by category
        if (filters.category) {
            filtered = filtered.filter(tx => tx.category === filters.category);
        }

        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate).getTime();
            filtered = filtered.filter(tx => tx.timestamp >= startDate);
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate).getTime();
            filtered = filtered.filter(tx => tx.timestamp <= endDate);
        }

        // Search by title or description
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(tx => 
                tx.title.toLowerCase().includes(searchTerm) ||
                (tx.description && tx.description.toLowerCase().includes(searchTerm)) ||
                tx.category.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by amount range
        if (filters.minAmount !== undefined) {
            filtered = filtered.filter(tx => tx.amount >= filters.minAmount);
        }

        if (filters.maxAmount !== undefined) {
            filtered = filtered.filter(tx => tx.amount <= filters.maxAmount);
        }

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => b.timestamp - a.timestamp);

        return filtered;
    }

    /**
     * Calculate financial summary
     * @param {Array} transactions - Optional transaction array (uses all if not provided)
     * @returns {Object} Financial summary
     */
    calculateSummary(transactions = this.transactions) {
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryTotals = {};
        const monthlyData = {};

        transactions.forEach(tx => {
            if (tx.type === 'income') {
                totalIncome += tx.amount;
            } else if (tx.type === 'expense') {
                totalExpense += tx.amount;
            }

            // Category totals
            const categoryKey = `${tx.type}-${tx.category}`;
            categoryTotals[categoryKey] = (categoryTotals[categoryKey] || 0) + tx.amount;

            // Monthly data
            const monthKey = new Date(tx.timestamp).toISOString().slice(0, 7); // YYYY-MM
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expense: 0 };
            }
            if (tx.type === 'income') {
                monthlyData[monthKey].income += tx.amount;
            } else {
                monthlyData[monthKey].expense += tx.amount;
            }
        });

        const balance = totalIncome - totalExpense;

        return {
            totalIncome,
            totalExpense,
            balance,
            transactionCount: transactions.length,
            categoryTotals,
            monthlyData,
            averageIncome: transactions.filter(tx => tx.type === 'income').length > 0 
                ? totalIncome / transactions.filter(tx => tx.type === 'income').length 
                : 0,
            averageExpense: transactions.filter(tx => tx.type === 'expense').length > 0 
                ? totalExpense / transactions.filter(tx => tx.type === 'expense').length 
                : 0
        };
    }

    /**
     * Get transaction statistics
     * @returns {Object} Various statistics
     */
    getStatistics() {
        const summary = this.calculateSummary();
        const transactionsByType = {
            income: this.transactions.filter(tx => tx.type === 'income'),
            expense: this.transactions.filter(tx => tx.type === 'expense')
        };

        const last30Days = this.filterTransactions({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        });

        const last30DaysSummary = this.calculateSummary(last30Days);

        return {
            ...summary,
            incomeCount: transactionsByType.income.length,
            expenseCount: transactionsByType.expense.length,
            last30Days: last30DaysSummary,
            topCategories: this.getTopCategories(),
            recentTransactions: this.getRecentTransactions(5)
        };
    }

    /**
     * Get top categories by amount
     * @param {number} limit - Number of categories to return
     * @returns {Array} Top categories
     */
    getTopCategories(limit = 5) {
        const categoryTotals = {};
        
        this.transactions.forEach(tx => {
            if (!categoryTotals[tx.category]) {
                categoryTotals[tx.category] = { amount: 0, count: 0, type: tx.type };
            }
            categoryTotals[tx.category].amount += tx.amount;
            categoryTotals[tx.category].count++;
        });

        return Object.entries(categoryTotals)
            .map(([category, data]) => ({ category, ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);
    }

    /**
     * Get recent transactions
     * @param {number} limit - Number of transactions to return
     * @returns {Array} Recent transactions
     */
    getRecentTransactions(limit = 10) {
        return [...this.transactions]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Get available categories
     * @param {string} type - 'income', 'expense', or 'all'
     * @returns {Array} Available categories
     */
    getCategories(type = 'all') {
        if (type === 'all') {
            return {
                income: this.categories.income,
                expense: this.categories.expense
            };
        }
        return this.categories[type] || [];
    }

    /**
     * Add custom category
     * @param {string} category - Category name
     * @param {string} type - 'income' or 'expense'
     */
    addCategory(category, type) {
        if (!this.categories[type]) return false;
        
        category = category.trim();
        if (!category || this.categories[type].includes(category)) return false;

        this.categories[type].push(category);
        return true;
    }

    /**
     * Validate transaction data
     * @param {Object} transactionData - Transaction data to validate
     * @returns {Object} Validation result
     */
    validateTransaction(transactionData) {
        const errors = [];

        if (!transactionData.title || typeof transactionData.title !== 'string') {
            errors.push('Title is required and must be a string');
        }

        if (!transactionData.amount || isNaN(transactionData.amount) || parseFloat(transactionData.amount) <= 0) {
            errors.push('Amount must be a positive number');
        }

        if (!transactionData.type || !['income', 'expense'].includes(transactionData.type)) {
            errors.push('Type must be either "income" or "expense"');
        }

        if (transactionData.title && transactionData.title.length > 100) {
            errors.push('Title must be less than 100 characters');
        }

        if (transactionData.amount && parseFloat(transactionData.amount) > 999999999) {
            errors.push('Amount is too large');
        }

        return {
            isValid: errors.length === 0,
            error: errors.join(', ')
        };
    }

    /**
     * Save transactions to storage
     */
    save() {
        this.storage.saveTransactions(this.transactions);
    }

    /**
     * Import transactions
     * @param {Array} importedTransactions - Transactions to import
     * @param {boolean} merge - Whether to merge with existing or replace
     */
    importTransactions(importedTransactions, merge = true) {
        const validTransactions = importedTransactions.filter(tx => {
            const validation = this.validateTransaction(tx);
            return validation.isValid;
        });

        if (merge) {
            this.transactions = [...this.transactions, ...validTransactions];
        } else {
            this.transactions = validTransactions;
        }

        this.save();
        return validTransactions.length;
    }

    /**
     * Get monthly trend data
     * @param {number} months - Number of months to include
     * @returns {Array} Monthly trend data
     */
    getMonthlyTrend(months = 6) {
        const monthlyData = {};
        const now = new Date();
        
        // Initialize months
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = date.toISOString().slice(0, 7);
            monthlyData[key] = { income: 0, expense: 0, balance: 0 };
        }

        // Populate with transaction data
        this.transactions.forEach(tx => {
            const monthKey = new Date(tx.timestamp).toISOString().slice(0, 7);
            if (monthlyData[monthKey]) {
                if (tx.type === 'income') {
                    monthlyData[monthKey].income += tx.amount;
                } else {
                    monthlyData[monthKey].expense += tx.amount;
                }
                monthlyData[monthKey].balance = monthlyData[monthKey].income - monthlyData[monthKey].expense;
            }
        });

        return Object.entries(monthlyData).map(([month, data]) => ({
            month,
            ...data
        }));
    }
}

// Export for use in other modules
window.TransactionManager = TransactionManager;
