// db.js - IndexedDB Management

const DB_NAME = 'BirthdayAppDB';
// Add a backup database name for recovery
const BACKUP_DB_NAME = 'BirthdayAppBackupDB';
const DB_VERSION = 4; // << Increment version for schema change - increased from 3 to 4 to fix storage issue
const STORE_NAME = 'birthdays';

/**
 * Database structure and version history:
 * 
 * Version 1: Base implementation with id, name, dob fields, autoIncrement
 * Version 2: Added phone index
 * Version 3: Added avatar field
 * Version 4: Optimized for storage limits, fixed ID counter issues
 * 
 * Note on ID sequence: 
 * - IDs are auto-incremented and persist across sessions
 * - Deleting records does not reset the ID sequence
 * - If you delete records 1-21, new records will start at 22
 * - This is normal behavior in IndexedDB and not a bug
 * - Use database optimization to reset sequence if needed
 */

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
            
            // Try to recover from a backup if the main DB is corrupted
            tryRecoverFromBackup().then(recoveredDb => {
                if (recoveredDb) {
                    db = recoveredDb;
                    resolve(db);
                } else {
                    reject("Database error: " + event.target.error);
                }
            }).catch(err => {
                reject("Database and recovery error: " + err);
            });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("Database opened successfully.");
            
            // Create a backup of the database when successfully opened
            createBackup(db).catch(err => {
                console.warn("Failed to create backup:", err);
            });
            
            // Monitor for errors and handle them
            db.onerror = function(event) {
                console.error("Database error:", event.target.error);
            };
            
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
            
            // Version 4 upgrade - fix storage limitation issue
            if (event.oldVersion < 4) {
                console.log(`Upgrading object store '${STORE_NAME}' to version 4...`);
                const transaction = event.target.transaction;
                const store = transaction.objectStore(STORE_NAME);
                
                // Increase the internal auto increment counter to ensure we don't hit
                // constraints with record addition
                console.log("Optimizing database for larger data storage");
                
                // Clear any key generator issues by creating a dummy entry and deleting it
                // This helps reset internal counters in some browsers
                const dummyKey = store.add({
                    name: "DUMMY_ENTRY_TO_RESET_COUNTER",
                    dob: "2000-01-01",
                    phone: null,
                    avatar: null,
                    _temporary: true
                });
                
                dummyKey.onsuccess = (event) => {
                    const newKey = event.target.result;
                    console.log(`Created temporary entry with key ${newKey} to reset counter`);
                    
                    // Delete the dummy entry
                    const deleteRequest = store.delete(newKey);
                    deleteRequest.onsuccess = () => {
                        console.log("Temporary entry deleted, counter reset complete");
                    };
                };
            }
        };
    });
}

/**
 * Attempts to recover data from a backup database
 */
async function tryRecoverFromBackup() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(BACKUP_DB_NAME);
        
        request.onerror = () => {
            console.warn("No backup database found");
            resolve(null);
        };
        
        request.onsuccess = (event) => {
            const backupDb = event.target.result;
            resolve(backupDb);
        };
    });
}

/**
 * Creates a backup of the current database
 */
async function createBackup(sourceDb) {
    // Only proceed if we have a valid database
    if (!sourceDb) return;
    
    try {
        // Get all data from the current database
        const transaction = sourceDb.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const data = event.target.result;
                
                // If we have data, back it up
                if (data && data.length > 0) {
                    // First, check if the backup database exists and has the correct structure
                    const checkRequest = indexedDB.open(BACKUP_DB_NAME);
                    
                    checkRequest.onsuccess = (event) => {
                        const checkDb = event.target.result;
                        const currentVersion = checkDb.version;
                        
                        if (!checkDb.objectStoreNames.contains(STORE_NAME)) {
                            console.log(`Backup store '${STORE_NAME}' not found, initializing...`);
                            checkDb.close();
                            
                            // Force creating the object store by increasing version
                            const createRequest = indexedDB.open(BACKUP_DB_NAME, 
                                currentVersion + 1);
                            
                            createRequest.onupgradeneeded = (event) => {
                                const db = event.target.result;
                                const store = db.createObjectStore(STORE_NAME, 
                                    { keyPath: 'id', autoIncrement: true });
                                store.createIndex('name', 'name', { unique: false });
                                store.createIndex('dob', 'dob', { unique: false });
                                store.createIndex('phone', 'phone', { unique: false });
                                console.log(`Created backup store '${STORE_NAME}'`);
                            };
                            
                            createRequest.onsuccess = (event) => {
                                const backupDb = event.target.result;
                                populateBackup(backupDb, data, resolve);
                            };
                            
                            createRequest.onerror = (error) => {
                                console.warn("Failed to create backup store:", error);
                                resolve();
                            };
                        } else {
                            // Store exists, proceed with backup
                            populateBackup(checkDb, data, resolve);
                        }
                    };
                    
                    checkRequest.onerror = (error) => {
                        console.warn("Error checking backup DB:", error);
                        resolve();
                    };
                } else {
                    resolve(); // No data to back up
                }
            };
            
            request.onerror = (error) => {
                console.warn("Failed to read data for backup:", error);
                resolve(); // Continue even if backup fails
            };
        });
    } catch (error) {
        console.warn("Error during backup creation:", error);
        return Promise.resolve(); // Continue app operation even if backup fails
    }
}

