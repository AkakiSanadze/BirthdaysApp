// utils.js - Helper functions

/**
 * Calculates the age based on the date of birth.
 * @param {string} dobString - Date of birth in 'YYYY-MM-DD' format.
 * @returns {number} The calculated age.
 */
function calculateAge(dobString) {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

/**
 * Calculates the date of the next birthday.
 * Handles past birthdays by setting them for next year.
 * Allows calculating birthdays up to 2 years in the future for proper sorting.
 * 
 * @param {string} dobString - Date of birth in 'YYYY-MM-DD' format.
 * @returns {Date} The date object representing the next birthday.
 */
function getNextBirthdayDate(dobString) {
    if (!dobString) return new Date();
    
    const dob = new Date(dobString + 'T00:00:00'); // Ensure local time interpretation
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight

    const birthMonth = dob.getMonth();
    const birthDay = dob.getDate();

    // Calculate the next birthday this year
    let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
    nextBirthday.setHours(0, 0, 0, 0);

    // If the birthday this year has already passed, set it for next year
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    // Safety check for data integrity - limit to 2 years max
    const twoYearsFromNow = new Date(today);
    twoYearsFromNow.setFullYear(today.getFullYear() + 2);
    
    if (nextBirthday > twoYearsFromNow) {
        console.error("Invalid far future birthday detected:", nextBirthday);
        return new Date(today.getFullYear(), birthMonth, birthDay);
    }

    return nextBirthday;
}

/**
 * Calculates the number of days remaining until the next birthday.
 * Uses getNextBirthdayDate for consistency in date calculations.
 * 
 * @param {string} dobString - Date of birth in 'YYYY-MM-DD' format.
 * @returns {number} The number of days remaining.
 */
function calculateDaysRemaining(dobString) {
    if (!dobString) return Infinity;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight
    const nextBirthday = getNextBirthdayDate(dobString);
    
    // Safety check matching getNextBirthdayDate's limits
    const twoYearsFromNow = new Date(today);
    twoYearsFromNow.setFullYear(today.getFullYear() + 2);
    
    if (nextBirthday > twoYearsFromNow) {
        console.error("Invalid future birthday date in days calculation:", nextBirthday);
        return 0;
    }

    // Calculate the difference in milliseconds and convert to days
    const diffTime = nextBirthday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Special case: If today is the birthday
    const dob = new Date(dobString + 'T00:00:00');
    if (today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate()) {
        return 0; // It's today!
    }

    return diffDays;
}

/**
 * Formats a date object or string into a more readable format.
 * Example: "Tue, 15 Jul 2025"
 * @param {string|Date} dateInput - Date string ('YYYY-MM-DD') or Date object.
 * @param {object} options - Intl.DateTimeFormat options.
 * @returns {string} Formatted date string.
 */
function formatDate(dateInput, options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) {
     try {
        const date = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
        // Use Georgian locale for month/weekday names if possible, fallback to default
        return new Intl.DateTimeFormat('ka-GE', options).format(date);
     } catch (e) {
         console.error("Error formatting date:", dateInput, e);
         // Fallback for invalid dates
         const date = new Date(dateInput); // Try basic parsing
         if (!isNaN(date)) {
             return date.toDateString(); // Basic fallback format
         }
         return "Invalid Date";
     }
}


/**
 * Calculates the countdown details (months, days, hours, minutes, seconds) to a future date.
 * @param {Date} targetDate - The future date to count down to.
 * @returns {object|null} An object with countdown parts, or null if the date is in the past.
 */
function calculateCountdown(targetDate) {
    const now = new Date();
    const difference = targetDate - now;

    if (difference <= 0) {
        // Target date is in the past or now
        return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    // Rough calculation for months (average days per month) - less precise
    // let months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44));
    // More precise calculation needed if months are required, involves iterating month by month.
    // For simplicity, we'll focus on days, hours, minutes, seconds first.

    let totalSeconds = Math.floor(difference / 1000);
    let totalMinutes = Math.floor(totalSeconds / 60);
    let totalHours = Math.floor(totalMinutes / 60);
    let days = Math.floor(totalHours / 24);

    let seconds = totalSeconds % 60;
    let minutes = totalMinutes % 60;
    let hours = totalHours % 24;

    // Note: Calculating remaining *months* accurately while accounting for varying month lengths
    // and the remaining days/hours/etc. is complex. We might simplify this display
    // or just show days, hours, minutes, seconds. The provided screenshot shows months,
    // so we might need a more sophisticated date library later (like date-fns or moment.js)
    // if precise month calculation is critical. For now, we'll stick to days.

    // Attempt to calculate months (approximate)
    let months = 0;
    let tempDate = new Date(now);
    // Increment month by month until we pass the target date
    while (true) {
        let nextMonthDate = new Date(tempDate);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        // Handle year rollover and different month lengths implicitly
        if (nextMonthDate > targetDate) {
            break; // We've gone past the target month
        }
        tempDate = nextMonthDate;
        months++;
    }

    // Calculate remaining difference from the start of the last full month
    const remainingDifference = targetDate - tempDate;

    let rTotalSeconds = Math.floor(remainingDifference / 1000);
    let rTotalMinutes = Math.floor(rTotalSeconds / 60);
    let rTotalHours = Math.floor(rTotalMinutes / 60);
    let rDays = Math.floor(rTotalHours / 24); // Days remaining within the last month segment

    let rSeconds = rTotalSeconds % 60;
    let rMinutes = rTotalMinutes % 60;
    let rHours = rTotalHours % 24;


    // Return structure including approximate months
     return {
         months: months,
         days: rDays, // Renamed from totalDays
         hours: rHours,
         minutes: rMinutes,
         seconds: seconds,
         isPast: false
     };

    // If accurate month display like the screenshot is needed, this needs revision.
    // Example (simplified, might be off by a day depending on time):
    // let current = new Date(now);
    // let months = 0;
    // while (current < targetDate) {
    //     let temp = new Date(current);
    //     temp.setMonth(temp.getMonth() + 1);
    //     if (temp > targetDate) break;
    //     current = temp;
    //     months++;
    // }
    // // Now calculate remaining days/hrs/mins/secs from 'current' to 'targetDate'
    // // This is complex. Let's stick to total days for now.
}


/**
 * Determines the Zodiac sign based on the date of birth.
 * @param {string} dobString - Date of birth in 'YYYY-MM-DD' format.
 * @returns {string} The Zodiac sign name (e.g., "Libra").
 */
function getZodiacSign(dobString) {
    if (!dobString) return "";
    const dob = new Date(dobString + 'T00:00:00');
    const day = dob.getDate();
    const month = dob.getMonth() + 1; // JavaScript months are 0-indexed

    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "მერწყული"; // Aquarius
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "თევზები"; // Pisces
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "ვერძი"; // Aries
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "კურო"; // Taurus
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "ტყუპები"; // Gemini
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "კირჩხიბი"; // Cancer
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "ლომი"; // Leo
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "ქალწული"; // Virgo
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "სასწორი"; // Libra
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "მორიელი"; // Scorpio
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "მშვილდოსანი"; // Sagittarius
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "თხის რქა"; // Capricorn
    return ""; // Should not happen
}


// Export functions for use in other scripts
window.utils = {
    calculateAge,
    getNextBirthdayDate,
    calculateDaysRemaining,
    formatDate,
    calculateCountdown,
    getZodiacSign,
    generateICS, // Add the new function here
    generateCSV // Add CSV generation helper
};

/**
 * Generates an iCalendar (.ics) file content string for birthdays.
 * Creates calendar events for each birthday on the appropriate year.
 * 
 * @param {Array<object>} birthdays - Array of birthday objects { id, name, dob }.
 * @returns {string} The iCalendar file content as a string.
 */
function generateICS(birthdays) {
    // iCalendar standard requires UTC time, but for all-day events,
    // just specifying the date is usually sufficient and avoids timezone issues.
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;

    let icsString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BirthdayApp//NONSGML Birthday App//KA
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    birthdays.forEach(birthday => {
        if (!birthday.dob) return; // Skip if no date

        const dobDate = new Date(birthday.dob + 'T00:00:00');
        const month = String(dobDate.getMonth() + 1).padStart(2, '0');
        const day = String(dobDate.getDate()).padStart(2, '0');
        const birthYear = dobDate.getFullYear(); // Get the actual birth year
        
        // Check if this year's birthday has already passed
        const thisYearBirthday = new Date(currentYear, dobDate.getMonth(), dobDate.getDate());
        const nextYearBirthday = new Date(nextYear, dobDate.getMonth(), dobDate.getDate());
        
        // Only add events for future birthdays
        // If this year's birthday has passed, only add next year's
        // If this year's birthday is still coming, add only this year's
        const yearsToAdd = [];
        
        if (thisYearBirthday >= today) {
            // This year's birthday is still coming up
            yearsToAdd.push(currentYear);
        } else {
            // This year's birthday has passed, add next year's
            yearsToAdd.push(nextYear);
        }

        yearsToAdd.forEach(eventYear => {
            // Handling leap years - if Feb 29 and not a leap year, use Feb 28
            let eventDay = day;
            let eventMonth = month;
            
            if (month === '02' && day === '29') {
                // Check if eventYear is a leap year
                const isLeapYear = (eventYear % 4 === 0 && eventYear % 100 !== 0) || (eventYear % 400 === 0);
                if (!isLeapYear) {
                    eventDay = '28'; // Use Feb 28 in non-leap years
                }
            }
            
            const dtstartDate = `${eventYear}${eventMonth}${eventDay}`;
            const uid = `birthday-${birthday.id}-${eventYear}@birthdayapp.com`; // Unique ID
            const ageTurning = eventYear - birthYear;
            
            // Use Georgian language for summary
            const summary = `${birthday.name} - დაბადების დღე (${ageTurning} წელი)`;
            const description = `დაბადების დღე: ${birthday.name} შეუსრულდება ${ageTurning} წელი`;

            icsString += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}Z
DTSTART;VALUE=DATE:${dtstartDate}
SUMMARY:${summary}
DESCRIPTION:${description}
RRULE:FREQ=YEARLY;INTERVAL=1
CATEGORIES:BIRTHDAY
TRANSP:TRANSPARENT
CLASS:PUBLIC
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:შეხსენება: ${birthday.name}-ს დაბადების დღე 1 კვირაში
TRIGGER:-P7D
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:შეხსენება: ${birthday.name}-ს დაბადების დღე ხვალ
TRIGGER:-P1D
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:დღეს ${birthday.name}-ს დაბადების დღეა! 🎂
TRIGGER;VALUE=DURATION:PT0S
END:VALARM
END:VEVENT
`;
        });
    });

    icsString += 'END:VCALENDAR';
    return icsString;
}


/**
 * Converts an array of objects to a CSV string.
 * @param {Array<object>} data - Array of objects (birthdays).
 * @param {Array<string>} [headers] - Optional custom headers array.
 * @returns {string} CSV formatted string.
 */
function generateCSV(data, headers) {
    if (!data || data.length === 0) {
        return '';
    }
    
    // Use provided headers or default to these fields
    const csvHeaders = headers || ['id', 'name', 'dob', 'phone'];
    const csvRows = [];

    // Add header row
    csvRows.push(csvHeaders.join(','));

    // Add data rows
    data.forEach(item => {
        const values = csvHeaders.map(header => {
            let value = item[header] === null || item[header] === undefined ? '' : item[header];
            // Escape commas and quotes in values
            if (typeof value === 'string') {
                value = value.replace(/"/g, '""'); // Escape double quotes
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = `"${value}"`; // Enclose in double quotes
                }
            }
            return value;
        });
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
}
