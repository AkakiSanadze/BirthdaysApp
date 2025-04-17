// db.js - IndexedDB Management

const DB_NAME = 'BirthdayAppDB';
const DB_VERSION = 3; // << Increment version for schema change
const STORE_NAME = 'birthdays';

let db; // Database instance

/**
 * Opens and initializes the IndexedDB database.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db); // Return existing instance if already open
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Database error:", event.target.error);
            reject("Database error: " + event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("Database opened successfully.");
            resolve(db);
        };

        // This event is only triggered if the version number changes
        // or if the database is created for the first time.
        request.onupgradeneeded = (event) => {
            const tempDb = event.target.result;
            console.log("Upgrading database...");

            // Create the object store if it doesn't exist
            if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
                const store = tempDb.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                // Create indexes for searching/sorting
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('dob', 'dob', { unique: false }); // dob (Date of Birth) as YYYY-MM-DD string
                console.log(`Object store '${STORE_NAME}' created.`);
            }

            // Handle version upgrades
            if (event.oldVersion < 2) {
                console.log(`Upgrading object store '${STORE_NAME}' to version 2...`);
                const transaction = event.target.transaction;
                const store = transaction.objectStore(STORE_NAME);
                
                // Add phone index if it doesn't exist
                if (!store.indexNames.contains('phone')) {
                    store.createIndex('phone', 'phone', { unique: false });
                    console.log("Index 'phone' created.");
                }
            }
            
            // Add avatar field in version 3
            if (event.oldVersion < 3) {
                console.log(`Upgrading object store '${STORE_NAME}' to version 3...`);
                const transaction = event.target.transaction;
                const store = transaction.objectStore(STORE_NAME);
                
                // We don't need an index for avatar as we don't search by it
                // Just retrieve existing records and update them
                const getAllRequest = store.getAll();
                
                getAllRequest.onsuccess = () => {
                    const birthdays = getAllRequest.result;
                    console.log(`Updating ${birthdays.length} records with avatar field...`);
                    
                    // Update existing records with a null avatar field
                    birthdays.forEach(birthday => {
                        if (!birthday.avatar) {
                            birthday.avatar = null;
                            store.put(birthday);
                        }
                    });
                    
                    console.log("Avatar field added to existing records.");
                };
            }
        };
    });
}

/**
 * Adds a new birthday record to the database.
 * Includes name, dob, phone, and avatar.
 * @param {object} birthday - The birthday object { name: string, dob: string, phone?: string, avatar?: string }.
 * @returns {Promise<number>} A promise that resolves with the ID of the newly added record.
 */
async function addBirthday(birthday) {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Make sure we have an avatar field, even if null
        if (!birthday.hasOwnProperty('avatar')) {
            birthday.avatar = null;
        }

        const request = store.add(birthday);

        request.onsuccess = (event) => {
            console.log("Birthday added with ID:", event.target.result);
            resolve(event.target.result); // Return the new ID
        };

        request.onerror = (event) => {
            console.error("Error adding birthday:", event.target.error);
            reject("Error adding birthday: " + event.target.error);
        };
    });
}

/**
 * Retrieves all birthday records from the database.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of birthday objects.
 */
async function getAllBirthdays() {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result || []); // Return results or empty array
        };

        request.onerror = (event) => {
            console.error("Error getting all birthdays:", event.target.error);
            reject("Error getting all birthdays: " + event.target.error);
        };
    });
}

/**
 * Retrieves a single birthday record by its ID.
 * @param {number} id - The ID of the birthday record.
 * @returns {Promise<object|undefined>} A promise that resolves with the birthday object or undefined if not found.
 */
async function getBirthdayById(id) {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = (event) => {
            resolve(event.target.result); // Returns the object or undefined
        };

        request.onerror = (event) => {
            console.error(`Error getting birthday with ID ${id}:`, event.target.error);
            reject(`Error getting birthday with ID ${id}: ` + event.target.error);
        };
    });
}

/**
 * Updates an existing birthday record in the database.
 * Includes name, dob, and optional phone and avatar.
 * @param {object} birthday - The birthday object with updated data (must include the 'id').
 * @returns {Promise<number>} A promise that resolves with the ID of the updated record.
 */
async function updateBirthday(birthday) {
    if (!birthday.id) {
        return Promise.reject("Birthday object must have an 'id' to be updated.");
    }
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Make sure we have an avatar field, even if null
        if (!birthday.hasOwnProperty('avatar')) {
            birthday.avatar = null;
        }

        const request = store.put(birthday); // put() updates if key exists, adds if not

        request.onsuccess = (event) => {
            console.log("Birthday updated with ID:", event.target.result);
            resolve(event.target.result); // Return the ID
        };

        request.onerror = (event) => {
            console.error("Error updating birthday:", event.target.error);
            reject("Error updating birthday: " + event.target.error);
        };
    });
}

/**
 * Deletes a birthday record from the database by its ID.
 * @param {number} id - The ID of the birthday record to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
async function deleteBirthday(id) {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log(`Birthday with ID ${id} deleted.`);
            resolve();
        };

        request.onerror = (event) => {
            console.error(`Error deleting birthday with ID ${id}:`, event.target.error);
            reject(`Error deleting birthday with ID ${id}: ` + event.target.error);
        };
    });
}

/**
 * Deletes all birthday records from the database.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
async function clearAllBirthdays() {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            console.log("All birthdays deleted.");
            resolve();
        };

        request.onerror = (event) => {
            console.error("Error clearing birthdays:", event.target.error);
            reject("Error clearing birthdays: " + event.target.error);
        };
    });
}

// Export functions for use in other scripts
window.db = {
    openDB,
    addBirthday,
    getAllBirthdays,
    getBirthdayById,
    updateBirthday,
    deleteBirthday,
    clearAllBirthdays
};

// Automatically open the DB when the script loads
openDB().catch(err => console.error("Failed to open DB on initial load:", err));