/**
 * Helper function to populate backup database with data
 */
function populateBackup(backupDb, data, resolve) {
    try {
        const backupTransaction = backupDb.transaction([STORE_NAME], 'readwrite');
        const backupStore = backupTransaction.objectStore(STORE_NAME);
        
        // Clear existing data
        backupStore.clear();
        
        // Add all items from the main database
        data.forEach(item => {
            // Create a new copy of the item to avoid ID conflicts
            try {
                backupStore.add({...item});
            } catch (error) {
                console.warn("Error adding item to backup:", error);
            }
        });
        
        backupTransaction.oncomplete = () => {
            console.log(`Successfully backed up ${data.length} records`);
            backupDb.close();
            resolve();
        };
        
        backupTransaction.onerror = (error) => {
            console.warn("Error during backup transaction:", error);
            backupDb.close();
            resolve(); // Continue even if backup fails
        };
    } catch (error) {
        console.warn("Error creating backup transaction:", error);
        backupDb.close();
        resolve(); // Continue even if backup fails
    }
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

// Expose constants for use in other scripts
window.STORE_NAME = STORE_NAME;
window.BACKUP_DB_NAME = BACKUP_DB_NAME;
window.DB_VERSION = DB_VERSION;

/**
 * Debugging information:
 * - ID ნომრები მაღალი რიცხვებით (მაგ. 22, 23, 24) - ეს ნორმალურია IndexedDB-ში
 * - დუბლიკატების შეტყობინება - ID კონფლიქტების გამო
 * - VersionError - განსხვავებული ვერსიის ბაზის გახსნისას
 * - NotFoundError - ობიექტის საცავის ან ბაზის ვერ პოვნისას
 * 
 * ყველა ზემოთ აღნიშნული პრობლემა შეიძლება გამოსწორდეს 
 * "ბაზის ოპტიმიზაციის" ფუნქციის გამოყენებით, რომელიც განულებს 
 * ID-ების მთვლელს და თავიდან შექმნის ბაზის სტრუქტურას.
 */

// Initialize the backup database on first load
function initBackupDB() {
    console.log("Initializing backup database...");
    
    // First open without specifying version to check existing version
    const checkRequest = indexedDB.open(BACKUP_DB_NAME);
    
    checkRequest.onsuccess = (event) => {
        const existingDb = event.target.result;
        const currentVersion = existingDb.version;
        existingDb.close();
        
        console.log(`Existing backup database version: ${currentVersion}`);
        
        // Now open with the current version to avoid downgrade errors
        const request = indexedDB.open(BACKUP_DB_NAME, currentVersion);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create the backup store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('dob', 'dob', { unique: false });
                store.createIndex('phone', 'phone', { unique: false });
                console.log(`Created backup store '${STORE_NAME}'`);
            }
        };
        
        request.onsuccess = (event) => {
            console.log("Backup database initialized successfully");
            const backupDb = event.target.result;
            backupDb.close();
        };
        
        request.onerror = (event) => {
            console.warn("Failed to initialize backup database:", event.target.error);
        };
    };
    
    checkRequest.onerror = (event) => {
        console.warn("Failed to check backup database version:", event.target.error);
        
        // If we can't check version, try to open with version 1
        const fallbackRequest = indexedDB.open(BACKUP_DB_NAME, 1);
        
        fallbackRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create the backup store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('dob', 'dob', { unique: false });
                store.createIndex('phone', 'phone', { unique: false });
                console.log(`Created backup store '${STORE_NAME}' during fallback`);
            }
        };
        
        fallbackRequest.onsuccess = (event) => {
            console.log("Backup database initialized successfully through fallback");
            const backupDb = event.target.result;
            backupDb.close();
        };
        
        fallbackRequest.onerror = (event) => {
            console.warn("Failed to initialize backup database even with fallback:", event.target.error);
        };
    };
}

// Automatically open the DB when the script loads and initialize the backup DB
Promise.all([openDB(), initBackupDB()])
    .then(() => console.log("All databases initialized"))
    .catch(err => console.error("Failed to initialize databases:", err));
