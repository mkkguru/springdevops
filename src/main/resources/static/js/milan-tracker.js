// Milan Tracker Application JavaScript
class MilanTracker {
    constructor() {
        this.milans = [];
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDashboard();
        this.renderMilans();
        this.populateValayFilter();
    }

    // Data Management
    loadData() {
        const savedData = localStorage.getItem('milan-tracker-data');
        if (savedData) {
            try {
                this.milans = JSON.parse(savedData);
            } catch (error) {
                console.error('Error loading data:', error);
                this.milans = [];
            }
        }
    }

    saveData() {
        try {
            localStorage.setItem('milan-tracker-data', JSON.stringify(this.milans));
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Error saving data. Please try again.');
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Form submission
        document.getElementById('milanForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMilan();
        });

        // Auto-calculate total soochi
        const numberInputs = ['ssCount', 'shakaCount', 'newSS', 'othersCount', 'balaCount'];
        numberInputs.forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.calculateTotalSoochi();
            });
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Filter functionality
        document.getElementById('valayFilter').addEventListener('change', (e) => {
            this.handleFilter(e.target.value);
        });

        // Modal close on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('milanModal');
            const importModal = document.getElementById('importModal');
            if (e.target === modal) {
                this.closeModal();
            }
            if (e.target === importModal) {
                this.closeImportModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeImportModal();
            }
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.showAddForm();
            }
        });
    }

    // Form Management
    showAddForm() {
        this.currentEditingId = null;
        document.getElementById('modalTitle').textContent = 'Add New Milan';
        this.resetForm();
        document.getElementById('milanModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    showEditForm(id) {
        this.currentEditingId = id;
        const milan = this.milans.find(m => m.id === id);
        if (!milan) return;

        document.getElementById('modalTitle').textContent = 'Edit Milan';
        this.populateForm(milan);
        document.getElementById('milanModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('milanModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    closeImportModal() {
        document.getElementById('importModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    resetForm() {
        document.getElementById('milanForm').reset();
        document.getElementById('totalSoochi').value = 0;
        
        // Reset participants list to one entry
        const participantsList = document.getElementById('participantsList');
        participantsList.innerHTML = `
            <div class="participant-entry">
                <input type="text" placeholder="Participant name" class="participant-name">
                <select class="participant-type">
                    <option value="SS">SS</option>
                    <option value="New">New</option>
                    <option value="Other">Other</option>
                    <option value="Bala">Bala</option>
                </select>
                <button type="button" class="btn-remove" onclick="removeParticipant(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Set today's date as default
        document.getElementById('milanDate').value = new Date().toISOString().split('T')[0];
    }

    populateForm(milan) {
        document.getElementById('milanName').value = milan.name;
        document.getElementById('valay').value = milan.valay;
        document.getElementById('milanDate').value = milan.date;
        document.getElementById('ssCount').value = milan.ssCount;
        document.getElementById('shakaCount').value = milan.shakaCount;
        document.getElementById('newSS').value = milan.newSS;
        document.getElementById('othersCount').value = milan.othersCount;
        document.getElementById('balaCount').value = milan.balaCount;
        document.getElementById('notes').value = milan.notes || '';
        
        // Populate participants
        const participantsList = document.getElementById('participantsList');
        participantsList.innerHTML = '';
        
        if (milan.participants && milan.participants.length > 0) {
            milan.participants.forEach(participant => {
                this.addParticipantEntry(participant.name, participant.type);
            });
        } else {
            this.addParticipantEntry('', 'SS');
        }
        
        this.calculateTotalSoochi();
    }

    calculateTotalSoochi() {
        const ssCount = parseInt(document.getElementById('ssCount').value) || 0;
        const shakaCount = parseInt(document.getElementById('shakaCount').value) || 0;
        const newSS = parseInt(document.getElementById('newSS').value) || 0;
        const othersCount = parseInt(document.getElementById('othersCount').value) || 0;
        const balaCount = parseInt(document.getElementById('balaCount').value) || 0;
        
        const total = ssCount + shakaCount + newSS + othersCount + balaCount;
        document.getElementById('totalSoochi').value = total;
    }

    saveMilan() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        if (this.currentEditingId) {
            // Update existing milan
            const index = this.milans.findIndex(m => m.id === this.currentEditingId);
            if (index !== -1) {
                this.milans[index] = { ...formData, id: this.currentEditingId };
            }
        } else {
            // Add new milan
            const newMilan = {
                ...formData,
                id: this.generateId(),
                createdAt: new Date().toISOString()
            };
            this.milans.push(newMilan);
        }

        this.saveData();
        this.updateDashboard();
        this.renderMilans();
        this.populateValayFilter();
        this.closeModal();
        
        this.showNotification('Milan saved successfully!', 'success');
    }

    getFormData() {
        // Get participants
        const participantEntries = document.querySelectorAll('.participant-entry');
        const participants = [];
        
        participantEntries.forEach(entry => {
            const name = entry.querySelector('.participant-name').value.trim();
            const type = entry.querySelector('.participant-type').value;
            if (name) {
                participants.push({ name, type });
            }
        });

        return {
            name: document.getElementById('milanName').value.trim(),
            valay: document.getElementById('valay').value.trim(),
            date: document.getElementById('milanDate').value,
            ssCount: parseInt(document.getElementById('ssCount').value) || 0,
            shakaCount: parseInt(document.getElementById('shakaCount').value) || 0,
            newSS: parseInt(document.getElementById('newSS').value) || 0,
            othersCount: parseInt(document.getElementById('othersCount').value) || 0,
            balaCount: parseInt(document.getElementById('balaCount').value) || 0,
            totalSoochi: parseInt(document.getElementById('totalSoochi').value) || 0,
            participants: participants,
            notes: document.getElementById('notes').value.trim()
        };
    }

    validateForm(data) {
        if (!data.name) {
            alert('Please enter Milan name');
            return false;
        }
        if (!data.valay) {
            alert('Please enter Valay (location)');
            return false;
        }
        if (!data.date) {
            alert('Please select a date');
            return false;
        }
        return true;
    }

    // Participant Management
    addParticipant() {
        this.addParticipantEntry('', 'SS');
    }

    addParticipantEntry(name = '', type = 'SS') {
        const participantsList = document.getElementById('participantsList');
        const entry = document.createElement('div');
        entry.className = 'participant-entry slide-up';
        entry.innerHTML = `
            <input type="text" placeholder="Participant name" class="participant-name" value="${name}">
            <select class="participant-type">
                <option value="SS" ${type === 'SS' ? 'selected' : ''}>SS</option>
                <option value="New" ${type === 'New' ? 'selected' : ''}>New</option>
                <option value="Other" ${type === 'Other' ? 'selected' : ''}>Other</option>
                <option value="Bala" ${type === 'Bala' ? 'selected' : ''}>Bala</option>
            </select>
            <button type="button" class="btn-remove" onclick="removeParticipant(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        participantsList.appendChild(entry);
    }

    removeParticipant(button) {
        const entry = button.closest('.participant-entry');
        const participantsList = document.getElementById('participantsList');
        
        if (participantsList.children.length > 1) {
            entry.remove();
        } else {
            alert('At least one participant entry is required');
        }
    }

    // Dashboard and Statistics
    updateDashboard() {
        const stats = this.calculateStatistics();
        
        document.getElementById('totalMilans').textContent = stats.totalMilans;
        document.getElementById('totalAttendance').textContent = stats.totalAttendance;
        document.getElementById('totalNewJoiners').textContent = stats.totalNewJoiners;
        document.getElementById('averageAttendance').textContent = stats.averageAttendance;
    }

    calculateStatistics() {
        if (this.milans.length === 0) {
            return {
                totalMilans: 0,
                totalAttendance: 0,
                totalNewJoiners: 0,
                averageAttendance: 0
            };
        }

        const totalMilans = this.milans.length;
        const totalAttendance = this.milans.reduce((sum, milan) => sum + milan.totalSoochi, 0);
        const totalNewJoiners = this.milans.reduce((sum, milan) => sum + milan.newSS, 0);
        const averageAttendance = Math.round(totalAttendance / totalMilans);

        return {
            totalMilans,
            totalAttendance,
            totalNewJoiners,
            averageAttendance
        };
    }

    // Milan Rendering
    renderMilans(filteredMilans = null) {
        const container = document.getElementById('milanContainer');
        const milansToRender = filteredMilans || this.milans;
        
        if (milansToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>No Milans Found</h3>
                    <p>Start by adding your first Milan entry</p>
                    <button class="btn btn-primary" onclick="milanTracker.showAddForm()">
                        <i class="fas fa-plus"></i> Add Milan
                    </button>
                </div>
            `;
            return;
        }

        // Sort milans by date (newest first)
        const sortedMilans = [...milansToRender].sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sortedMilans.map(milan => this.createMilanCard(milan)).join('');
    }

    createMilanCard(milan) {
        const formattedDate = new Date(milan.date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const participantTags = milan.participants?.map(p => 
            `<span class="participant-tag">${p.name} (${p.type})</span>`
        ).join('') || '';

        return `
            <div class="milan-card fade-in">
                <div class="milan-header">
                    <div class="milan-title">
                        <h3>${milan.name}</h3>
                        <div class="milan-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${milan.valay}</span>
                            <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                        </div>
                    </div>
                    <div class="milan-actions">
                        <button class="btn btn-secondary" onclick="milanTracker.showEditForm('${milan.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-remove" onclick="milanTracker.deleteMilan('${milan.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="milan-stats">
                    <div class="stat-item">
                        <span class="number">${milan.ssCount}</span>
                        <span class="label">Svayam Sevaks</span>
                    </div>
                    <div class="stat-item">
                        <span class="number">${milan.shakaCount}</span>
                        <span class="label">Shaka Attendees</span>
                    </div>
                    <div class="stat-item">
                        <span class="number">${milan.newSS}</span>
                        <span class="label">New SS</span>
                    </div>
                    <div class="stat-item">
                        <span class="number">${milan.othersCount}</span>
                        <span class="label">Others</span>
                    </div>
                    <div class="stat-item">
                        <span class="number">${milan.balaCount}</span>
                        <span class="label">Bala Kids</span>
                    </div>
                    <div class="stat-item">
                        <span class="number">${milan.totalSoochi}</span>
                        <span class="label">Total Soochi</span>
                    </div>
                </div>

                ${milan.participants?.length > 0 ? `
                    <div class="participants-summary">
                        <h4>Participants (${milan.participants.length})</h4>
                        <div class="participant-list">
                            ${participantTags}
                        </div>
                    </div>
                ` : ''}

                ${milan.notes ? `
                    <div class="participants-summary">
                        <h4>Notes</h4>
                        <p>${milan.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Delete Milan
    deleteMilan(id) {
        const milan = this.milans.find(m => m.id === id);
        if (!milan) return;

        if (confirm(`Are you sure you want to delete "${milan.name}"?`)) {
            this.milans = this.milans.filter(m => m.id !== id);
            this.saveData();
            this.updateDashboard();
            this.renderMilans();
            this.populateValayFilter();
            this.showNotification('Milan deleted successfully!', 'success');
        }
    }

    // Search and Filter
    handleSearch(query) {
        const filtered = this.filterMilans(query, document.getElementById('valayFilter').value);
        this.renderMilans(filtered);
    }

    handleFilter(valay) {
        const filtered = this.filterMilans(document.getElementById('searchInput').value, valay);
        this.renderMilans(filtered);
    }

    filterMilans(searchQuery, valayFilter) {
        let filtered = [...this.milans];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(milan => {
                return milan.name.toLowerCase().includes(query) ||
                       milan.valay.toLowerCase().includes(query) ||
                       milan.participants?.some(p => p.name.toLowerCase().includes(query));
            });
        }

        // Apply valay filter
        if (valayFilter) {
            filtered = filtered.filter(milan => milan.valay === valayFilter);
        }

        return filtered;
    }

    populateValayFilter() {
        const valays = [...new Set(this.milans.map(milan => milan.valay))].sort();
        const select = document.getElementById('valayFilter');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">All Valays</option>';
        valays.forEach(valay => {
            const option = document.createElement('option');
            option.value = valay;
            option.textContent = valay;
            if (valay === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    // Data Export/Import
    exportData() {
        const dataStr = JSON.stringify(this.milans, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `milan-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Data exported successfully!', 'success');
    }

    showImportModal() {
        document.getElementById('importModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    importData() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file to import');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedData)) {
                    throw new Error('Invalid file format');
                }

                // Validate data structure
                const isValid = importedData.every(milan => 
                    milan.name && milan.valay && milan.date && 
                    typeof milan.totalSoochi === 'number'
                );

                if (!isValid) {
                    throw new Error('Invalid data structure');
                }

                if (confirm('This will replace all existing data. Continue?')) {
                    this.milans = importedData;
                    this.saveData();
                    this.updateDashboard();
                    this.renderMilans();
                    this.populateValayFilter();
                    this.closeImportModal();
                    this.showNotification('Data imported successfully!', 'success');
                }
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="background: var(--surface-color); padding: 1rem 1.5rem; border-radius: 10px; 
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2); border-left: 4px solid var(--primary-color);
                        position: fixed; top: 20px; right: 20px; z-index: 1001; max-width: 300px;">
                <i class="fas fa-check-circle" style="color: var(--primary-color); margin-right: 0.5rem;"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Global functions for onclick handlers
function showAddForm() {
    milanTracker.showAddForm();
}

function exportData() {
    milanTracker.exportData();
}

function showImportModal() {
    milanTracker.showImportModal();
}

function closeModal() {
    milanTracker.closeModal();
}

function closeImportModal() {
    milanTracker.closeImportModal();
}

function addParticipant() {
    milanTracker.addParticipant();
}

function removeParticipant(button) {
    milanTracker.removeParticipant(button);
}

function importData() {
    milanTracker.importData();
}

// Initialize the application
let milanTracker;
document.addEventListener('DOMContentLoaded', () => {
    milanTracker = new MilanTracker();
});

// Add some sample data for demonstration (remove in production)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (milanTracker.milans.length === 0) {
            // Add sample data based on the table provided
            const sampleData = [
                {
                    id: 'sample1',
                    name: 'Ramleela',
                    valay: 'Manikonda',
                    date: '2025-07-25',
                    ssCount: 5,
                    shakaCount: 2,
                    newSS: 1,
                    othersCount: 0,
                    balaCount: 0,
                    totalSoochi: 7,
                    participants: [
                        { name: 'Rajesh Kumar', type: 'SS' },
                        { name: 'Amit Sharma', type: 'SS' },
                        { name: 'Priya Singh', type: 'New' }
                    ],
                    notes: 'Great participation from the community',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'sample2',
                    name: 'Vishvamitra',
                    valay: 'Narsingi',
                    date: '2025-07-13',
                    ssCount: 6,
                    shakaCount: 4,
                    newSS: 2,
                    othersCount: 0,
                    balaCount: 6,
                    totalSoochi: 10,
                    participants: [
                        { name: 'Vikram Reddy', type: 'SS' },
                        { name: 'Sunita Devi', type: 'SS' },
                        { name: 'Rahul Gupta', type: 'New' },
                        { name: 'Kavya Sharma', type: 'Bala' }
                    ],
                    notes: 'Good turnout from Bala division',
                    createdAt: new Date().toISOString()
                }
            ];
            
            milanTracker.milans = sampleData;
            milanTracker.saveData();
            milanTracker.updateDashboard();
            milanTracker.renderMilans();
            milanTracker.populateValayFilter();
        }
    }, 1000);
});