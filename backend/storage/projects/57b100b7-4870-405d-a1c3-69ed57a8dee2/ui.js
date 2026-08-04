/**
 * UI Module - Handles all UI interactions and DOM manipulation
 * Provides rendering, event handling, and user feedback
 */

class UIManager {
    constructor(transactionManager) {
        this.transactions = transactionManager;
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.editingTransaction = null;
        this.chartInstances = {};
        
        // DOM element references
        this.elements = {};
        this.initElements();
    }

    /**
     * Initialize DOM element references
     */
    initElements() {
        this.elements = {
            // Summary elements
            balanceEl: document.getElementById('totalBalance'),
            incomeEl: document.getElementById('totalIncome'),
            expenseEl: document.getElementById('totalExpense'),
            
            // Form elements
            txTitleInput: document.getElementById('txTitle'),
            txAmountInput: document.getElementById('txAmount'),
            txTypeSelect: document.getElementById('txType'),
            txCategorySelect: document.getElementById('txCategory'),
            txDescriptionInput: document.getElementById('txDescription'),
            addBtn: document.getElementById('addTransactionBtn'),
            
            // List elements
            listContainer: document.getElementById('transactionListContainer'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            
            // Search elements
            searchInput: document.getElementById('searchInput'),
            
            // Modal elements
            modal: document.getElementById('transactionModal'),
            modalTitle: document.getElementById('modalTitle'),
            closeModalBtn: document.getElementById('closeModal'),
            
            // Export elements
            exportJsonBtn: document.getElementById('exportJson'),
            exportCsvBtn: document.getElementById('exportCsv'),
            importBtn: document.getElementById('importBtn'),
            
            // Chart elements
            categoryChart: document.getElementById('categoryChart'),
            trendChart: document.getElementById('trendChart')
        };
    }

    /**
     * Initialize UI event listeners
     */
    initEventListeners() {
        // Form submission
        this.elements.addBtn.addEventListener('click', () => this.handleAddTransaction());
        
        // Enter key submission
        ['txTitleInput', 'txAmountInput'].forEach(id => {
            if (this.elements[id]) {
                this.elements[id].addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleAddTransaction();
                    }
                });
            }
        });

        // Filter buttons
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                this.setActiveFilter(filter);
            });
        });

        // Search functionality
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value;
                this.renderTransactionList();
            });
        }

        // Modal controls
        if (this.elements.closeModalBtn) {
            this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());
        }

        // Export functionality
        if (this.elements.exportJsonBtn) {
            this.elements.exportJsonBtn.addEventListener('click', () => this.handleExport('json'));
        }
        
        if (this.elements.exportCsvBtn) {
            this.elements.exportCsvBtn.addEventListener('click', () => this.handleExport('csv'));
        }

        // Import functionality
        if (this.elements.importBtn) {
            this.elements.importBtn.addEventListener('click', () => this.handleImport());
        }

        // Close modal on outside click
        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (e) => {
                if (e.target === this.elements.modal) {
                    this.closeModal();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * Update summary cards
     */
    updateSummary() {
        const summary = this.transactions.calculateSummary();
        
        this.elements.balanceEl.textContent = this.formatCurrency(summary.balance);
        this.elements.incomeEl.textContent = this.formatCurrency(summary.totalIncome);
        this.elements.expenseEl.textContent = this.formatCurrency(summary.totalExpense);

        // Add color classes based on balance
        this.elements.balanceEl.className = 'card-amount';
        if (summary.balance < 0) {
            this.elements.balanceEl.classList.add('expense-text');
        } else if (summary.balance > 0) {
            this.elements.balanceEl.classList.add('income-text');
        }
    }

    /**
     * Render transaction list
     */
    renderTransactionList() {
        const filters = {
            type: this.currentFilter,
            search: this.currentSearch
        };

        const filteredTransactions = this.transactions.filterTransactions(filters);

        if (filteredTransactions.length === 0) {
            this.renderEmptyState();
            return;
        }

        const html = filteredTransactions.map(tx => this.renderTransactionItem(tx)).join('');
        this.elements.listContainer.innerHTML = html;

        // Attach event listeners to transaction items
        this.attachTransactionEventListeners();
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        let emptyMessage = '📭 No transactions yet. Start by adding one!';
        
        if (this.currentSearch) {
            emptyMessage = `🔍 No transactions found matching "${this.currentSearch}"`;
        } else if (this.currentFilter === 'income') {
            emptyMessage = '💸 No income records found. Add income to see here.';
        } else if (this.currentFilter === 'expense') {
            emptyMessage = '🧾 No expense records found. Add expense to see here.';
        }

        this.elements.listContainer.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 1rem;">✨</div>
                <div>${emptyMessage}</div>
            </div>
        `;
    }

    /**
     * Render single transaction item
     * @param {Object} tx - Transaction object
     * @returns {string} HTML string
     */
    renderTransactionItem(tx) {
        const amountClass = tx.type === 'income' ? 'income-text' : 'expense-text';
        const sign = tx.type === 'income' ? '+' : '-';
        const formattedAmount = this.formatCurrency(Math.abs(tx.amount));
        const dateStr = this.formatDate(tx.timestamp);
        
        return `
            <div class="transaction-item" data-id="${tx.id}">
                <div class="tx-info">
                    <div class="tx-title">${this.escapeHtml(tx.title)}</div>
                    <div class="tx-meta">
                        <span>${dateStr}</span>
                        <span>•</span>
                        <span class="tx-category">${tx.category}</span>
                        <span>•</span>
                        <span>${tx.type === 'income' ? 'Income' : 'Expense'}</span>
                    </div>
                </div>
                <div class="tx-amount ${amountClass}">${sign} ${formattedAmount}</div>
                <div class="tx-actions">
                    <button class="edit-btn" data-id="${tx.id}" aria-label="Edit transaction">✏️</button>
                    <button class="delete-btn" data-id="${tx.id}" aria-label="Delete transaction">🗑️</button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to transaction items
     */
    attachTransactionEventListeners() {
        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.getAttribute('data-id'));
                this.handleDeleteTransaction(id);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.getAttribute('data-id'));
                this.handleEditTransaction(id);
            });
        });
    }

    /**
     * Handle add transaction
     */
    handleAddTransaction() {
        try {
            const transactionData = {
                title: this.elements.txTitleInput.value.trim(),
                amount: this.elements.txAmountInput.value,
                type: this.elements.txTypeSelect.value,
                category: this.elements.txCategorySelect?.value || 'Uncategorized',
                description: this.elements.txDescriptionInput?.value || ''
            };

            const transaction = this.transactions.addTransaction(transactionData);
            this.clearForm();
            this.updateUI();
            this.showToast('Transaction added successfully!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Handle delete transaction
     * @param {number} id - Transaction ID
     */
    handleDeleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const deleted = this.transactions.deleteTransaction(id);
            if (deleted) {
                this.updateUI();
                this.showToast('Transaction deleted successfully!', 'success');
            } else {
                this.showToast('Transaction not found', 'error');
            }
        }
    }

    /**
     * Handle edit transaction
     * @param {number} id - Transaction ID
     */
    handleEditTransaction(id) {
        const transaction = this.transactions.getTransactionById(id);
        if (!transaction) {
            this.showToast('Transaction not found', 'error');
            return;
        }

        this.editingTransaction = transaction;
        this.openEditModal(transaction);
    }

    /**
     * Open edit modal
     * @param {Object} transaction - Transaction to edit
     */
    openEditModal(transaction) {
        if (!this.elements.modal) return;

        this.elements.modalTitle.textContent = 'Edit Transaction';
        
        // Populate form with transaction data
        const form = this.elements.modal.querySelector('form');
        if (form) {
            form.title.value = transaction.title;
            form.amount.value = transaction.amount;
            form.type.value = transaction.type;
            form.category.value = transaction.category;
            form.description.value = transaction.description || '';
        }

        this.elements.modal.classList.add('active');
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('active');
            this.editingTransaction = null;
        }
    }

    /**
     * Handle export
     * @param {string} format - 'json' or 'csv'
     */
    handleExport(format) {
        const allTransactions = this.transactions.getAllTransactions();
        
        if (allTransactions.length === 0) {
            this.showToast('No transactions to export', 'warning');
            return;
        }

        let success = false;
        if (format === 'json') {
            success = this.transactions.storage.exportToJSON(allTransactions);
        } else if (format === 'csv') {
            success = this.transactions.storage.exportToCSV(allTransactions);
        }

        if (success) {
            this.showToast(`Data exported as ${format.toUpperCase()} successfully!`, 'success');
        } else {
            this.showToast('Export failed', 'error');
        }
    }

    /**
     * Handle import
     */
    handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const importedTransactions = await this.transactions.storage.importFromFile(file);
                const count = this.transactions.importTransactions(importedTransactions, true);
                this.updateUI();
                this.showToast(`${count} transactions imported successfully!`, 'success');
            } catch (error) {
                this.showToast(`Import failed: ${error.message}`, 'error');
            }
        });

        input.click();
    }

    /**
     * Set active filter
     * @param {string} filter - Filter value
     */
    setActiveFilter(filter) {
        this.currentFilter = filter;
        
        // Update button states
        this.elements.filterBtns.forEach(btn => {
            const btnFilter = btn.getAttribute('data-filter');
            if (btnFilter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.renderTransactionList();
    }

    /**
     * Update category dropdown based on type
     * @param {string} type - 'income' or 'expense'
     */
    updateCategoryDropdown(type) {
        if (!this.elements.txCategorySelect) return;

        const categories = this.transactions.getCategories(type);
        this.elements.txCategorySelect.innerHTML = categories
            .map(cat => `<option value="${cat}">${cat}</option>`)
            .join('');
    }

    /**
     * Clear form
     */
    clearForm() {
        this.elements.txTitleInput.value = '';
        this.elements.txAmountInput.value = '';
        this.elements.txTypeSelect.value = 'income';
        this.elements.txCategorySelect.value = 'Uncategorized';
        if (this.elements.txDescriptionInput) {
            this.elements.txDescriptionInput.value = '';
        }
    }

    /**
     * Update entire UI
     */
    updateUI() {
        this.updateSummary();
        this.renderTransactionList();
        this.updateCharts();
    }

    /**
     * Update charts (placeholder for charting library integration)
     */
    updateCharts() {
        // This would integrate with a charting library like Chart.js
        // For now, it's a placeholder
        console.log('Charts would be updated here');
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', 'warning'
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: auto;">×</button>
        `;

        const container = document.querySelector('.toast-container') || this.createToastContainer();
        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    /**
     * Create toast container
     */
    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return `₹${Math.abs(amount).toFixed(2)}`;
    }

    /**
     * Format date
     * @param {number} timestamp - Timestamp to format
     * @returns {string} Formatted date string
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Show loading state
     * @param {string} elementId - Element ID to show loading in
     */
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading">Loading...</div>';
        }
    }

    /**
     * Hide loading state
     * @param {string} elementId - Element ID to hide loading from
     */
    hideLoading(elementId) {
        // This would be implemented based on specific loading UI needs
    }

    /**
     * Initialize the UI
     */
    init() {
        this.initEventListeners();
        this.updateCategoryDropdown('income');
        
        // Update category dropdown when type changes
        this.elements.txTypeSelect.addEventListener('change', (e) => {
            this.updateCategoryDropdown(e.target.value);
        });

        this.updateUI();
    }
}

// Export for use in other modules
window.UIManager = UIManager;
