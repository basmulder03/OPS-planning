// OPS Planning Application

class OPSPlanning {
    constructor() {
        this.pattern = [];
        this.specificAssignments = {};
        this.currentViewDate = new Date();
        this.draggedElement = null;
        this.draggedIndex = null;
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.loadFromURL();
        this.setupEventListeners();
        this.renderAll();
    }

    // Data Management
    loadFromStorage() {
        const storedData = localStorage.getItem('opsPlanning');
        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                this.pattern = data.pattern || [];
                this.specificAssignments = data.specificAssignments || {};
            } catch (e) {
                console.error('Error loading data:', e);
            }
        }
    }

    saveToStorage() {
        const data = {
            pattern: this.pattern,
            specificAssignments: this.specificAssignments
        };
        localStorage.setItem('opsPlanning', JSON.stringify(data));
        this.updateURL();
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const dataParam = params.get('data');
        if (dataParam) {
            try {
                const data = JSON.parse(atob(dataParam));
                this.pattern = data.pattern || this.pattern;
                this.specificAssignments = data.specificAssignments || this.specificAssignments;
                this.saveToStorage();
            } catch (e) {
                console.error('Error loading from URL:', e);
            }
        }
    }

    updateURL() {
        const data = {
            pattern: this.pattern,
            specificAssignments: this.specificAssignments
        };
        const encoded = btoa(JSON.stringify(data));
        const url = new URL(window.location);
        url.searchParams.set('data', encoded);
        window.history.replaceState({}, '', url);
    }

    // Pattern Management
    addPerson(name) {
        if (!name || name.trim() === '') return;
        this.pattern.push(name.trim());
        this.saveToStorage();
        this.renderPattern();
        this.renderWeek();
    }

    removePerson(index) {
        this.pattern.splice(index, 1);
        this.saveToStorage();
        this.renderPattern();
        this.renderWeek();
    }

    swapPersons(index1, index2) {
        if (index1 < 0 || index2 < 0 || index1 >= this.pattern.length || index2 >= this.pattern.length) {
            return;
        }
        [this.pattern[index1], this.pattern[index2]] = [this.pattern[index2], this.pattern[index1]];
        this.saveToStorage();
        this.renderPattern();
        this.renderWeek();
    }

    movePersonTo(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        const person = this.pattern.splice(fromIndex, 1)[0];
        this.pattern.splice(toIndex, 0, person);
        this.saveToStorage();
        this.renderPattern();
        this.renderWeek();
    }

    // Specific Assignments
    addAssignment(date, person, note = '') {
        const dateStr = this.formatDate(date);
        this.specificAssignments[dateStr] = {
            person: person.trim(),
            note: note.trim()
        };
        this.saveToStorage();
        this.renderAssignments();
        this.renderWeek();
    }

    removeAssignment(dateStr) {
        delete this.specificAssignments[dateStr];
        this.saveToStorage();
        this.renderAssignments();
        this.renderWeek();
    }

    // Date Utilities
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getWeekDates(date) {
        const current = new Date(date);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(current.setDate(diff));
        
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d);
        }
        return dates;
    }

    getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    getPersonForDate(date) {
        const dateStr = this.formatDate(date);
        
        // Check for specific assignment
        if (this.specificAssignments[dateStr]) {
            return this.specificAssignments[dateStr];
        }

        // Use pattern
        if (this.pattern.length === 0) {
            return { person: 'No pattern set', note: '' };
        }

        // Calculate days since epoch
        const epoch = new Date('2024-01-01');
        const daysSinceEpoch = Math.floor((date - epoch) / (1000 * 60 * 60 * 24));
        const personIndex = daysSinceEpoch % this.pattern.length;
        
        return { person: this.pattern[personIndex], note: '' };
    }

    // Rendering
    renderAll() {
        this.renderWeek();
        this.renderPattern();
        this.renderAssignments();
    }

    renderWeek() {
        const dates = this.getWeekDates(this.currentViewDate);
        const weekNumber = this.getWeekNumber(this.currentViewDate);
        
        // Update week info
        document.getElementById('weekNumber').textContent = `Week ${weekNumber}`;
        const startDate = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDate = dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        document.getElementById('weekDates').textContent = `${startDate} - ${endDate}`;

        // Render days
        const weekDaysContainer = document.getElementById('weekDays');
        weekDaysContainer.innerHTML = '';

        const today = this.formatDate(new Date());
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        dates.forEach((date, index) => {
            const dateStr = this.formatDate(date);
            const assignment = this.getPersonForDate(date);
            const isToday = dateStr === today;

            const dayCard = document.createElement('div');
            dayCard.className = `day-card ${isToday ? 'today' : ''}`;
            
            dayCard.innerHTML = `
                <div class="day-name">${dayNames[index]}</div>
                <div class="day-date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div class="day-person">${assignment.person}</div>
                ${assignment.note ? `<div class="day-note">${assignment.note}</div>` : ''}
            `;

            weekDaysContainer.appendChild(dayCard);
        });
    }

    renderPattern() {
        const patternList = document.getElementById('patternList');
        
        if (this.pattern.length === 0) {
            patternList.innerHTML = '<div class="empty-state"><p>No people in the pattern. Add someone to get started!</p></div>';
            return;
        }

        patternList.innerHTML = '';
        
        this.pattern.forEach((person, index) => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            item.draggable = true;
            item.dataset.index = index;

            item.innerHTML = `
                <div class="pattern-item-left">
                    <span class="pattern-item-handle">⋮⋮</span>
                    <span class="pattern-item-index">#${index + 1}</span>
                    <span class="pattern-item-name">${person}</span>
                </div>
                <div class="pattern-item-actions">
                    ${index > 0 ? `<button class="btn btn-small btn-secondary move-up-btn" data-index="${index}">↑</button>` : ''}
                    ${index < this.pattern.length - 1 ? `<button class="btn btn-small btn-secondary move-down-btn" data-index="${index}">↓</button>` : ''}
                    <button class="btn btn-small btn-danger remove-btn" data-index="${index}">Remove</button>
                </div>
            `;

            // Drag and drop
            item.addEventListener('dragstart', (e) => {
                this.draggedElement = item;
                this.draggedIndex = index;
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.draggedIndex !== null && this.draggedIndex !== index) {
                    this.movePersonTo(this.draggedIndex, index);
                }
            });

            patternList.appendChild(item);
        });

        // Add event listeners for buttons
        patternList.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (confirm(`Remove ${this.pattern[index]} from the pattern?`)) {
                    this.removePerson(index);
                }
            });
        });

        patternList.querySelectorAll('.move-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.swapPersons(index, index - 1);
            });
        });

        patternList.querySelectorAll('.move-down-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.swapPersons(index, index + 1);
            });
        });
    }

    renderAssignments() {
        const assignmentsList = document.getElementById('assignmentsList');
        
        const sortedDates = Object.keys(this.specificAssignments).sort();
        
        if (sortedDates.length === 0) {
            assignmentsList.innerHTML = '<div class="empty-state"><p>No specific assignments. Add one to override the pattern for a specific day.</p></div>';
            return;
        }

        assignmentsList.innerHTML = '';

        sortedDates.forEach(dateStr => {
            const assignment = this.specificAssignments[dateStr];
            const date = new Date(dateStr + 'T00:00:00');
            
            const item = document.createElement('div');
            item.className = 'assignment-item';

            item.innerHTML = `
                <div class="assignment-item-info">
                    <span class="assignment-date">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span class="assignment-person">${assignment.person}</span>
                    ${assignment.note ? `<span class="assignment-note">${assignment.note}</span>` : ''}
                </div>
                <button class="btn btn-small btn-danger" data-date="${dateStr}">Remove</button>
            `;

            assignmentsList.appendChild(item);
        });

        // Add event listeners
        assignmentsList.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dateStr = e.target.dataset.date;
                if (confirm('Remove this specific assignment?')) {
                    this.removeAssignment(dateStr);
                }
            });
        });
    }

    // Event Listeners
    setupEventListeners() {
        // Add person to pattern
        document.getElementById('addPersonBtn').addEventListener('click', () => {
            const input = document.getElementById('newPersonName');
            this.addPerson(input.value);
            input.value = '';
        });

        document.getElementById('newPersonName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPerson(e.target.value);
                e.target.value = '';
            }
        });

        // Week navigation
        document.getElementById('prevWeek').addEventListener('click', () => {
            this.currentViewDate.setDate(this.currentViewDate.getDate() - 7);
            this.renderWeek();
        });

        document.getElementById('nextWeek').addEventListener('click', () => {
            this.currentViewDate.setDate(this.currentViewDate.getDate() + 7);
            this.renderWeek();
        });

        document.getElementById('currentWeek').addEventListener('click', () => {
            this.currentViewDate = new Date();
            this.renderWeek();
        });

        // Add specific assignment
        document.getElementById('addAssignmentBtn').addEventListener('click', () => {
            const dateInput = document.getElementById('assignmentDate');
            const personInput = document.getElementById('assignmentPerson');
            const noteInput = document.getElementById('assignmentNote');

            if (dateInput.value && personInput.value) {
                this.addAssignment(dateInput.value, personInput.value, noteInput.value);
                dateInput.value = '';
                personInput.value = '';
                noteInput.value = '';
            } else {
                alert('Please enter both date and person name');
            }
        });

        // Share functionality
        document.getElementById('shareBtn').addEventListener('click', () => {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                alert('URL copied to clipboard! Share this link with others.');
            }).catch(err => {
                alert('Failed to copy URL. Please copy it manually from the address bar.');
            });
        });

        // Export data
        document.getElementById('exportBtn').addEventListener('click', () => {
            const data = {
                pattern: this.pattern,
                specificAssignments: this.specificAssignments
            };
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ops-planning-data.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        // Import data
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        if (confirm('This will replace your current data. Continue?')) {
                            this.pattern = data.pattern || [];
                            this.specificAssignments = data.specificAssignments || {};
                            this.saveToStorage();
                            this.renderAll();
                            alert('Data imported successfully!');
                        }
                    } catch (err) {
                        alert('Error importing data. Please check the file format.');
                    }
                };
                reader.readAsText(file);
            }
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new OPSPlanning();
});
