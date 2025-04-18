// script.js - Main application logic

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const birthdayListSection = document.getElementById('birthday-list-section');
    const addEditSection = document.getElementById('add-edit-section');
    const detailSection = document.getElementById('detail-section');
    const howItWorksSection = document.getElementById('how-it-works-section');
    const faqSection = document.getElementById('faq-section');

    const birthdayListUl = document.getElementById('birthday-list');
    const addBirthdayBtnMain = document.getElementById('add-birthday-btn-main');

    // Search elements
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');

    // Theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // Menu elements
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const menuOverlay = document.getElementById('menu-overlay');

    // Form elements
    const birthdayForm = document.getElementById('birthday-form');
    const formTitle = document.getElementById('form-title');
    const birthdayIdInput = document.getElementById('birthday-id');
    const nameInput = document.getElementById('name');
    const dobInput = document.getElementById('dob');
    const phoneInput = document.getElementById('phone');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const deleteBtn = document.getElementById('delete-btn');

    // Detail elements
    const backToListBtn = document.getElementById('back-to-list-btn');
    const birthdayDetailsDiv = document.getElementById('birthday-details');
    const countdownDiv = document.getElementById('countdown');
    const editBirthdayBtn = document.getElementById('edit-birthday-btn');
    // Contact action buttons
    const messageBtn = document.getElementById('message-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const callBtn = document.getElementById('call-btn');


    // Header action buttons
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportIcsBtn = document.getElementById('export-ics-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const repairDbBtn = document.getElementById('repair-db-btn');

    // Footer year element
    const currentYearSpan = document.getElementById('current-year');

    // Navigation elements
    const siteTitle = document.getElementById('site-title');
    const howItWorksBtn = document.getElementById('how-it-works-btn');
    const faqBtn = document.getElementById('faq-btn');

    let currentView = 'list'; // 'list', 'form', 'detail', 'how-it-works', 'faq'
    let currentBirthdayId = null; // ID of birthday being viewed/edited
    let countdownInterval = null; // To store the interval ID for the countdown timer
    let allBirthdays = []; // Store all birthdays for filtering
    let currentSearchTerm = ''; // Track current search term

    // Georgian Month Names (for reliable display)
    const georgianMonths = [
        "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
        "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
    ];

    // Constants

    // --- Utility Functions (from utils.js, accessed via window.utils) ---
    const {
        calculateAge,
        getNextBirthdayDate,
        calculateDaysRemaining,
        formatDate, // Keep for other date formatting if needed
        calculateCountdown,
        getZodiacSign,
        generateICS,
        generateCSV,
    } = window.utils;

    // --- Database Functions (from db.js, accessed via window.db) ---
    const {
        addBirthday,
        getAllBirthdays,
        getBirthdayById,
        updateBirthday,
        deleteBirthday,
        clearAllBirthdays
    } = window.db;

    // --- Core Functions ---

    /**
     * Renders the list of birthdays, applying any search filters.
     */
    async function renderBirthdayList() {
        try {
            allBirthdays = await getAllBirthdays();
            let displayBirthdays = allBirthdays;
            
            // Apply search filter if there is a search term
            if (currentSearchTerm) {
                displayBirthdays = filterBirthdays(allBirthdays, currentSearchTerm);
            }
            
            birthdayListUl.innerHTML = ''; // Clear existing list or loading message

            if (displayBirthdays.length === 0) {
                birthdayListUl.innerHTML = '<li class="loading">დაბადების დღეები არ არის დამატებული.</li>';
                return;
            }

            const birthdaysWithDetails = displayBirthdays.map(b => ({
                ...b,
                nextBirthdayDate: getNextBirthdayDate(b.dob),
                daysLeft: calculateDaysRemaining(b.dob),
                zodiac: getZodiacSign(b.dob) // Add zodiac for searching
            }));

            // Filter out any invalid future dates (e.g., dates in 2026)
            const today = new Date();
            const oneYearFromNow = new Date(today);
            oneYearFromNow.setFullYear(today.getFullYear() + 1);
            
            const validBirthdays = birthdaysWithDetails.filter(b => {
                // Validate that the date is not more than 1 year in the future
                if (b.nextBirthdayDate > oneYearFromNow) {
                    console.error("Filtered out invalid future birthday:", b.name, b.nextBirthdayDate);
                    return false;
                }
                return true;
            });

            validBirthdays.sort((a, b) => a.daysLeft - b.daysLeft);

            const groupedBirthdays = validBirthdays.reduce((acc, b) => {
                const monthIndex = b.nextBirthdayDate.getMonth();
                if (!acc[monthIndex]) {
                    acc[monthIndex] = [];
                }
                acc[monthIndex].push(b);
                return acc;
            }, {});

            const currentMonthIndex = new Date().getMonth();
            const monthOrder = [];
            for (let i = 0; i < 12; i++) {
                monthOrder.push((currentMonthIndex + i) % 12);
            }

            let foundBirthdays = false;
            monthOrder.forEach(monthIndex => {
                if (groupedBirthdays[monthIndex]) {
                    foundBirthdays = true;
                    // Add month header using Georgian names array
                    const monthName = georgianMonths[monthIndex]; 
                    if (!monthName) { 
                        console.error("Invalid month index:", monthIndex);
                        return; 
                    }
                    const headerLi = document.createElement('li');
                    headerLi.classList.add('month-header');
                    headerLi.textContent = monthName;
                    birthdayListUl.appendChild(headerLi);

                    // Add birthdays for this month
                    groupedBirthdays[monthIndex].forEach(b => {
                        const li = document.createElement('li');
                        li.dataset.id = b.id; // Store ID for click handling

                        const age = calculateAge(b.dob);
                        let nextBirthdayFormatted = 'თარიღის შეცდომა'; // Default error message
                        try {
                             nextBirthdayFormatted = new Intl.DateTimeFormat('ka-GE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(b.nextBirthdayDate);
                        } catch (e) {
                            console.error("Error formatting date for list item:", b.nextBirthdayDate, e);
                        }

                        // If searching, highlight matching text
                        let nameDisplay = b.name;
                        let dateDisplay = nextBirthdayFormatted;
                        
                        if (currentSearchTerm) {
                            const searchLower = currentSearchTerm.toLowerCase();
                            
                            if (b.name.toLowerCase().includes(searchLower)) {
                                nameDisplay = highlightMatch(b.name, searchLower);
                            }
                            
                            // Try to highlight date if it's a match
                            if (nextBirthdayFormatted.toLowerCase().includes(searchLower)) {
                                dateDisplay = highlightMatch(nextBirthdayFormatted, searchLower);
                            }
                            
                            // If zodiac is being searched
                            if (b.zodiac.toLowerCase().includes(searchLower)) {
                                // Maybe add a small zodiac indicator that's highlighted
                                dateDisplay += ` • <span class="highlight">${b.zodiac}</span>`;
                            }
                        }

                        li.innerHTML = `
                            <div class="icon">🎂</div>
                            <div class="info">
                                <div class="name">${nameDisplay}</div>
                                <div class="date">${dateDisplay} • გახდება ${age + 1}</div>
                            </div>
                            <div class="days-left">
                                ${b.daysLeft === 0 ? 'დღეს!' : b.daysLeft}
                                <span>${b.daysLeft !== 0 ? 'დღე' : ''}</span>
                            </div>
                        `;
                        li.addEventListener('click', () => showDetailView(b.id));
                        birthdayListUl.appendChild(li);
                    });
                }
            });

             if (!foundBirthdays && displayBirthdays.length > 0) {
                 console.warn("No birthdays found to render, although data exists. Check grouping/filtering logic.");
                 birthdayListUl.innerHTML = '<li class="loading">ვერ მოიძებნა შესაბამისი დაბადების დღეები.</li>';
             } else if (!foundBirthdays && displayBirthdays.length === 0) {
                 birthdayListUl.innerHTML = '<li class="loading">დაბადების დღეები არ არის დამატებული.</li>';
             }

        } catch (error) {
            console.error("Error rendering birthday list:", error);
            birthdayListUl.innerHTML = '<li class="loading error">სიის ჩატვირთვის შეცდომა.</li>';
        }
    }

    /**
     * Shows the specified view ('list', 'form', 'detail', 'how-it-works', 'faq') and hides others.
     * @param {'list' | 'form' | 'detail' | 'how-it-works' | 'faq'} viewName
     */
    function showView(viewName) {
        currentView = viewName;
        
        // Hide all sections first
        birthdayListSection.classList.add('hidden');
        addEditSection.classList.add('hidden');
        detailSection.classList.add('hidden');
        howItWorksSection.classList.add('hidden');
        faqSection.classList.add('hidden');
        
        // Show the requested section
        if (viewName === 'list') {
            birthdayListSection.classList.remove('hidden');
        } else if (viewName === 'form') {
            addEditSection.classList.remove('hidden');
        } else if (viewName === 'detail') {
            detailSection.classList.remove('hidden');
        } else if (viewName === 'how-it-works') {
            howItWorksSection.classList.remove('hidden');
        } else if (viewName === 'faq') {
            faqSection.classList.remove('hidden');
        }

        // Update navigation buttons
        updateNavButtons(viewName);

        if (viewName !== 'detail' && countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (viewName === 'form' && !currentBirthdayId) {
            resetForm();
        }
    }

    /**
     * Updates the active state of navigation buttons.
     */
    function updateNavButtons(viewName) {
        // Remove active class from all nav buttons
        howItWorksBtn.classList.remove('active');
        faqBtn.classList.remove('active');
        
        // Add active class to the current button
        if (viewName === 'how-it-works') {
            howItWorksBtn.classList.add('active');
        } else if (viewName === 'faq') {
            faqBtn.classList.add('active');
        }
    }

    /**
     * Resets the add/edit form to its default state.
     */
    function resetForm() {
        birthdayIdInput.value = '';
        nameInput.value = '';
        dobInput.value = '';
        phoneInput.value = '';
        
        // Clear any error messages or styles
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        
        deleteBtn.classList.add('hidden');
        formTitle.textContent = 'ახალი დაბადების დღის დამატება';
    }

    /**
     * Populates the form with data for editing.
     * @param {object} birthday - The birthday object to edit.
     */
    function populateForm(birthday) {
        birthdayIdInput.value = birthday.id;
        nameInput.value = birthday.name;
        dobInput.value = birthday.dob;
        phoneInput.value = birthday.phone || '';
        
        deleteBtn.classList.remove('hidden');
        formTitle.textContent = 'დაბადების დღის რედაქტირება';
    }

    /**
     * Handles form submission to add or update a birthday.
     * @param {Event} event - The form submit event.
     */
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        const birthdayData = {
            name: nameInput.value.trim(),
            dob: dobInput.value,
            phone: phoneInput.value.trim() || null
        };
        
        // Add ID if editing an existing birthday
        if (birthdayIdInput.value) {
            birthdayData.id = parseInt(birthdayIdInput.value);
        }

        if (!birthdayData.name || !birthdayData.dob) {
            alert("გთხოვთ შეავსოთ სახელის და თარიღის ველები.");
            return;
        }

        try {
            if (currentBirthdayId) {
                birthdayData.id = currentBirthdayId;
                await updateBirthday(birthdayData);
            } else {
                await addBirthday(birthdayData);
            }
            resetForm();
            showView('list');
            await renderBirthdayList();
            
            // Create a backup after saving
            createLocalStorageBackup();
        } catch (error) {
            console.error("Error saving birthday:", error);
            alert("დაბადების დღის შენახვის შეცდომა.");
        }
    }

    /**
     * Handles deletion of a birthday.
     */
    async function handleDelete() {
        if (!currentBirthdayId) return;

        if (!confirm(`დარწმუნებული ხართ რომ გსურთ '${nameInput.value}'-ის წაშლა?`)) {
            return;
        }

        try {
            await deleteBirthday(currentBirthdayId);
            resetForm();
            showView('list');
            await renderBirthdayList();
            
            // Create a backup after deleting
            createLocalStorageBackup();
        } catch (error) {
            console.error("Error deleting birthday:", error);
            alert("დაბადების დღის წაშლის შეცდომა.");
        }
    }

    /**
     * Handles clearing all birthdays.
     */
    async function handleClearAll() {
        if (confirm('დარწმუნებული ხართ, რომ გსურთ ყველა დაბადების დღის წაშლა? \nეს ოპერაცია არ არის შექცევადი.')) {
            try {
                const loadingIndicator = document.createElement('div');
                loadingIndicator.className = 'loading-indicator';
                loadingIndicator.textContent = 'მონაცემები იშლება...';
                document.body.appendChild(loadingIndicator);
                
                // Create a backup before clearing all data
                createLocalStorageBackup();
                
                await clearAllBirthdays();
                
                document.body.removeChild(loadingIndicator);
                alert('ყველა მონაცემი წარმატებით წაიშალა.');
                await renderBirthdayList();
                closeMenu();
            } catch (error) {
                console.error("Error clearing all birthdays:", error);
                alert("შეცდომა მონაცემების წაშლისას.");
            }
        }
    }

    /**
     * Creates a backup of all birthday data in localStorage
     */
    async function createLocalStorageBackup() {
        try {
            const allData = await getAllBirthdays();
            if (allData && allData.length > 0) {
                // Limit backup to the most recent 100 records to avoid localStorage quota issues
                const dataToBackup = allData.length > 100 ? 
                    allData.slice(Math.max(0, allData.length - 100)) : 
                    allData;
                
                try {
                    localStorage.setItem('birthdayAppBackup', JSON.stringify(dataToBackup));
                    console.log(`Created localStorage backup with ${dataToBackup.length} items` +
                        (allData.length > 100 ? ` (limited from ${allData.length} total)` : ''));
                    
                    // Also store a count of total records for recovery purposes
                    localStorage.setItem('birthdayAppBackupTotalCount', allData.length.toString());
                } catch (storageError) {
                    console.warn("LocalStorage quota exceeded, creating minimal backup instead");
                    
                    // If quota is exceeded, try a minimal backup with just the essential fields
                    const minimalBackup = dataToBackup.map(({ id, name, dob, phone }) => ({ id, name, dob, phone }));
                    localStorage.setItem('birthdayAppBackup', JSON.stringify(minimalBackup));
                    console.log(`Created minimal localStorage backup with ${minimalBackup.length} items`);
                }
            }
        } catch (error) {
            console.error("Error creating localStorage backup:", error);
        }
    }

    /**
     * Shows the detail view for a specific birthday.
     * @param {number} id - The ID of the birthday to show.
     */
    async function showDetailView(id) {
        try {
            const birthday = await getBirthdayById(id);
            if (!birthday) {
                alert("დაბადების დღე ვერ მოიძებნა.");
                showView('list');
                return;
            }

            currentBirthdayId = birthday.id;
            
            // Display basic details
            const dob = new Date(birthday.dob);
            const age = calculateAge(birthday.dob);
            const nextBirthdayDate = getNextBirthdayDate(birthday.dob);
            const zodiac = getZodiacSign(birthday.dob);
            
            let birthdayDateFormatted;
            try {
                birthdayDateFormatted = new Intl.DateTimeFormat('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' }).format(dob);
            } catch (e) {
                console.error("Error formatting birth date:", e);
                birthdayDateFormatted = birthday.dob; // Fallback to raw date
            }
            
            birthdayDetailsDiv.innerHTML = `
                <h2>${birthday.name}</h2>
                <div class="detail-row"><span class="detail-label">დაბადების თარიღი:</span> <span>${birthdayDateFormatted}</span></div>
                <div class="detail-row"><span class="detail-label">ასაკი:</span> <span>${age} წელი</span></div>
                <div class="detail-row"><span class="detail-label">ზოდიაქო:</span> <span>${zodiac}</span></div>
                ${birthday.phone ? `<div class="detail-row"><span class="detail-label">ტელეფონი:</span> <span>${birthday.phone}</span></div>` : ''}
            `;

            if (countdownInterval) clearInterval(countdownInterval);

            function updateCountdown() {
                const countdownData = calculateCountdown(nextBirthdayDate);
                if (countdownData && !countdownData.isPast) {
                    countdownDiv.innerHTML = `
                        <div class="countdown-unit">
                            <div class="countdown-value">${countdownData.months}</div>
                            <div class="countdown-label">თვე</div>
                        </div>
                         <div class="countdown-unit">
                            <div class="countdown-value">${countdownData.days}</div>
                            <div class="countdown-label">დღე</div>
                        </div>
                        <div class="countdown-unit">
                            <div class="countdown-value">${String(countdownData.hours).padStart(2, '0')}</div>
                            <div class="countdown-label">საათი</div>
                        </div>
                        <div class="countdown-unit">
                            <div class="countdown-value">${String(countdownData.minutes).padStart(2, '0')}</div>
                            <div class="countdown-label">წუთი</div>
                        </div>
                        <div class="countdown-unit">
                            <div class="countdown-value">${String(countdownData.seconds).padStart(2, '0')}</div>
                            <div class="countdown-label">წამი</div>
                        </div>
                    `;
                } else if (countdownData && countdownData.isPast) {
                     countdownDiv.innerHTML = `<div class="countdown-unit"><div class="countdown-value">🎉</div><div class="countdown-label">დღეს არის!</div></div>`;
                     clearInterval(countdownInterval);
                } else {
                    countdownDiv.innerHTML = '';
                    clearInterval(countdownInterval);
                }
            }

            updateCountdown();
            countdownInterval = setInterval(updateCountdown, 1000);

            setupContactButton(messageBtn, birthday.phone);
            setupContactButton(whatsappBtn, birthday.phone);
            setupContactButton(callBtn, birthday.phone);

            showView('detail');

        } catch (error) {
            console.error("Error showing detail view:", error);
            alert("დეტალების ჩვენების შეცდომა.");
            showView('list');
        }
    }

     /**
      * Shows the form pre-filled for editing the currently viewed birthday.
      */
     async function showEditView() {
         if (!currentBirthdayId) return;
         try {
             const birthday = await getBirthdayById(currentBirthdayId);
             if (birthday) {
                 populateForm(birthday);
                 showView('form');
             } else {
                 alert("დაბადების დღე რედაქტირებისთვის ვერ მოიძებნა.");
                 showView('list');
             }
         } catch (error) {
             console.error("Error fetching birthday for edit:", error);
             alert("რედაქტირების ფორმის ჩატვირთვის შეცდომა.");
         }
     }

     /**
      * Sets up a contact action button (enables/disables and sets link).
      * @param {HTMLButtonElement} button - The button element.
      * @param {string|null} phoneNumber - The phone number.
      */
     function setupContactButton(button, phoneNumber) {
        const scheme = button.dataset.scheme;
        if (phoneNumber && scheme) {
            button.disabled = false;
            button.style.opacity = 1;
            const cleanPhoneNumber = phoneNumber.replace(/[\s-]+/g, '');
            button.onclick = () => {
                // Use try-catch for external links for better error handling
                try {
                    window.location.href = scheme + cleanPhoneNumber;
                } catch (e) {
                    console.error("Error opening link:", scheme + cleanPhoneNumber, e);
                    // Optionally inform the user
                    // alert("ბმულის გახსნის შეცდომა.");
                }
            };
        } else {
            button.disabled = true;
            button.style.opacity = 0.5;
            button.onclick = null;
        }
     }

    // --- Event Listeners ---
    addBirthdayBtnMain.addEventListener('click', () => {
        resetForm();
        showView('form');
    });

    cancelBtn.addEventListener('click', () => {
        resetForm();
        showView('list');
    });

    birthdayForm.addEventListener('submit', handleFormSubmit);
    deleteBtn.addEventListener('click', handleDelete);

    backToListBtn.addEventListener('click', () => showView('list'));
    editBirthdayBtn.addEventListener('click', showEditView);

    // --- Helper Function for File Download ---
    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Import/Export Functions ---

    async function exportData(format) {
        try {
            const birthdays = await getAllBirthdays();
            if (birthdays.length === 0) {
                alert("ექსპორტისთვის მონაცემები არ მოიძებნა.");
                return;
            }

            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.textContent = `${format.toUpperCase()} ფორმატში ექსპორტი...`;
            document.body.appendChild(loadingIndicator);

            let content;
            let filename;
            let mimeType;

            try {
                if (format === 'json') {
                    const exportData = birthdays.map(({ id, name, dob, phone }) => ({ id, name, dob, phone: phone || null }));
                    content = JSON.stringify(exportData, null, 2);
                    filename = 'birthdays_export.json';
                    mimeType = 'application/json';
                } else if (format === 'csv') {
                     // Ensure headers match the fields being exported
                     const headers = ['id', 'name', 'dob', 'phone'];
                     const dataToExport = birthdays.map(({ id, name, dob, phone }) => ({ id, name, dob, phone: phone || '' }));
                     content = generateCSV(dataToExport, headers);
                     filename = 'birthdays_export.csv';
                     mimeType = 'text/csv;charset=utf-8;';
                } else if (format === 'ics') {
                    content = generateICS(birthdays);
                    filename = 'birthdays_export.ics';
                    mimeType = 'text/calendar;charset=utf-8;';
                } else {
                    throw new Error("Invalid export format: " + format);
                }

                downloadFile(filename, content, mimeType);
                console.log(`Successfully exported data as ${format}`);
            } catch (formatError) {
                console.error(`Error formatting ${format} data:`, formatError);
                alert(`მონაცემების ${format} ფორმატში დამუშავების შეცდომა.`);
            } finally {
                document.body.removeChild(loadingIndicator);
            }

        } catch (error) {
            console.error(`Error exporting data as ${format}:`, error);
            alert(`მონაცემების ${format} ფორმატში ექსპორტის შეცდომა.`);
        }
    }

    // Define a global state manager for import to prevent duplicates
    window.importState = {
        inProgress: false,
        processing: false,
        
        // Start the import process
        startImport: function() {
            if (this.inProgress) {
                console.log("Import already in progress");
                return false;
            }
            this.inProgress = true;
            return true;
        },
        
        // Start processing a file
        startProcessing: function() {
            if (this.processing) {
                console.log("Already processing a file");
                return false;
            }
            this.processing = true;
            return true;
        },
        
        // Reset the import state
        reset: function() {
            this.inProgress = false;
            this.processing = false;
            console.log("Import state reset");
        }
    };

    /**
     * Prompts user to import data from a file
     */
    function promptForImport() {
        if (!window.importState.startImport()) {
            return;
        }
        
        // Get the current input element
        const currentImportFileInput = window.updatedImportFileInput || importFileInput;
        
        if (confirm("არ მოიძებნა სარეზერვო ასლი. გსურთ ფაილიდან მონაცემების იმპორტი?")) {
            currentImportFileInput.click();
        } else {
            window.importState.reset();
        }
    }

    /**
     * Handles the file import process
     */
    async function importData(file) {
        if (!file || !window.importState.startProcessing()) {
            return;
        }
        
        try {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.textContent = 'იტვირთება...';
            document.body.appendChild(loadingIndicator);
            
            // Read the file content
            const content = await readFileAsync(file);
            let importedBirthdays = [];
            
            // Parse the file based on type
            if (file.name.endsWith('.json')) {
                importedBirthdays = await parseJsonFile(content);
            } else if (file.name.endsWith('.csv')) {
                importedBirthdays = await parseCsvFile(content);
            } else {
                throw new Error("ფაილის ტიპი არ არის მხარდაჭერილი (მხოლოდ .json ან .csv).");
            }
            
            if (importedBirthdays.length === 0) {
                alert("ფაილიდან მონაცემები ვერ წაიკითხა ან ფაილი ცარიელია.");
                document.body.removeChild(loadingIndicator);
            } else {
                // Get existing birthdays for duplicate checking
                const existingBirthdays = await getAllBirthdays();
                
                // Check for possible storage limit issues
                if (existingBirthdays.length >= 11) {
                    console.warn("Potential storage limit issue detected - current record count:", existingBirthdays.length);
                }
                
                // Check for duplicates
                const duplicates = findDuplicates(importedBirthdays, existingBirthdays);
                let shouldOverwrite = false;
                
                if (duplicates.length > 0) {
                    shouldOverwrite = confirm(`ნაპოვნია ${duplicates.length} დუბლიკატი. გსურთ მათი გადაფარვა?`);
                    
                    if (!shouldOverwrite) {
                        // Remove duplicates if user doesn't want to overwrite
                        importedBirthdays = importedBirthdays.filter(newBday => 
                            !existingBirthdays.some(existingBday => 
                                existingBday.name === newBday.name && existingBday.dob === newBday.dob
                            )
                        );
                    }
                }
                
                // Final confirmation
                if (importedBirthdays.length === 0) {
                    alert("გადაფარვის გარეშე, არ არის ახალი ჩანაწერები დასამატებლად.");
                    document.body.removeChild(loadingIndicator);
                } else {
                    const shouldImport = confirm(`ნაპოვნია ${importedBirthdays.length} ჩანაწერი. გსურთ მათი დამატება მიმდინარე სიაში?`);
                    
                    if (!shouldImport) {
                        document.body.removeChild(loadingIndicator);
                        return;
                    }
                    
                    // Perform the import
                    let successCount = 0;
                    let failCount = 0;
                    let storageIssueDetected = false;
                    
                    for (const bday of importedBirthdays) {
                        try {
                            // Check if we need to update or add
                            const existingBday = existingBirthdays.find(existing => 
                                existing.name === bday.name && existing.dob === bday.dob
                            );
                            
                            if (existingBday && shouldOverwrite) {
                                // Only update if phone number is changed
                                if (existingBday.phone !== bday.phone) {
                                    await updateBirthday({ ...existingBday, phone: bday.phone || existingBday.phone });
                                } else {
                                    successCount++; // Count as success even if no change needed
                                    continue;
                                }
                            } else if (!existingBday) {
                                // Always remove the ID field from imported birthdays to avoid key constraint errors
                                // This object spread ensures any unexpected fields are also removed
                                const { name, dob, phone } = bday;
                                try {
                                    await addBirthday({ name, dob, phone: phone || null });
                                } catch (innerError) {
                                    // Check if this might be a storage issue
                                    if (innerError.toString().includes("Key") || 
                                        innerError.toString().includes("constraint") ||
                                        successCount + existingBirthdays.length >= 11) {
                                        
                                        console.error("Possible storage constraint error:", innerError);
                                        storageIssueDetected = true;
                                        failCount++;
                                        continue;
                                    }
                                    throw innerError; // Re-throw if not storage related
                                }
                            } else {
                                // Skip existing entries if not overwriting
                                continue;
                            }
                            successCount++;
                        } catch (addError) {
                            console.error("Error adding imported birthday:", bday, addError);
                            failCount++;
                        }
                    }
                    
                    document.body.removeChild(loadingIndicator);
                    
                    if (storageIssueDetected) {
                        alert(`იმპორტი დასრულდა, მაგრამ აღმოჩენილია შესაძლო შეზღუდვა მონაცემთა შენახვაში.\n` +
                              `წარმატებით დაემატა: ${successCount}\nშეცდომა: ${failCount}\n` +
                              `გთხოვთ, გადატვირთოთ გვერდი და სცადოთ თავიდან.`);
                    } else {
                        alert(`იმპორტი დასრულდა.\nწარმატებით დაემატა/განახლდა: ${successCount}\nშეცდომა: ${failCount}`);
                    }
                    
                    await renderBirthdayList();
                }
            }
        } catch (error) {
            console.error("Error importing file:", error);
            alert(`ფაილის იმპორტის შეცდომა: ${error.message}`);
        } finally {
            resetImportState();
        }
    }

    /**
     * Promise-based file reader
     */
    function readFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => resolve(event.target.result);
            reader.onerror = error => reject(error);
            reader.readAsText(file);
        });
    }

    /**
     * Parse JSON file and validate structure
     */
    function parseJsonFile(content) {
        const parsed = JSON.parse(content);
        
        if (!Array.isArray(parsed)) {
            throw new Error("JSON ფაილი არ შეიცავს სიას (array).");
        }
        
        // Validate JSON structure and strip IDs to avoid conflicts
        return parsed.map(b => {
            if (!b || !b.name || !b.dob) return null;
            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(b.dob)) return null;
            
            // Strip ID to avoid conflicts, keep only name, dob, phone
            const { id, ...birthdayWithoutId } = b;
            return birthdayWithoutId;
        }).filter(Boolean); // Remove null entries
    }

    /**
     * Parse CSV file and extract birthday data
     */
    function parseCsvFile(content) {
        const lines = content.split(/\r?\n/);
        if (lines.length < 2) throw new Error("CSV ფაილი ცარიელია ან არასწორი ფორმატის.");

        const headersLine = lines[0].trim();
        const headers = headersLine.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(h => h.replace(/"/g, '').trim().toLowerCase()) || [];

        const nameIndex = headers.indexOf('name');
        const dobIndex = headers.indexOf('dob');
        const phoneIndex = headers.indexOf('phone');

        if (nameIndex === -1 || dobIndex === -1) {
            throw new Error("CSV ფაილს აკლია 'name' ან 'dob' სვეტი.");
        }

        const birthdays = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '').trim()) || [];

            const name = values[nameIndex];
            const dob = values[dobIndex];
            const phone = phoneIndex !== -1 ? values[phoneIndex] : null;

            if (name && dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                birthdays.push({ name, dob, phone: phone || null });
            } else {
                console.warn(`Skipping invalid CSV row ${i + 1}:`, lines[i]);
            }
        }
        
        return birthdays;
    }

    /**
     * Find duplicate entries between imported and existing birthdays
     */
    function findDuplicates(imported, existing) {
        return imported.filter(newBday => 
            existing.some(existingBday => 
                existingBday.name === newBday.name && existingBday.dob === newBday.dob
            )
        );
    }

    /**
     * Reset the import state and input field
     */
    function resetImportState() {
        // Get the current input element
        const currentImportFileInput = window.updatedImportFileInput || importFileInput;
        
        // Remove the event listener before resetting to prevent potential triggers
        if (currentImportFileInput) {
            const newInput = currentImportFileInput.cloneNode(false);
            if (currentImportFileInput.parentNode) {
                currentImportFileInput.parentNode.replaceChild(newInput, currentImportFileInput);
                window.updatedImportFileInput = newInput;
                
                // Re-add the event listener to the new element
                newInput.addEventListener('change', (event) => {
                    if (event.target.files && event.target.files.length > 0) {
                        const file = event.target.files[0];
                        importData(file);
                        closeMenu();
                    }
                });
            }
        }
        
        // Reset the state flags
        window.importState.reset();
        
        console.log("Import state and file input fully reset");
    }

    // --- Import/Export Event Listeners ---
    // These listeners are now exclusively set in the initializeEventListeners function
    // exportJsonBtn.removeEventListener('click', () => exportData('json'));
    // exportCsvBtn.removeEventListener('click', () => exportData('csv'));
    // exportIcsBtn.removeEventListener('click', () => exportData('ics'));

    // exportJsonBtn.addEventListener('click', () => {
    //     exportData('json');
    //     closeMenu();
    // });
    // exportCsvBtn.addEventListener('click', () => {
    //     exportData('csv');
    //     closeMenu();
    // });
    // exportIcsBtn.addEventListener('click', () => {
    //     exportData('ics');
    //     closeMenu();
    // });

    // importBtn.addEventListener('click', () => {
    //     importFileInput.click();
    // });

    // importFileInput.addEventListener('change', (event) => {
    //     const file = event.target.files[0];
    //     if (file) {
    //         importData(file);
    //         closeMenu();
    //     }
    // });

    // Clear all data button handler
    clearAllBtn.addEventListener('click', handleClearAll);

    // --- Theme Management ---
    function initTheme() {
        // Check if user has previously selected a theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }
    }
    
    function toggleTheme() {
        const isLightTheme = document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
    }
    
    themeToggleBtn.addEventListener('click', toggleTheme);

    // --- Footer Year Update ---
    function updateFooterYear() {
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }

    // --- Initial Load ---
    async function initializeApp() {
        try {
            console.log("Initializing app...");
            
            // Update footer year
            updateFooterYear();
            
            // Initialize theme
            initTheme();
            
            // Clear ALL listeners first!
            clearExistingEventListeners();
            
            // Set up event listeners
            initializeEventListeners();
            
            // Make sure we're starting with the list view
            showView('list');
            
            // Render the birthday list
            await renderBirthdayList();
            
            // Create initial localStorage backup
            createLocalStorageBackup();
            
            console.log("App initialized successfully.");
        } catch (error) {
            console.error("Error initializing app:", error);
            alert("აპლიკაციის ინიციალიზაციის შეცდომა");
        }
    }

    /**
     * Clear any existing event listeners to avoid duplicates
     */
    function clearExistingEventListeners() {
        try {
            // Create new clones of elements to remove all event listeners
            if (importFileInput && importFileInput.parentNode) {
                const newImportInput = document.createElement('input');
                newImportInput.type = 'file';
                newImportInput.id = 'import-file';
                newImportInput.accept = '.json,.csv';
                newImportInput.style.display = 'none';
                importFileInput.parentNode.replaceChild(newImportInput, importFileInput);
                // Use a different approach to update - store a reference in a global variable
                window.updatedImportFileInput = newImportInput;
            }
            
            if (importBtn && importBtn.parentNode) {
                const newImportBtn = importBtn.cloneNode(true);
                importBtn.parentNode.replaceChild(newImportBtn, importBtn);
                window.updatedImportBtn = newImportBtn;
            }
            
            // Do the same for export buttons
            if (exportJsonBtn && exportJsonBtn.parentNode) {
                const newExportJsonBtn = exportJsonBtn.cloneNode(true);
                exportJsonBtn.parentNode.replaceChild(newExportJsonBtn, exportJsonBtn);
                window.updatedExportJsonBtn = newExportJsonBtn;
            }
            
            if (exportCsvBtn && exportCsvBtn.parentNode) {
                const newExportCsvBtn = exportCsvBtn.cloneNode(true);
                exportCsvBtn.parentNode.replaceChild(newExportCsvBtn, exportCsvBtn);
                window.updatedExportCsvBtn = newExportCsvBtn;
            }
            
            if (exportIcsBtn && exportIcsBtn.parentNode) {
                const newExportIcsBtn = exportIcsBtn.cloneNode(true);
                exportIcsBtn.parentNode.replaceChild(newExportIcsBtn, exportIcsBtn);
                window.updatedExportIcsBtn = newExportIcsBtn;
            }
        } catch (error) {
            console.error("Error in clearExistingEventListeners:", error);
        }
    }

    initializeApp().catch(err => {
        console.error("Application initialization failed:", err);
        birthdayListUl.innerHTML = '<li class="loading error">აპლიკაციის ინიციალიზაციის შეცდომა.</li>';
    });

    /**
     * Filters birthdays based on search term.
     * @param {Array} birthdays - Array of birthday objects.
     * @param {string} searchTerm - Term to search for.
     * @returns {Array} Filtered birthdays.
     */
    function filterBirthdays(birthdays, searchTerm) {
        if (!searchTerm.trim()) return birthdays;
        
        const search = searchTerm.toLowerCase().trim();
        
        return birthdays.filter(b => {
            if (b.name.toLowerCase().includes(search)) return true;
            
            // Search by date of birth
            if (b.dob.includes(search)) return true;
            
            // Search by month name
            const dobDate = new Date(b.dob + 'T00:00:00');
            const monthIndex = dobDate.getMonth();
            const monthName = georgianMonths[monthIndex].toLowerCase();
            if (monthName.includes(search)) return true;
            
            // Search by zodiac sign
            const zodiac = getZodiacSign(b.dob).toLowerCase();
            if (zodiac.includes(search)) return true;
            
            // Search by age
            const age = calculateAge(b.dob);
            if (age.toString() === search) return true;
            
            // Search by phone if it exists
            if (b.phone && b.phone.toLowerCase().includes(search)) return true;
            
            return false;
        });
    }
    
    /**
     * Highlights search term in text.
     * @param {string} text - Original text.
     * @param {string} searchTerm - Term to highlight.
     * @returns {string} HTML with highlighted text.
     */
    function highlightMatch(text, searchTerm) {
        if (!searchTerm.trim()) return text;
        
        const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }
    
    /**
     * Escapes special regex characters.
     * @param {string} string - String to escape.
     * @returns {string} Escaped string.
     */
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Handles search input changes.
     */
    function handleSearch() {
        currentSearchTerm = searchInput.value.trim();
        renderBirthdayList();
        
        // Show/hide clear button based on search content
        searchClearBtn.style.display = currentSearchTerm ? 'block' : 'none';
    }
    
    /**
     * Clears the search.
     */
    function clearSearch() {
        searchInput.value = '';
        currentSearchTerm = '';
        searchClearBtn.style.display = 'none';
        renderBirthdayList();
    }
    
    // Add search event listeners
    searchInput.addEventListener('input', handleSearch);
    searchClearBtn.addEventListener('click', clearSearch);
    
    // Hide clear button initially
    searchClearBtn.style.display = 'none';

    // --- Navigation Event Listeners ---
    siteTitle.addEventListener('click', () => {
        showView('list');
        closeMenu(); // Close menu when clicking site title
    });

    howItWorksBtn.addEventListener('click', () => {
        showView('how-it-works');
        closeMenu();
    });

    faqBtn.addEventListener('click', () => {
        showView('faq');
        closeMenu();
    });

    // Menu Toggle Functions
    function toggleMenu() {
        const menuOverlay = document.getElementById('menu-overlay');
        const menuToggleBtn = document.getElementById('menu-toggle-btn');
        
        menuOverlay.classList.toggle('open');
        menuToggleBtn.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    }
    
    /**
     * მენიუს გახსნა
     */
    function openMenu() {
        const menuOverlay = document.getElementById('menu-overlay');
        const menuToggleBtn = document.getElementById('menu-toggle-btn');
        
        menuOverlay.classList.add('open');
        menuToggleBtn.classList.add('active');
        document.body.classList.add('menu-open');
    }
    
    /**
     * მენიუს დახურვა
     */
    function closeMenu() {
        const menuOverlay = document.getElementById('menu-overlay');
        const menuToggleBtn = document.getElementById('menu-toggle-btn');
        
        menuOverlay.classList.remove('open');
        menuToggleBtn.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
    
    // Event Listeners
    menuToggleBtn.addEventListener('click', toggleMenu);
    
    // Close menu when clicking outside the menu content
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) {
            closeMenu();
        }
    });
    
    // Close menu when clicking a menu option
    const menuButtons = menuOverlay.querySelectorAll('button, .import-button');
    menuButtons.forEach(button => {
        button.addEventListener('click', closeMenu);
    });
    
    // Close menu with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
            closeMenu();
        }
    });

    /**
     * Debug function to check database status and attempt to fix issues
     */
    async function debugDatabase() {
        try {
            console.log("Checking database status...");
            
            // 1. Get all data and display in console
            const allData = await getAllBirthdays();
            console.log("All birthdays in database:", allData);
            
            // 2. Check if DB is accessible
            const db = await window.db.openDB();
            console.log("Database connection:", db ? "Success" : "Failed");
            
            // 3. Check object store
            let storeName = STORE_NAME || 'birthdays';
            console.log("Using object store:", storeName);
            
            // 4. Check for storage limit issues
            if (allData && allData.length >= 11) {
                console.warn("Possible storage limit issue detected. Current record count:", allData.length);
                
                // ინფორმაციული შეტყობინება ოპტიმიზაციის საჭიროებაზე, მაგრამ არ ვიწყებთ ავტომატურად
                alert(`აღმოჩენილია ${allData.length} ჩანაწერი ბაზაში.\n\nთუ შეგექმნათ პრობლემები ახალი ჩანაწერების დამატებისას, გამოიყენეთ "ბაზის ოპტიმიზაცია" ფუნქცია მენიუში.`);
            }
            
            // 5. Create a backup
            if (allData && allData.length > 0) {
                const jsonStr = JSON.stringify(allData);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // Create a download link
                const a = document.createElement('a');
                a.href = url;
                const backupFilename = `birthday_backup_${new Date().toISOString().slice(0,10)}.json`;
                a.download = backupFilename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                alert(`შემოწმება დასრულებულია.\n${allData.length} დაბადების დღის ჩანაწერი ნაპოვნია.\n\nმონაცემების სარეზერვო ასლი შენახულია ფაილში:\n${backupFilename}`);
            } else {
                console.warn("No birthday data found in database");
                alert("ბაზაში ვერ მოიძებნა დაბადების დღეების ჩანაწერები.");
            }
        } catch (error) {
            console.error("Database debug error:", error);
            alert("ბაზის შემოწმებისას დაფიქსირდა შეცდომა: " + error.message);
        }
    }

    /**
     * Initializes all event listeners for the application.
     */
    function initializeEventListeners() {
        // Get updated DOM elements if they exist
        const currentImportBtn = window.updatedImportBtn || importBtn;
        const currentImportFileInput = window.updatedImportFileInput || importFileInput;
        const currentExportJsonBtn = window.updatedExportJsonBtn || exportJsonBtn;
        const currentExportCsvBtn = window.updatedExportCsvBtn || exportCsvBtn;
        const currentExportIcsBtn = window.updatedExportIcsBtn || exportIcsBtn;

        // Navigation
        siteTitle.addEventListener('click', () => {
            showView('list');
        });
        
        // Form buttons
        addBirthdayBtnMain.addEventListener('click', () => {
            resetForm();
            formTitle.textContent = 'ახალი დაბადების დღის დამატება';
            deleteBtn.classList.add('hidden');
            showView('form');
        });
        
        birthdayForm.addEventListener('submit', handleFormSubmit);
        cancelBtn.addEventListener('click', () => showView('list'));
        deleteBtn.addEventListener('click', handleDelete);
        
        // Detail view buttons
        backToListBtn.addEventListener('click', () => showView('list'));
        editBirthdayBtn.addEventListener('click', showEditView);
        
        // Search functionality
        searchInput.addEventListener('input', handleSearch);
        searchClearBtn.addEventListener('click', clearSearch);
        
        // Menu functionality
        menuToggleBtn.addEventListener('click', toggleMenu);
        document.addEventListener('click', (e) => {
            if (menuOverlay.classList.contains('active') && 
                !e.target.closest('.menu-content') && 
                !e.target.closest('.menu-toggle')) {
                closeMenu();
            }
        });
        
        // Menu navigation
        howItWorksBtn.addEventListener('click', () => {
            showView('how-it-works');
            closeMenu();
        });
        
        faqBtn.addEventListener('click', () => {
            showView('faq');
            closeMenu();
        });
        
        // Theme toggle
        themeToggleBtn.addEventListener('click', toggleTheme);
        
        // Menu action buttons - IMPORTANT: Export and import buttons are handled separately at the top level
        // These are intentionally omitted here to avoid duplicate event handlers
        
        // Setup Import/Export Event Listeners only once
        currentExportJsonBtn.addEventListener('click', () => {
            exportData('json');
            closeMenu();
        });
        
        currentExportCsvBtn.addEventListener('click', () => {
            exportData('csv');
            closeMenu();
        });
        
        currentExportIcsBtn.addEventListener('click', () => {
            exportData('ics');
            closeMenu();
        });
        
        // Import setup - Critical to avoid duplication
        currentImportBtn.addEventListener('click', () => {
            if (!window.importState.inProgress) {
                currentImportFileInput.click();
            }
        });
        
        // Remove the existing event listener first
        if (currentImportFileInput._hasChangeListener) {
            currentImportFileInput.removeEventListener('change', currentImportFileInput._changeHandler);
        }

        // Define the change handler
        currentImportFileInput._changeHandler = (event) => {
            if (event.target.files && event.target.files.length > 0) {
                const file = event.target.files[0];
                importData(file);
                // File input is reset in resetImportState after import completes
                closeMenu();
            }
        };

        // Add the listener and mark that we've added it
        currentImportFileInput.addEventListener('change', currentImportFileInput._changeHandler);
        currentImportFileInput._hasChangeListener = true;
        
        clearAllBtn.addEventListener('click', handleClearAll);
        repairDbBtn.addEventListener('click', repairDatabase);
        
        // Add event listener for database optimization button
        const optimizeDbBtn = document.getElementById('optimize-db-btn');
        if (optimizeDbBtn) {
            optimizeDbBtn.addEventListener('click', () => {
                closeMenu();
                fixDatabaseStorageIssues();
            });
        }
        
        // Debug button (if present)
        const debugBtn = document.getElementById('debug-db-btn');
        if (debugBtn) {
            debugBtn.addEventListener('click', debugDatabase);
        }
    }

    /**
     * Attempts to repair the database by recovering from localStorage or prompting for import
     */
    async function repairDatabase() {
        try {
            // Close menu
            closeMenu();
            
            // Get store name from the db.js file or use default
            const storeName = window.STORE_NAME || 'birthdays';
            const backupDbName = window.BACKUP_DB_NAME || 'BirthdayAppBackupDB';
            
            // 1. Check if we have any data in the database
            const currentData = await getAllBirthdays();
            
            // 2. Try to recover from localStorage backup
            const localBackup = localStorage.getItem('birthdayAppBackup');
            
            if (localBackup) {
                try {
                    const parsedData = JSON.parse(localBackup);
                    
                    if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
                        // We have backup data in localStorage
                        if (confirm(`ნაპოვნია ${parsedData.length} დაბადების დღე ლოკალურ საცავში. გსურთ მათი აღდგენა?`)) {
                            // Clear existing data if user confirms
                            await clearAllBirthdays();
                            
                            // Add all backup data without IDs to avoid conflicts
                            let successCount = 0;
                            for (const birthday of parsedData) {
                                try {
                                    // Make sure we don't have an ID to avoid conflicts
                                    const { id, ...birthdayWithoutId } = birthday;
                                    await addBirthday(birthdayWithoutId);
                                    successCount++;
                                } catch (error) {
                                    console.error("Error restoring backup entry:", error);
                                }
                            }
                            
                            alert(`წარმატებით აღდგა ${successCount} დაბადების დღე`);
                            await renderBirthdayList();
                            return;
                        }
                    }
                } catch (e) {
                    console.error("Error parsing localStorage backup:", e);
                }
            }
            
            // 3. If no localStorage backup, try IndexedDB backup
            try {
                return new Promise((resolve) => {
                    const backupRequest = indexedDB.open(backupDbName);
                    
                    backupRequest.onerror = (event) => {
                        console.warn("Error opening backup database:", event.target.error);
                        promptForImport();
                        resolve();
                    };
                    
                    backupRequest.onsuccess = (event) => {
                        const backupDb = event.target.result;
                        
                        // Check if the object store exists in the backup DB
                        if (!backupDb.objectStoreNames.contains(storeName)) {
                            console.warn(`Backup database doesn't contain the '${storeName}' store`);
                            backupDb.close();
                            promptForImport();
                            resolve();
                            return;
                        }
                        
                        try {
                            const transaction = backupDb.transaction([storeName], 'readonly');
                            
                            transaction.onerror = (event) => {
                                console.error("Backup transaction error:", event.target.error);
                                backupDb.close();
                                promptForImport();
                                resolve();
                            };
                            
                            const store = transaction.objectStore(storeName);
                            const request = store.getAll();
                            
                            request.onerror = (event) => {
                                console.error("Error reading from backup store:", event.target.error);
                                backupDb.close();
                                promptForImport();
                                resolve();
                            };
                            
                            request.onsuccess = async (event) => {
                                const backupData = event.target.result;
                                backupDb.close();
                                
                                if (backupData && backupData.length > 0) {
                                    if (confirm(`ნაპოვნია ${backupData.length} დაბადების დღე სარეზერვო ბაზაში. გსურთ მათი აღდგენა?`)) {
                                        // Clear existing data if user confirms
                                        await clearAllBirthdays();
                                        
                                        // Add all backup data
                                        let successCount = 0;
                                        for (const birthday of backupData) {
                                            try {
                                                // Make sure we don't have an ID to avoid conflicts
                                                const { id, ...birthdayWithoutId } = birthday;
                                                await addBirthday(birthdayWithoutId);
                                                successCount++;
                                            } catch (error) {
                                                console.error("Error restoring backup entry:", error);
                                            }
                                        }
                                        
                                        alert(`წარმატებით აღდგა ${successCount} დაბადების დღე`);
                                        await renderBirthdayList();
                                    } else {
                                        promptForImport();
                                    }
                                } else {
                                    console.warn("No data found in backup database");
                                    promptForImport();
                                }
                                
                                resolve();
                            };
                        } catch (e) {
                            console.error("Error reading from backup DB:", e);
                            backupDb.close();
                            promptForImport();
                            resolve();
                        }
                    };
                });
            } catch (e) {
                console.error("Error opening backup DB:", e);
                promptForImport();
            }
        } catch (error) {
            console.error("Database repair error:", error);
            alert("მონაცემთა ბაზის აღდგენის შეცდომა: " + error.message);
            promptForImport();
        }
    }

    /**
     * Fixes database storage issues by optimizing the database structure
     * 
     * ეს ფუნქცია:
     * 1. ქმნის ყველა არსებული მონაცემის სარეზერვო ასლს მეხსიერებაში
     * 2. სრულად შლის ბაზას ID-ების მთვლელის განულებისთვის
     * 3. თავიდან ქმნის ბაზას ახალი სტრუქტურით
     * 4. აღადგენს ყველა შენახულ მონაცემს
     * 
     * როდის გამოიყენოთ:
     * - თუ გიჩნდებათ ID კონფლიქტები (ConstraintError: Key already exists)
     * - თუ ახალი მონაცემების დამატებისას იღებთ შეცდომას
     * - თუ გაქვთ ბევრი ჩანაწერი (10+) და კიდევ გინდათ დამატება
     * - თუ წაშალეთ ბევრი ჩანაწერი და გსურთ ID-ების განულება/ბაზის "დალაგება"
     */
    async function fixDatabaseStorageIssues() {
        // Show warning dialog before starting the process
        const confirmMessage = `⚠️ გაფრთხილება! ⚠️\n\n` + 
            `ბაზის ოპტიმიზაციის პროცესი დროებით წაშლის ყველა მონაცემს და შემდეგ დააბრუნებს მათ.\n\n` + 
            `❌ არ დაარეფრეშოთ გვერდი პროცესის მიმდინარეობისას!\n` + 
            `❌ არ დახუროთ ბრაუზერი პროცესის მიმდინარეობისას!\n\n` + 
            `გსურთ გააგრძელოთ?`;
            
        if (!confirm(confirmMessage)) {
            return; // User cancelled the operation
        }
        
        let loadingIndicator = null;
        let progressSpan = null;
        
        try {
            // Create and add the loading indicator
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = 'ბაზის ოპტიმიზაცია... <span class="progress">0%</span>';
            loadingIndicator.style.textAlign = 'center';
            document.body.appendChild(loadingIndicator);
            
            progressSpan = loadingIndicator.querySelector('.progress');
            
            console.log("Starting database optimization process");
            
            // 1. Create a backup of all existing data
            const allData = await getAllBirthdays();
            console.log(`Found ${allData.length} records to preserve`);
            
            if (!allData || !Array.isArray(allData)) {
                throw new Error("Failed to retrieve birthdays data");
            }
            
            progressSpan.textContent = '20%';
            
            // 2. Store temporarily in memory (without IDs to prevent conflicts)
            const dataBackup = allData.map(({ name, dob, phone }) => ({ 
                name, 
                dob, 
                phone: phone || null 
            }));
            
            progressSpan.textContent = '40%';
            
            // 3. Save to localStorage as backup before proceeding
            try {
                localStorage.setItem('optimization_backup', JSON.stringify(dataBackup));
                console.log("Created localStorage optimization backup");
            } catch (e) {
                console.warn("Could not save backup to localStorage:", e);
                // Continue anyway
            }
            
            progressSpan.textContent = '50%';
            
            // 4. MUCH SIMPLER APPROACH: Instead of touching the database structure,
            // we'll just clear and reinsert all data
            console.log("Using direct clear and reinsert approach");
            
            // 4a. Clear all data using the existing function (should be stable)
            console.log("Clearing all existing data...");
            await clearAllBirthdays();
            
            progressSpan.textContent = '60%';
            
            // 4b. Add small delay for stability
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 5. Re-import all data
            console.log("Re-importing data with fresh IDs...");
            
            let successCount = 0;
            let errorCount = 0;
            
            // Import in small batches to prevent browser freezing
            const BATCH_SIZE = 3;
            
            for (let i = 0; i < dataBackup.length; i += BATCH_SIZE) {
                const batch = dataBackup.slice(i, i + BATCH_SIZE);
                
                for (const item of batch) {
                    try {
                        await addBirthday(item);
                        successCount++;
                    } catch (error) {
                        console.error("Error restoring item during optimization:", error);
                        errorCount++;
                    }
                }
                
                // Update progress percentage based on records processed
                const percentage = Math.round(60 + ((i + batch.length) / dataBackup.length * 40));
                progressSpan.textContent = `${percentage}%`;
                
                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            console.log(`Database optimization complete. Restored ${successCount} records, errors: ${errorCount}`);
            
            // Remove loading indicator
            if (loadingIndicator && loadingIndicator.parentNode) {
                document.body.removeChild(loadingIndicator);
                loadingIndicator = null;
            }
            
            // Clean up the backup
            try {
                localStorage.removeItem('optimization_backup');
            } catch (e) {
                console.warn("Could not remove optimization backup:", e);
            }
            
            if (errorCount > 0) {
                alert(`ბაზის ოპტიმიზაცია დასრულდა.\nID ნუმერაცია განულებულია.\n\nწარმატებით აღდგა: ${successCount} ჩანაწერი\nშეცდომა: ${errorCount} ჩანაწერი\n\nგთხოვთ, გადატვირთოთ აპლიკაცია.`);
            } else {
                alert(`ბაზის ოპტიმიზაცია წარმატებით დასრულდა.\nID ნუმერაცია განულებულია.\nაღდგენილია ${successCount} ჩანაწერი.\n\nახლა შეგიძლიათ დაამატოთ მეტი მონაცემები.`);
            }
            
            // 6. Refresh the display
            await renderBirthdayList();
            
        } catch (error) {
            console.error("Error during database optimization:", error);
            
            // Try to recover from backup if available
            try {
                const backupData = localStorage.getItem('optimization_backup');
                if (backupData) {
                    console.log("Found optimization backup, prompting user to restore...");
                    if (confirm("ოპტიმიზაციის პროცესში მოხდა შეცდომა. გსურთ აღვადგინოთ მონაცემები საპნიდან?")) {
                        const parsedData = JSON.parse(backupData);
                        let recoveredCount = 0;
                        
                        for (const item of parsedData) {
                            try {
                                await addBirthday(item);
                                recoveredCount++;
                            } catch (e) {
                                console.error("Recovery error:", e);
                            }
                        }
                        
                        alert(`აღდგენილია ${recoveredCount} ჩანაწერი ${parsedData.length}-დან`);
                        await renderBirthdayList();
                    }
                }
            } catch (recoveryError) {
                console.error("Recovery attempt failed:", recoveryError);
            }
            
            // Remove loading indicator if there was an error
            if (loadingIndicator && loadingIndicator.parentNode) {
                document.body.removeChild(loadingIndicator);
            }
            
            alert("შეცდომა ბაზის ოპტიმიზაციისას: " + error.message + 
                  "\n\nგთხოვთ, გადატვირთოთ გვერდი და სცადოთ ხელახლა.");
        }
    }

}); // End DOMContentLoaded
