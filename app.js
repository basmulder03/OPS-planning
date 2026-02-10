// OPS Planning Application

// Multi-Select Component for People Selection
class MultiSelect {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            placeholder: options.placeholder || 'Type to search or add...',
            getSuggestions: options.getSuggestions || (() => []),
            onChange: options.onChange || (() => {}),
            allowMultiple: options.allowMultiple !== false, // Default to true
            initialValues: options.initialValues || []
        };
        
        this.selectedValues = [...this.options.initialValues];
        this.inputValue = '';
        this.highlightedIndex = -1;
        this.isOpen = false;
        
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        this.container.innerHTML = '';
        this.container.className = 'multi-select-container';
        
        // Create input wrapper
        this.inputWrapper = document.createElement('div');
        this.inputWrapper.className = 'multi-select-input-wrapper';
        
        // Render selected values as tags
        this.selectedValues.forEach((value, index) => {
            const tag = this.createTag(value, index);
            this.inputWrapper.appendChild(tag);
        });
        
        // Create input
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'multi-select-input';
        this.input.placeholder = this.selectedValues.length === 0 ? this.options.placeholder : '';
        this.input.value = this.inputValue;
        this.inputWrapper.appendChild(this.input);
        
        this.container.appendChild(this.inputWrapper);
        
        // Create dropdown (initially hidden)
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'multi-select-dropdown';
        this.dropdown.style.display = 'none';
        this.container.appendChild(this.dropdown);
    }
    
    createTag(value, index) {
        const tag = document.createElement('div');
        tag.className = 'multi-select-tag';
        tag.innerHTML = `
            <span>${this.escapeHtml(value)}</span>
            <span class="multi-select-tag-remove" data-index="${index}">×</span>
        `;
        return tag;
    }
    
    attachEventListeners() {
        // Input events
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.input.addEventListener('focus', () => this.handleFocus());
        
        // Wrapper click to focus input
        this.inputWrapper.addEventListener('click', (e) => {
            if (e.target !== this.input) {
                this.input.focus();
            }
        });
        
        // Tag removal
        this.inputWrapper.addEventListener('click', (e) => {
            if (e.target.classList.contains('multi-select-tag-remove')) {
                const index = parseInt(e.target.dataset.index);
                this.removeValue(index);
            }
        });
        
        // Dropdown item selection
        this.dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.multi-select-dropdown-item');
            if (item && !item.classList.contains('multi-select-dropdown-empty')) {
                this.selectItem(item.dataset.value, item.classList.contains('add-new'));
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }
    
    handleInput() {
        this.inputValue = this.input.value;
        this.updateDropdown();
    }
    
    handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (this.highlightedIndex >= 0) {
                const items = this.dropdown.querySelectorAll('.multi-select-dropdown-item:not(.multi-select-dropdown-empty)');
                if (items[this.highlightedIndex]) {
                    const value = items[this.highlightedIndex].dataset.value;
                    const isAddNew = items[this.highlightedIndex].classList.contains('add-new');
                    this.selectItem(value, isAddNew);
                }
            } else if (this.inputValue.trim()) {
                // Add new value if input is not empty
                this.addValue(this.inputValue.trim());
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.moveHighlight(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.moveHighlight(-1);
        } else if (e.key === 'Escape') {
            this.closeDropdown();
        } else if (e.key === 'Backspace' && this.inputValue === '' && this.selectedValues.length > 0) {
            // Remove last selected value
            this.removeValue(this.selectedValues.length - 1);
        } else if (e.key === ',' && this.options.allowMultiple) {
            // Comma as a separator for adding values
            e.preventDefault();
            if (this.inputValue.trim()) {
                this.addValue(this.inputValue.trim());
            }
        }
    }
    
    handleFocus() {
        this.updateDropdown();
    }
    
    updateDropdown() {
        const suggestions = this.options.getSuggestions();
        const searchTerm = this.inputValue.toLowerCase().trim();
        
        // Filter suggestions
        let filtered = suggestions.filter(s => 
            s.toLowerCase().includes(searchTerm) && 
            !this.selectedValues.includes(s)
        );
        
        // Build dropdown content
        let dropdownHtml = '';
        
        if (filtered.length > 0) {
            filtered.forEach(suggestion => {
                dropdownHtml += `<div class="multi-select-dropdown-item" data-value="${this.escapeHtml(suggestion)}">${this.escapeHtml(suggestion)}</div>`;
            });
        }
        
        // Add "Add new" option if input doesn't match exactly
        if (searchTerm && !suggestions.some(s => s.toLowerCase() === searchTerm)) {
            dropdownHtml += `<div class="multi-select-dropdown-item add-new" data-value="${this.escapeHtml(searchTerm)}">+ Add "${this.escapeHtml(searchTerm)}"</div>`;
        }
        
        if (!dropdownHtml && searchTerm) {
            dropdownHtml = '<div class="multi-select-dropdown-empty">No matches found. Press Enter to add.</div>';
        }
        
        this.dropdown.innerHTML = dropdownHtml;
        
        if (dropdownHtml) {
            this.openDropdown();
        } else {
            this.closeDropdown();
        }
        
        this.highlightedIndex = -1;
    }
    
    moveHighlight(direction) {
        const items = this.dropdown.querySelectorAll('.multi-select-dropdown-item:not(.multi-select-dropdown-empty)');
        if (items.length === 0) return;
        
        // Remove current highlight
        if (this.highlightedIndex >= 0) {
            items[this.highlightedIndex]?.classList.remove('highlighted');
        }
        
        // Update index
        this.highlightedIndex += direction;
        if (this.highlightedIndex < 0) this.highlightedIndex = items.length - 1;
        if (this.highlightedIndex >= items.length) this.highlightedIndex = 0;
        
        // Add new highlight
        items[this.highlightedIndex]?.classList.add('highlighted');
        items[this.highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
    
    selectItem(value, isAddNew) {
        if (value) {
            this.addValue(value);
        }
    }
    
    addValue(value) {
        if (!value) return;
        
        if (!this.options.allowMultiple) {
            this.selectedValues = [value];
        } else if (!this.selectedValues.includes(value)) {
            this.selectedValues.push(value);
        }
        
        this.inputValue = '';
        this.render();
        this.attachEventListeners();
        this.input.focus();
        this.closeDropdown();
        this.options.onChange(this.selectedValues);
    }
    
    removeValue(index) {
        this.selectedValues.splice(index, 1);
        this.render();
        this.attachEventListeners();
        this.input.focus();
        this.options.onChange(this.selectedValues);
    }
    
    openDropdown() {
        this.dropdown.style.display = 'block';
        this.isOpen = true;
    }
    
    closeDropdown() {
        this.dropdown.style.display = 'none';
        this.isOpen = false;
        this.highlightedIndex = -1;
    }
    
    getValues() {
        return [...this.selectedValues];
    }
    
    setValues(values) {
        this.selectedValues = [...values];
        this.render();
        this.attachEventListeners();
    }
    
    clear() {
        this.selectedValues = [];
        this.inputValue = '';
        this.render();
        this.attachEventListeners();
        this.options.onChange(this.selectedValues);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

class OPSPlanning {
    constructor() {
        this.patternHistory = []; // Array of {effectiveDate: 'YYYY-MM-DD', pattern: [names]}
        this.dailyTasks = {}; // Unified: tasks and assignments for specific days
        this.currentViewDate = new Date();
        this.draggedElement = null;
        this.draggedIndex = null;
        this.viewMode = false; // Dashboard view mode
        this.editingTaskId = null; // Track which task is being edited
        this.dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // Day abbreviations for calendar
        this.patternMultiSelect = null; // Multi-select for pattern
        this.assigneeMultiSelect = null; // Multi-select for assignee
        
        this.init();
    }

    init() {
        this.checkViewMode();
        this.loadFromStorage();
        this.loadFromURL();
        this.setupEventListeners();
        this.renderAll();
        this.applyViewMode();
    }

    checkViewMode() {
        const params = new URLSearchParams(window.location.search);
        this.viewMode = params.get('viewMode') === 'true' || params.get('view') === 'dashboard';
    }

    applyViewMode() {
        if (this.viewMode) {
            // Hide editing sections in view mode
            document.querySelector('.pattern-section')?.classList.add('hidden');
            document.querySelector('.tasks-assignments')?.classList.add('hidden');
            document.querySelector('.share-section')?.classList.add('hidden');
            // Optionally adjust the header
            const subtitle = document.querySelector('.subtitle');
            if (subtitle) {
                subtitle.textContent = 'Dashboard View';
            }
        } else {
            // Ensure sections are visible in normal mode
            document.querySelector('.pattern-section')?.classList.remove('hidden');
            document.querySelector('.tasks-assignments')?.classList.remove('hidden');
            document.querySelector('.share-section')?.classList.remove('hidden');
            // Restore original subtitle
            const subtitle = document.querySelector('.subtitle');
            if (subtitle) {
                subtitle.textContent = 'Weekly Operations Schedule';
            }
        }
        // Update toggle button text
        this.updateViewModeButton();
    }

    toggleViewMode() {
        this.viewMode = !this.viewMode;
        this.applyViewMode();
        this.updateURLViewMode();
    }

    updateViewModeButton() {
        const button = document.getElementById('toggleViewMode');
        if (button) {
            button.textContent = this.viewMode ? '✏️ Edit Mode' : '👁️ View Mode';
            button.title = this.viewMode ? 'Switch to edit mode' : 'Switch to view-only dashboard';
        }
    }

    updateURLViewMode() {
        const url = new URL(window.location);
        if (this.viewMode) {
            url.searchParams.set('viewMode', 'true');
        } else {
            url.searchParams.delete('viewMode');
            url.searchParams.delete('view');
        }
        window.history.replaceState({}, '', url);
    }

    // Data Management
    loadFromStorage() {
        const storedData = localStorage.getItem('opsPlanning');
        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                
                // Load pattern history (new format) or migrate from old pattern
                if (data.patternHistory && Array.isArray(data.patternHistory)) {
                    this.patternHistory = data.patternHistory;
                } else if (data.pattern && Array.isArray(data.pattern)) {
                    // Migrate old pattern to pattern history with today's date
                    this.patternHistory = [{
                        effectiveDate: this.formatDate(new Date()),
                        pattern: data.pattern
                    }];
                }
                
                this.dailyTasks = data.dailyTasks || {};
                
                // Migrate old specificAssignments to dailyTasks format
                if (data.specificAssignments) {
                    Object.keys(data.specificAssignments).forEach(dateStr => {
                        const assignment = data.specificAssignments[dateStr];
                        if (!this.dailyTasks[dateStr]) {
                            this.dailyTasks[dateStr] = [];
                        }
                        const exists = this.dailyTasks[dateStr].some(task => 
                            task.description === assignment.person && task.isAssignment
                        );
                        if (!exists) {
                            this.dailyTasks[dateStr].push({
                                id: Date.now() + '-' + Math.random(),
                                description: assignment.person,
                                assignee: assignment.person,
                                note: assignment.note || '',
                                startTime: '',
                                endTime: '',
                                isAssignment: true
                            });
                        }
                    });
                }
            } catch (e) {
                console.error('Error loading data:', e);
            }
        }
    }

    saveToStorage() {
        const data = {
            patternHistory: this.patternHistory,
            dailyTasks: this.dailyTasks
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
                
                // Load pattern history or migrate from old pattern
                if (data.patternHistory && Array.isArray(data.patternHistory)) {
                    this.patternHistory = data.patternHistory;
                } else if (data.pattern && Array.isArray(data.pattern)) {
                    this.patternHistory = [{
                        effectiveDate: this.formatDate(new Date()),
                        pattern: data.pattern
                    }];
                }
                
                this.dailyTasks = data.dailyTasks || this.dailyTasks;
                
                // Migrate old specificAssignments if present
                if (data.specificAssignments) {
                    Object.keys(data.specificAssignments).forEach(dateStr => {
                        const assignment = data.specificAssignments[dateStr];
                        if (!this.dailyTasks[dateStr]) {
                            this.dailyTasks[dateStr] = [];
                        }
                        const exists = this.dailyTasks[dateStr].some(task => 
                            task.description === assignment.person && task.isAssignment
                        );
                        if (!exists) {
                            this.dailyTasks[dateStr].push({
                                id: Date.now() + '-' + Math.random(),
                                description: assignment.person,
                                assignee: assignment.person,
                                note: assignment.note || '',
                                startTime: '',
                                endTime: '',
                                isAssignment: true
                            });
                        }
                    });
                }
                this.saveToStorage();
            } catch (e) {
                console.error('Error loading from URL:', e);
            }
        }
    }

    updateURL() {
        const data = {
            patternHistory: this.patternHistory,
            dailyTasks: this.dailyTasks
        };
        const encoded = btoa(JSON.stringify(data));
        const url = new URL(window.location);
        url.searchParams.set('data', encoded);
        window.history.replaceState({}, '', url);
    }

    // Pattern Management
    getCurrentPattern() {
        if (this.patternHistory.length === 0) {
            return [];
        }
        // Return the most recent pattern
        return this.patternHistory[this.patternHistory.length - 1].pattern;
    }

    getPatternForDate(date) {
        if (this.patternHistory.length === 0) {
            return [];
        }
        
        const dateStr = this.formatDate(date);
        
        // Find the most recent pattern that is effective on or before this date
        let effectivePattern = this.patternHistory[0].pattern;
        for (let i = 0; i < this.patternHistory.length; i++) {
            if (this.patternHistory[i].effectiveDate <= dateStr) {
                effectivePattern = this.patternHistory[i].pattern;
            } else {
                break;
            }
        }
        
        return effectivePattern;
    }

    addPerson(name) {
        if (!name || name.trim() === '') return;
        const currentPattern = this.getCurrentPattern();
        const updatedPattern = [...currentPattern, name.trim()];
        
        // Add a new pattern entry with today's date
        const today = this.formatDate(new Date());
        this.patternHistory.push({
            effectiveDate: today,
            pattern: updatedPattern
        });
        
        this.saveToStorage();
        this.renderPattern();
        this.renderWeek();
    }
    
    updatePatternFromMultiSelect() {
        if (!this.patternMultiSelect) return;
        
        const newPattern = this.patternMultiSelect.getValues();
        const dateInput = document.getElementById('patternEffectiveDate');
        let effectiveDate = dateInput?.value || this.formatDate(new Date());
        
        // Validate date is not in the past
        const selectedDate = new Date(effectiveDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            alert('Effective date cannot be in the past. Please select today or a future date.');
            effectiveDate = this.formatDate(today);
            if (dateInput) {
                dateInput.value = effectiveDate;
            }
        }
        
        // Add a new pattern entry with the specified effective date
        this.patternHistory.push({
            effectiveDate: effectiveDate,
            pattern: newPattern
        });
        
        this.saveToStorage();
        this.renderPattern();
        this.renderWeek();
        
        // Reset the date to today for next change
        if (dateInput) {
            dateInput.value = this.formatDate(new Date());
        }
    }
    
    // Helper method to parse comma-separated assignee strings into an array
    parseAssignees(assigneeString) {
        if (!assigneeString) return [];
        return assigneeString.split(',').map(a => a.trim()).filter(a => a);
    }

    removePerson(index) {
        const currentPattern = this.getCurrentPattern();
        const updatedPattern = currentPattern.filter((_, i) => i !== index);
        
        // Add a new pattern entry with today's date
        const today = this.formatDate(new Date());
        this.patternHistory.push({
            effectiveDate: today,
            pattern: updatedPattern
        });
        
        this.saveToStorage();
        this.renderPattern();
        this.renderWeek();
    }

    swapPersons(index1, index2) {
        const currentPattern = this.getCurrentPattern();
        if (index1 < 0 || index2 < 0 || index1 >= currentPattern.length || index2 >= currentPattern.length) {
            return;
        }
        const updatedPattern = [...currentPattern];
        [updatedPattern[index1], updatedPattern[index2]] = [updatedPattern[index2], updatedPattern[index1]];
        
        // Add a new pattern entry with today's date
        const today = this.formatDate(new Date());
        this.patternHistory.push({
            effectiveDate: today,
            pattern: updatedPattern
        });
        
        this.saveToStorage();
        this.renderPattern();
        this.renderWeek();
    }

    movePersonTo(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        const currentPattern = this.getCurrentPattern();
        const updatedPattern = [...currentPattern];
        const person = updatedPattern.splice(fromIndex, 1)[0];
        updatedPattern.splice(toIndex, 0, person);
        
        // Add a new pattern entry with today's date
        const today = this.formatDate(new Date());
        this.patternHistory.push({
            effectiveDate: today,
            pattern: updatedPattern
        });
        
        this.saveToStorage();
        this.renderPattern();
        this.renderWeek();
    }

    // Daily Tasks Management
    addTask(date, taskDescription, assignee = '', startTime = '', endTime = '', note = '') {
        const dateStr = this.formatDate(date);
        if (!this.dailyTasks[dateStr]) {
            this.dailyTasks[dateStr] = [];
        }
        this.dailyTasks[dateStr].push({
            id: Date.now() + '-' + Math.random(),
            description: taskDescription.trim(),
            assignee: assignee.trim(), // Can be comma-separated for multiple people
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            note: note.trim()
        });
        this.saveToStorage();
        this.renderTasks();
        this.renderWeek();
    }

    updateTask(dateStr, taskId, taskDescription, assignee = '', startTime = '', endTime = '', note = '') {
        if (this.dailyTasks[dateStr]) {
            const taskIndex = this.dailyTasks[dateStr].findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                this.dailyTasks[dateStr][taskIndex] = {
                    id: taskId,
                    description: taskDescription.trim(),
                    assignee: assignee.trim(),
                    startTime: startTime.trim(),
                    endTime: endTime.trim(),
                    note: note.trim()
                };
                this.saveToStorage();
                this.renderTasks();
                this.renderWeek();
            }
        }
    }

    removeTask(dateStr, taskId) {
        if (this.dailyTasks[dateStr]) {
            this.dailyTasks[dateStr] = this.dailyTasks[dateStr].filter(task => task.id !== taskId);
            if (this.dailyTasks[dateStr].length === 0) {
                delete this.dailyTasks[dateStr];
            }
            this.saveToStorage();
            this.renderTasks();
            this.renderWeek();
        }
    }

    getTasksForDate(dateStr) {
        return this.dailyTasks[dateStr] || [];
    }

    // Get unique task descriptions for autocomplete
    getUniqueDescriptions() {
        const descriptions = new Set();
        Object.values(this.dailyTasks).forEach(tasks => {
            tasks.forEach(task => {
                if (task.description) {
                    descriptions.add(task.description);
                }
            });
        });
        return Array.from(descriptions).sort();
    }

    // Get unique assignees for autocomplete
    getUniqueAssignees() {
        const assignees = new Set();
        
        // Add people from pattern history
        this.patternHistory.forEach(entry => {
            entry.pattern.forEach(person => assignees.add(person));
        });
        
        // Add assignees from tasks
        Object.values(this.dailyTasks).forEach(tasks => {
            tasks.forEach(task => {
                if (task.assignee) {
                    // Split by comma in case of multiple assignees
                    this.parseAssignees(task.assignee).forEach(name => {
                        assignees.add(name);
                    });
                }
            });
        });
        
        return Array.from(assignees).sort();
    }

    // Get time suggestions based on task description
    getTimeSuggestionsForTask(description) {
        const suggestions = {
            startTime: '',
            endTime: ''
        };
        
        let startTimeCount = 0;
        let endTimeCount = 0;
        let totalStartMinutes = 0;
        let totalEndMinutes = 0;
        
        Object.values(this.dailyTasks).forEach(tasks => {
            tasks.forEach(task => {
                if (task.description === description) {
                    // Validate and process start time
                    if (task.startTime && /^\d{2}:\d{2}$/.test(task.startTime)) {
                        const [hours, minutes] = task.startTime.split(':').map(Number);
                        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
                            totalStartMinutes += hours * 60 + minutes;
                            startTimeCount++;
                        }
                    }
                    // Validate and process end time
                    if (task.endTime && /^\d{2}:\d{2}$/.test(task.endTime)) {
                        const [hours, minutes] = task.endTime.split(':').map(Number);
                        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
                            totalEndMinutes += hours * 60 + minutes;
                            endTimeCount++;
                        }
                    }
                }
            });
        });
        
        // Calculate average start time
        if (startTimeCount > 0) {
            const avgMinutes = Math.round(totalStartMinutes / startTimeCount);
            const hours = Math.floor(avgMinutes / 60);
            const minutes = avgMinutes % 60;
            suggestions.startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        
        // Calculate average end time
        if (endTimeCount > 0) {
            const avgMinutes = Math.round(totalEndMinutes / endTimeCount);
            const hours = Math.floor(avgMinutes / 60);
            const minutes = avgMinutes % 60;
            suggestions.endTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        
        return suggestions;
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
        
        // Check for tasks marked as assignments (for backward compatibility)
        const tasks = this.getTasksForDate(dateStr);
        const assignment = tasks.find(task => task.isAssignment);
        if (assignment) {
            return { person: assignment.assignee || assignment.description, note: assignment.note || '' };
        }

        // Use pattern for this date
        const pattern = this.getPatternForDate(date);
        if (pattern.length === 0) {
            return { person: 'No pattern set', note: '' };
        }

        // Calculate weeks since epoch (weekly rotation)
        const epoch = new Date('2024-01-01');
        const daysSinceEpoch = Math.floor((date - epoch) / (1000 * 60 * 60 * 24));
        const weeksSinceEpoch = Math.floor(daysSinceEpoch / 7);
        const personIndex = weeksSinceEpoch % pattern.length;
        
        // Support multiple people (comma-separated)
        const people = pattern[personIndex];
        return { person: people, note: '' };
    }

    // Rendering
    renderAll() {
        this.setupMultiSelects();
        this.renderWeek();
        this.renderPattern();
        this.renderTasks();
        this.setDefaultEffectiveDate();
    }
    
    setupMultiSelects() {
        // Initialize pattern multi-select
        const patternContainer = document.getElementById('patternMultiSelect');
        if (patternContainer && !this.patternMultiSelect) {
            this.patternMultiSelect = new MultiSelect(patternContainer, {
                placeholder: 'Add people to pattern...',
                getSuggestions: () => this.getUniqueAssignees(),
                onChange: (values) => {
                    // Values will be applied when button is clicked
                },
                allowMultiple: true,
                initialValues: this.getCurrentPattern()
            });
        } else if (this.patternMultiSelect) {
            // Update values if already initialized
            this.patternMultiSelect.setValues(this.getCurrentPattern());
        }
        
        // Initialize assignee multi-select
        const assigneeContainer = document.getElementById('assigneeMultiSelect');
        if (assigneeContainer && !this.assigneeMultiSelect) {
            this.assigneeMultiSelect = new MultiSelect(assigneeContainer, {
                placeholder: 'Assign to people (optional)...',
                getSuggestions: () => this.getUniqueAssignees(),
                onChange: (values) => {
                    // Values will be read when task is added
                },
                allowMultiple: true,
                initialValues: []
            });
        }
    }
    
    setDefaultEffectiveDate() {
        // Set the effective date to today by default
        const dateInput = document.getElementById('patternEffectiveDate');
        if (dateInput && !dateInput.value) {
            dateInput.value = this.formatDate(new Date());
        }
    }

    hasWeekendActivity(dates) {
        // Check if Saturday (index 5) or Sunday (index 6) have tasks
        for (let i = 5; i <= 6; i++) {
            const dateStr = this.formatDate(dates[i]);
            // Check for tasks
            if (this.dailyTasks[dateStr] && this.dailyTasks[dateStr].length > 0) {
                return true;
            }
        }
        return false;
    }

    renderWeek() {
        // Render three weeks: previous, current, and next
        this.renderSingleWeek('prev', -1);
        this.renderSingleWeek('current', 0);
        this.renderSingleWeek('next', 1);
    }

    renderSingleWeek(weekType, weekOffset) {
        // Calculate the date for this week
        const baseDate = new Date(this.currentViewDate);
        baseDate.setDate(baseDate.getDate() + (weekOffset * 7));
        
        const allDates = this.getWeekDates(baseDate);
        const weekNumber = this.getWeekNumber(baseDate);
        
        // Determine if we should show only working days (Mon-Fri) or full week
        const showWeekend = this.hasWeekendActivity(allDates);
        const dates = showWeekend ? allDates : allDates.slice(0, 5);
        
        // Update week info
        const weekNumberElement = document.getElementById(`${weekType}WeekNumber`);
        const weekDatesElement = document.getElementById(`${weekType}WeekDates`);
        
        if (weekNumberElement && weekDatesElement) {
            weekNumberElement.textContent = `Week ${weekNumber}`;
            const startDate = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const endDate = dates[dates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            weekDatesElement.textContent = `${startDate} - ${endDate}`;
        }

        // Render days
        const weekDaysContainer = document.getElementById(`${weekType}WeekDays`);
        if (!weekDaysContainer) return;
        
        weekDaysContainer.innerHTML = '';

        const today = this.formatDate(new Date());

        dates.forEach((date, index) => {
            const dateStr = this.formatDate(date);
            const assignment = this.getPersonForDate(date);
            const tasks = this.getTasksForDate(dateStr);
            const isToday = dateStr === today;
            
            // Check if this date is in the past (compare at midnight)
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const isPastDate = date < startOfToday;

            const dayCard = document.createElement('div');
            dayCard.className = `day-card ${isToday ? 'today' : ''} ${isPastDate ? 'past-date' : ''}`;
            
            let tasksHtml = '';
            if (tasks.length > 0) {
                tasksHtml = '<div class="day-tasks">';
                tasks.forEach(task => {
                    // Skip tasks marked as assignments (already shown as main person)
                    if (task.isAssignment) return;
                    
                    let taskInfo = task.description;
                    
                    // Add assignee if present
                    if (task.assignee) {
                        taskInfo += ` (${task.assignee})`;
                    }
                    
                    // Add time info if present
                    if (task.startTime || task.endTime) {
                        const timeParts = [];
                        if (task.startTime) timeParts.push(task.startTime);
                        if (task.endTime) timeParts.push(task.endTime);
                        taskInfo += ` ${timeParts.join('-')}`;
                    }
                    
                    // Add note if present
                    if (task.note) {
                        taskInfo += ` - ${task.note}`;
                    }
                    
                    tasksHtml += `<div class="day-task">📌 ${taskInfo}</div>`;
                });
                tasksHtml += '</div>';
            }
            
            dayCard.innerHTML = `
                <div class="day-name">${this.dayNames[index]}</div>
                <div class="day-date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div class="day-person">${assignment.person}</div>
                ${assignment.note ? `<div class="day-note">${assignment.note}</div>` : ''}
                ${tasksHtml}
            `;

            weekDaysContainer.appendChild(dayCard);
        });
    }

    renderPattern() {
        const patternList = document.getElementById('patternList');
        const currentPattern = this.getCurrentPattern();
        
        if (currentPattern.length === 0) {
            patternList.innerHTML = '<div class="empty-state"><p>No people in the pattern. Add someone to get started!</p></div>';
            return;
        }

        patternList.innerHTML = '';
        
        currentPattern.forEach((person, index) => {
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
                    ${index < currentPattern.length - 1 ? `<button class="btn btn-small btn-secondary move-down-btn" data-index="${index}">↓</button>` : ''}
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
                if (confirm(`Remove ${currentPattern[index]} from the pattern?`)) {
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

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        
        const sortedDates = Object.keys(this.dailyTasks).sort();
        
        if (sortedDates.length === 0) {
            tasksList.innerHTML = '<div class="empty-state"><p>No tasks or assignments set. Add one to get started.</p></div>';
            return;
        }

        tasksList.innerHTML = '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        sortedDates.forEach(dateStr => {
            const tasks = this.dailyTasks[dateStr];
            // Parse date string (format: YYYY-MM-DD) and set to midnight for comparison
            const date = new Date(dateStr + 'T00:00:00');
            const isPast = date < today;
            
            tasks.forEach(task => {
                const item = document.createElement('div');
                item.className = `task-item ${isPast ? 'task-past' : ''}`;

                const statusLabel = isPast ? '<span class="task-status task-status-past">Past</span>' : '<span class="task-status task-status-upcoming">Upcoming</span>';

                // Build display parts
                let displayParts = [];
                
                // Description
                displayParts.push(`<span class="task-description">📌 ${task.description}</span>`);
                
                // Assignee
                if (task.assignee) {
                    displayParts.push(`<span class="task-assignee">Assigned to: ${task.assignee}</span>`);
                }
                
                // Time
                if (task.startTime || task.endTime) {
                    const timeParts = [];
                    if (task.startTime) timeParts.push(`Start: ${task.startTime}`);
                    if (task.endTime) timeParts.push(`End: ${task.endTime}`);
                    displayParts.push(`<span class="task-time">${timeParts.join(' • ')}</span>`);
                }
                
                // Note
                if (task.note) {
                    displayParts.push(`<span class="task-note">Note: ${task.note}</span>`);
                }

                item.innerHTML = `
                    <div class="task-item-info">
                        <span class="task-date">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        ${statusLabel}
                        ${displayParts.join('')}
                    </div>
                    <div class="task-item-actions">
                        <button class="btn btn-small btn-secondary edit-task-btn" data-date="${dateStr}" data-task-id="${task.id}">Edit</button>
                        <button class="btn btn-small btn-danger remove-task-btn" data-date="${dateStr}" data-task-id="${task.id}">Remove</button>
                    </div>
                `;

                tasksList.appendChild(item);
            });
        });

        // Add event listeners for edit buttons
        tasksList.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dateStr = e.target.dataset.date;
                const taskId = e.target.dataset.taskId;
                this.editTask(dateStr, taskId);
            });
        });

        // Add event listeners for remove buttons
        tasksList.querySelectorAll('.remove-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dateStr = e.target.dataset.date;
                const taskId = e.target.dataset.taskId;
                if (confirm('Remove this task?')) {
                    this.removeTask(dateStr, taskId);
                }
            });
        });
    }

    editTask(dateStr, taskId) {
        const tasks = this.dailyTasks[dateStr];
        if (!tasks) return;
        
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Populate form fields
        document.getElementById('taskDate').value = dateStr;
        document.getElementById('taskDescription').value = task.description;
        
        // Set assignee multi-select values
        if (this.assigneeMultiSelect && task.assignee) {
            const assignees = this.parseAssignees(task.assignee);
            this.assigneeMultiSelect.setValues(assignees);
        }
        
        document.getElementById('taskStartTime').value = task.startTime || '';
        document.getElementById('taskEndTime').value = task.endTime || '';
        document.getElementById('taskNote').value = task.note || '';
        
        // Store the task being edited
        this.editingTaskId = taskId;
        this.editingTaskDate = dateStr;
        
        // Update button text
        const addBtn = document.getElementById('addTaskBtn');
        addBtn.textContent = 'Update Task';
        addBtn.classList.add('btn-warning');
        
        // Scroll to form
        document.querySelector('.tasks-assignments').scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        this.editingTaskId = null;
        this.editingTaskDate = null;
        
        const addBtn = document.getElementById('addTaskBtn');
        addBtn.textContent = 'Add Task';
        addBtn.classList.remove('btn-warning');
        
        // Clear form
        document.getElementById('taskDate').value = '';
        document.getElementById('taskDescription').value = '';
        if (this.assigneeMultiSelect) {
            this.assigneeMultiSelect.clear();
        }
        document.getElementById('taskStartTime').value = '';
        document.getElementById('taskEndTime').value = '';
        document.getElementById('taskNote').value = '';
    }

    // Event Listeners
    setupEventListeners() {
        // Update pattern from multi-select
        document.getElementById('addPersonBtn').addEventListener('click', () => {
            this.updatePatternFromMultiSelect();
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

        // Add task/assignment
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            const dateInput = document.getElementById('taskDate');
            const descriptionInput = document.getElementById('taskDescription');
            const startTimeInput = document.getElementById('taskStartTime');
            const endTimeInput = document.getElementById('taskEndTime');
            const noteInput = document.getElementById('taskNote');

            if (dateInput.value && descriptionInput.value) {
                // Get assignees from multi-select
                const assignees = this.assigneeMultiSelect ? this.assigneeMultiSelect.getValues().join(', ') : '';
                
                // Check if we're editing or adding
                if (this.editingTaskId) {
                    this.updateTask(
                        this.editingTaskDate,
                        this.editingTaskId,
                        descriptionInput.value,
                        assignees,
                        startTimeInput?.value || '',
                        endTimeInput?.value || '',
                        noteInput?.value || ''
                    );
                    this.cancelEdit();
                } else {
                    this.addTask(
                        dateInput.value, 
                        descriptionInput.value,
                        assignees,
                        startTimeInput?.value || '',
                        endTimeInput?.value || '',
                        noteInput?.value || ''
                    );
                }
                dateInput.value = '';
                descriptionInput.value = '';
                if (this.assigneeMultiSelect) {
                    this.assigneeMultiSelect.clear();
                }
                startTimeInput && (startTimeInput.value = '');
                endTimeInput && (endTimeInput.value = '');
                noteInput && (noteInput.value = '');
            } else {
                alert('Please enter both date and description');
            }
        });

        // Auto-fill times based on task description
        document.getElementById('taskDescription').addEventListener('change', (e) => {
            if (!this.editingTaskId) { // Only auto-fill when adding new tasks
                const description = e.target.value.trim();
                if (description) {
                    const suggestions = this.getTimeSuggestionsForTask(description);
                    const startTimeInput = document.getElementById('taskStartTime');
                    const endTimeInput = document.getElementById('taskEndTime');
                    
                    if (suggestions.startTime && !startTimeInput.value) {
                        startTimeInput.value = suggestions.startTime;
                    }
                    if (suggestions.endTime && !endTimeInput.value) {
                        endTimeInput.value = suggestions.endTime;
                    }
                }
            }
        });

        // Setup autocomplete datalists
        this.setupAutocomplete();


        // Share functionality
        document.getElementById('shareBtn').addEventListener('click', () => {
            // Build the URL with current data and viewMode
            const data = {
                patternHistory: this.patternHistory,
                dailyTasks: this.dailyTasks
            };
            const encoded = btoa(JSON.stringify(data));
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set('data', encoded);
            url.searchParams.set('viewMode', 'true'); // Default to read-only mode for shared URLs
            
            navigator.clipboard.writeText(url.toString()).then(() => {
                alert('OPS Planning Schedule URL copied to clipboard! Recipients will open in read-only mode.');
            }).catch(err => {
                alert('Failed to copy URL. Please copy it manually from the address bar.');
            });
        });

        // Toggle view mode
        document.getElementById('toggleViewMode').addEventListener('click', () => {
            this.toggleViewMode();
        });

        // Export data
        document.getElementById('exportBtn').addEventListener('click', () => {
            const data = {
                patternHistory: this.patternHistory,
                dailyTasks: this.dailyTasks
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
                            // Load pattern history or migrate
                            if (data.patternHistory && Array.isArray(data.patternHistory)) {
                                this.patternHistory = data.patternHistory;
                            } else if (data.pattern && Array.isArray(data.pattern)) {
                                this.patternHistory = [{
                                    effectiveDate: this.formatDate(new Date()),
                                    pattern: data.pattern
                                }];
                            }
                            
                            this.dailyTasks = data.dailyTasks || {};
                            
                            // Migrate old format if present
                            if (data.specificAssignments) {
                                Object.keys(data.specificAssignments).forEach(dateStr => {
                                    const assignment = data.specificAssignments[dateStr];
                                    if (!this.dailyTasks[dateStr]) {
                                        this.dailyTasks[dateStr] = [];
                                    }
                                    this.dailyTasks[dateStr].push({
                                        id: Date.now() + '-' + Math.random(),
                                        description: assignment.person,
                                        assignee: assignment.person,
                                        note: assignment.note || '',
                                        startTime: '',
                                        endTime: '',
                                        isAssignment: true
                                    });
                                });
                            }
                            this.saveToStorage();
                            this.renderAll();
                            this.setupAutocomplete(); // Refresh autocomplete after import
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

    setupAutocomplete() {
        // Keep description autocomplete
        let descriptionDatalist = document.getElementById('taskDescriptionList');
        if (!descriptionDatalist) {
            descriptionDatalist = document.createElement('datalist');
            descriptionDatalist.id = 'taskDescriptionList';
            document.body.appendChild(descriptionDatalist);
        }
        
        // Link input to datalist
        const descriptionInput = document.getElementById('taskDescription');
        if (descriptionInput) {
            descriptionInput.setAttribute('list', 'taskDescriptionList');
        }
        
        // Populate datalist
        const descriptions = this.getUniqueDescriptions();
        descriptionDatalist.innerHTML = '';
        descriptions.forEach(desc => {
            const option = document.createElement('option');
            option.value = desc;
            descriptionDatalist.appendChild(option);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new OPSPlanning();
});
