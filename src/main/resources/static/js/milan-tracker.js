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

        // Import type selector
        document.addEventListener('change', (e) => {
            if (e.target.name === 'importType') {
                this.updateImportInterface(e.target.value);
            }
        });

        // Modal close on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('milanModal');
            const importModal = document.getElementById('importModal');
            const reportsModal = document.getElementById('reportsModal');
            if (e.target === modal) {
                this.closeModal();
            }
            if (e.target === importModal) {
                this.closeImportModal();
            }
            if (e.target === reportsModal) {
                this.closeReportsModal();
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
        const importType = document.querySelector('input[name="importType"]:checked').value;
        
        if (!file) {
            alert('Please select a file to import');
            return;
        }

        if (importType === 'excel') {
            this.importExcelData(file);
        } else {
            this.importJsonData(file);
        }
    }

    importExcelData(file) {
        if (!window.XLSX) {
            alert('Excel functionality is not available. Please check your internet connection.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const importedData = jsonData.map((row, index) => {
                    const participants = row['Participants'] ? 
                        row['Participants'].split(';').map(p => {
                            const match = p.trim().match(/^(.*)\s*\(([^)]+)\)$/);
                            if (match) {
                                return { name: match[1].trim(), type: match[2].trim() };
                            }
                            return { name: p.trim(), type: 'Other' };
                        }).filter(p => p.name) : [];

                    return {
                        id: `imported_${Date.now()}_${index}`,
                        name: row['Milan Name'] || '',
                        valay: row['Valay'] || '',
                        date: this.formatDateForInput(row['Date']) || new Date().toISOString().split('T')[0],
                        ssCount: parseInt(row['SS Count']) || 0,
                        shakaCount: parseInt(row['Shaka Count']) || 0,
                        newSS: parseInt(row['New SS']) || 0,
                        othersCount: parseInt(row['Others Count']) || 0,
                        balaCount: parseInt(row['Bala Count']) || 0,
                        totalSoochi: parseInt(row['Total Soochi']) || 0,
                        participants: participants,
                        notes: row['Notes'] || '',
                        createdAt: new Date().toISOString()
                    };
                });

                if (confirm(`Import ${importedData.length} records? This will replace all existing data.`)) {
                    this.milans = importedData;
                    this.saveData();
                    this.updateDashboard();
                    this.renderMilans();
                    this.populateValayFilter();
                    this.closeImportModal();
                    this.showNotification('Excel data imported successfully!', 'success');
                }
            } catch (error) {
                console.error('Error importing Excel:', error);
                alert('Error importing Excel file. Please check the file format.');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    importJsonData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedData)) {
                    throw new Error('Invalid file format');
                }

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
                    this.showNotification('JSON data imported successfully!', 'success');
                }
            } catch (error) {
                console.error('Error importing JSON:', error);
                alert('Error importing file. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }

    formatDateForInput(dateString) {
        if (!dateString) return null;
        
        // Handle various date formats
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            // Try parsing Excel date serial number
            if (!isNaN(parseFloat(dateString))) {
                const excelDate = new Date((parseFloat(dateString) - 25569) * 86400 * 1000);
                return excelDate.toISOString().split('T')[0];
            }
            return null;
        }
        return date.toISOString().split('T')[0];
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Excel Export/Import functionality
    exportToExcel() {
        if (!window.XLSX) {
            alert('Excel functionality is not available. Please check your internet connection.');
            return;
        }

        const excelData = this.milans.map(milan => {
            const participantNames = milan.participants.map(p => `${p.name} (${p.type})`).join('; ');
            return {
                'Milan Name': milan.name,
                'Valay': milan.valay,
                'Date': milan.date,
                'SS Count': milan.ssCount,
                'Shaka Count': milan.shakaCount,
                'New SS': milan.newSS,
                'Others Count': milan.othersCount,
                'Bala Count': milan.balaCount,
                'Total Soochi': milan.totalSoochi,
                'Participants': participantNames,
                'Notes': milan.notes || ''
            };
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Milan Data');
        
        const filename = `milan-tracker-data-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        this.showNotification('Data exported to Excel successfully!', 'success');
    }

    updateImportInterface(type) {
        const label = document.getElementById('fileInputLabel');
        const input = document.getElementById('importFile');
        const note = document.getElementById('importNote');
        
        if (type === 'excel') {
            label.textContent = 'Select Excel/CSV file to import';
            input.accept = '.xlsx,.xls,.csv';
            note.textContent = 'Supports Excel (.xlsx, .xls) and CSV files. Ensure columns match the export format.';
        } else {
            label.textContent = 'Select JSON file to import';
            input.accept = '.json';
            note.textContent = 'This will replace all existing data. Make sure to export your current data first.';
        }
    }

    // Weekly Reports functionality
    showReportsModal() {
        document.getElementById('reportsModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Set default date range (last 4 weeks)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 28);
        
        document.getElementById('reportEndDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('reportStartDate').value = startDate.toISOString().split('T')[0];
        
        // Populate Valay filter
        this.populateReportValayFilter();
    }

    closeReportsModal() {
        document.getElementById('reportsModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    populateReportValayFilter() {
        const select = document.getElementById('reportValay');
        const valays = [...new Set(this.milans.map(milan => milan.valay))].sort();
        
        // Clear existing options except "All Valays"
        select.innerHTML = '<option value="">All Valays</option>';
        
        valays.forEach(valay => {
            const option = document.createElement('option');
            option.value = valay;
            option.textContent = valay;
            select.appendChild(option);
        });
    }

    generateWeeklyReport() {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const selectedValay = document.getElementById('reportValay').value;
        
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            alert('Start date cannot be after end date');
            return;
        }

        const filteredMilans = this.milans.filter(milan => {
            const milanDate = new Date(milan.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            const dateInRange = milanDate >= start && milanDate <= end;
            const valayMatch = !selectedValay || milan.valay === selectedValay;
            
            return dateInRange && valayMatch;
        });

        this.renderWeeklyReport(filteredMilans, startDate, endDate, selectedValay);
        document.getElementById('exportReportBtn').style.display = 'inline-block';
    }

    renderWeeklyReport(milans, startDate, endDate, valay) {
        const content = document.getElementById('weeklyReportContent');
        
        if (milans.length === 0) {
            content.innerHTML = `
                <div class="report-placeholder">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No Milan data found for the selected date range${valay ? ` and Valay: ${valay}` : ''}</p>
                </div>
            `;
            return;
        }

        // Calculate summary statistics
        const totalMilans = milans.length;
        const totalAttendance = milans.reduce((sum, milan) => sum + milan.totalSoochi, 0);
        const totalNewSS = milans.reduce((sum, milan) => sum + milan.newSS, 0);
        const totalBala = milans.reduce((sum, milan) => sum + milan.balaCount, 0);
        const avgAttendance = totalAttendance / totalMilans;
        
        // Group by weeks
        const weeklyData = this.groupMilansByWeek(milans);
        
        content.innerHTML = `
            <div class="report-header">
                <h3>Weekly Report: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</h3>
                ${valay ? `<p class="report-filter">Filtered by Valay: <strong>${valay}</strong></p>` : ''}
            </div>
            
            <div class="weekly-summary">
                <div class="summary-card">
                    <h4>Total Milans</h4>
                    <div class="value">${totalMilans}</div>
                </div>
                <div class="summary-card">
                    <h4>Total Attendance</h4>
                    <div class="value">${totalAttendance}</div>
                </div>
                <div class="summary-card">
                    <h4>Average Attendance</h4>
                    <div class="value">${avgAttendance.toFixed(1)}</div>
                </div>
                <div class="summary-card">
                    <h4>New SS Joined</h4>
                    <div class="value">${totalNewSS}</div>
                </div>
                <div class="summary-card">
                    <h4>Total Bala</h4>
                    <div class="value">${totalBala}</div>
                </div>
            </div>
            
            <div class="weekly-details">
                ${weeklyData.map(week => this.renderWeekSection(week)).join('')}
            </div>
        `;
    }

    groupMilansByWeek(milans) {
        const weeks = {};
        
        milans.forEach(milan => {
            const date = new Date(milan.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    startDate: weekKey,
                    milans: []
                };
            }
            weeks[weekKey].milans.push(milan);
        });
        
        return Object.values(weeks).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    }

    renderWeekSection(week) {
        const weekStart = new Date(week.startDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekTotal = week.milans.reduce((sum, milan) => sum + milan.totalSoochi, 0);
        
        return `
            <div class="week-section">
                <div class="week-header">
                    Week of ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()} 
                    (${week.milans.length} Milans, ${weekTotal} Total Attendance)
                </div>
                <div class="week-content">
                    ${week.milans.map(milan => this.renderMilanItem(milan)).join('')}
                </div>
            </div>
        `;
    }

    renderMilanItem(milan) {
        return `
            <div class="milan-item">
                <div class="milan-header">
                    <strong>${milan.name}</strong> - ${milan.valay} 
                    <span class="milan-date">(${new Date(milan.date).toLocaleDateString()})</span>
                </div>
                <div class="milan-summary">
                    <div class="milan-stat">
                        <div class="label">SS</div>
                        <div class="value">${milan.ssCount}</div>
                    </div>
                    <div class="milan-stat">
                        <div class="label">Shaka</div>
                        <div class="value">${milan.shakaCount}</div>
                    </div>
                    <div class="milan-stat">
                        <div class="label">New SS</div>
                        <div class="value">${milan.newSS}</div>
                    </div>
                    <div class="milan-stat">
                        <div class="label">Others</div>
                        <div class="value">${milan.othersCount}</div>
                    </div>
                    <div class="milan-stat">
                        <div class="label">Bala</div>
                        <div class="value">${milan.balaCount}</div>
                    </div>
                    <div class="milan-stat">
                        <div class="label">Total</div>
                        <div class="value">${milan.totalSoochi}</div>
                    </div>
                </div>
                ${milan.notes ? `<div class="milan-notes"><strong>Notes:</strong> ${milan.notes}</div>` : ''}
            </div>
        `;
    }

    exportReportToExcel() {
        if (!window.XLSX) {
            alert('Excel functionality is not available. Please check your internet connection.');
            return;
        }

        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const selectedValay = document.getElementById('reportValay').value;
        
        const filteredMilans = this.milans.filter(milan => {
            const milanDate = new Date(milan.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            const dateInRange = milanDate >= start && milanDate <= end;
            const valayMatch = !selectedValay || milan.valay === selectedValay;
            
            return dateInRange && valayMatch;
        });

        if (filteredMilans.length === 0) {
            alert('No data to export for the selected criteria');
            return;
        }

        // Create summary sheet
        const summaryData = [{
            'Report Period': `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
            'Valay Filter': selectedValay || 'All Valays',
            'Total Milans': filteredMilans.length,
            'Total Attendance': filteredMilans.reduce((sum, milan) => sum + milan.totalSoochi, 0),
            'Average Attendance': (filteredMilans.reduce((sum, milan) => sum + milan.totalSoochi, 0) / filteredMilans.length).toFixed(1),
            'Total New SS': filteredMilans.reduce((sum, milan) => sum + milan.newSS, 0),
            'Total Bala': filteredMilans.reduce((sum, milan) => sum + milan.balaCount, 0)
        }];

        // Create detailed data
        const detailedData = filteredMilans.map(milan => ({
            'Date': new Date(milan.date).toLocaleDateString(),
            'Milan Name': milan.name,
            'Valay': milan.valay,
            'SS Count': milan.ssCount,
            'Shaka Count': milan.shakaCount,
            'New SS': milan.newSS,
            'Others Count': milan.othersCount,
            'Bala Count': milan.balaCount,
            'Total Soochi': milan.totalSoochi,
            'Participants': milan.participants.map(p => `${p.name} (${p.type})`).join('; '),
            'Notes': milan.notes || ''
        }));

        // Create workbook
        const wb = XLSX.utils.book_new();
        
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
        
        const detailWs = XLSX.utils.json_to_sheet(detailedData);
        XLSX.utils.book_append_sheet(wb, detailWs, 'Detailed Data');
        
        const filename = `milan-weekly-report-${startDate}-to-${endDate}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        this.showNotification('Weekly report exported to Excel successfully!', 'success');
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

function exportToExcel() {
    milanTracker.exportToExcel();
}

function showReportsModal() {
    milanTracker.showReportsModal();
}

function closeReportsModal() {
    milanTracker.closeReportsModal();
}

function generateWeeklyReport() {
    milanTracker.generateWeeklyReport();
}

function exportReportToExcel() {
    milanTracker.exportReportToExcel();
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