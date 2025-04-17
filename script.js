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

            birthdaysWithDetails.sort((a, b) => a.daysLeft - b.daysLeft);

            const groupedBirthdays = birthdaysWithDetails.reduce((acc, b) => {
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
     * Handles the form submission (add or update).
     * @param {Event} event
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
        } catch (error) {
            console.error("Error saving birthday:", error);
            alert("დაბადების დღის შენახვის შეცდომა.");
        }
    }

     /**
      * Handles the delete button click.
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
         } catch (error) {
             console.error("Error deleting birthday:", error);
             alert("დაბადების დღის წაშლის შეცდომა.");
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

    async function importData(file) {
        if (!file) return;

        const reader = new FileReader();
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.textContent = 'იტვირთება...';
        document.body.appendChild(loadingIndicator);

        reader.onload = async (event) => {
            const content = event.target.result;
            let importedBirthdays = [];

            try {
                if (file.name.endsWith('.json')) {
                    importedBirthdays = JSON.parse(content);
                    if (!Array.isArray(importedBirthdays)) {
                        throw new Error("JSON ფაილი არ შეიცავს სიას (array).");
                    }
                    // Validate JSON structure
                    importedBirthdays = importedBirthdays.filter(b => {
                        if (!b || !b.name || !b.dob) return false;
                        // Validate date format
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(b.dob)) return false;
                        return true;
                    });

                } else if (file.name.endsWith('.csv')) {
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

                    for (let i = 1; i < lines.length; i++) {
                        if (!lines[i].trim()) continue;
                        const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '').trim()) || [];

                        const name = values[nameIndex];
                        const dob = values[dobIndex];
                        const phone = phoneIndex !== -1 ? values[phoneIndex] : null;

                        if (name && dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                            importedBirthdays.push({ name, dob, phone: phone || null });
                        } else {
                            console.warn(`Skipping invalid CSV row ${i + 1}:`, lines[i]);
                        }
                    }
                } else {
                    throw new Error("ფაილის ტიპი არ არის მხარდაჭერილი (მხოლოდ .json ან .csv).");
                }

                if (importedBirthdays.length === 0) {
                    alert("ფაილიდან მონაცემები ვერ წაიკითხა ან ფაილი ცარიელია.");
                    return;
                }

                // Check for duplicates
                const existingBirthdays = await getAllBirthdays();
                const duplicates = importedBirthdays.filter(newBday => 
                    existingBirthdays.some(existingBday => 
                        existingBday.name === newBday.name && existingBday.dob === newBday.dob
                    )
                );

                if (duplicates.length > 0) {
                    if (!confirm(`ნაპოვნია ${duplicates.length} დუბლიკატი. გსურთ მათი გადაფარვა?`)) {
                        // Remove duplicates if user doesn't want to overwrite
                        importedBirthdays = importedBirthdays.filter(newBday => 
                            !existingBirthdays.some(existingBday => 
                                existingBday.name === newBday.name && existingBday.dob === newBday.dob
                            )
                        );
                    }
                }

                if (!confirm(`ნაპოვნია ${importedBirthdays.length} ჩანაწერი. გსურთ მათი დამატება მიმდინარე სიაში?`)) {
                    return;
                }

                let successCount = 0;
                let failCount = 0;
                for (const bday of importedBirthdays) {
                    try {
                        // Check if we need to update or add
                        const existingBday = existingBirthdays.find(existing => 
                            existing.name === bday.name && existing.dob === bday.dob
                        );
                        
                        if (existingBday) {
                            await updateBirthday({ ...existingBday, phone: bday.phone || existingBday.phone });
                        } else {
                            await addBirthday(bday);
                        }
                        successCount++;
                    } catch (addError) {
                        console.error("Error adding imported birthday:", bday, addError);
                        failCount++;
                    }
                }

                alert(`იმპორტი დასრულდა.\nწარმატებით დაემატა/განახლდა: ${successCount}\nშეცდომა: ${failCount}`);
                await renderBirthdayList();

            } catch (error) {
                console.error("Error importing file:", error);
                alert(`ფაილის იმპორტის შეცდომა: ${error.message}`);
            } finally {
                document.body.removeChild(loadingIndicator);
                importFileInput.value = '';
            }
        };

        reader.onerror = () => {
            console.error("File reading error");
            alert("ფაილის წაკითხვის შეცდომა.");
            document.body.removeChild(loadingIndicator);
            importFileInput.value = '';
        };

        reader.readAsText(file);
    }


    // --- Import/Export Event Listeners ---
    exportJsonBtn.addEventListener('click', () => {
        exportData('json');
        closeMenu();
    });
    exportCsvBtn.addEventListener('click', () => {
        exportData('csv');
        closeMenu();
    });
    exportIcsBtn.addEventListener('click', () => {
        exportData('ics');
        closeMenu();
    });
    
    importBtn.addEventListener('click', () => {
        importFileInput.click();
    });
    
    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            importData(file);
            closeMenu();
        }
    });
    
    // Clear all data button handler
    clearAllBtn.addEventListener('click', async () => {
        if (!confirm('ნამდვილად გსურთ ყველა მონაცემის წაშლა? ეს მოქმედება შეუქცევადია!')) {
            return;
        }
        
        try {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.textContent = 'მონაცემები იშლება...';
            document.body.appendChild(loadingIndicator);
            
            await window.db.clearAllBirthdays();
            
            document.body.removeChild(loadingIndicator);
            alert('ყველა მონაცემი წარმატებით წაიშალა.');
            await renderBirthdayList();
            closeMenu();
        } catch (error) {
            console.error('Error clearing all data:', error);
            alert('მონაცემების წაშლის დროს მოხდა შეცდომა.');
        }
    });

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
        console.log("Initializing app...");
        initTheme(); // Initialize theme before showing content
        updateFooterYear(); // Update footer year
        await openDB();
        showView('list');
        await renderBirthdayList();
        console.log("App initialized.");
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
        const isOpen = menuToggleBtn.classList.contains('active');
        
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }
    
    function openMenu() {
        menuToggleBtn.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.classList.add('menu-open');
    }
    
    function closeMenu() {
        menuToggleBtn.classList.remove('active');
        menuOverlay.classList.remove('active');
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

}); // End DOMContentLoaded
