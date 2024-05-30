/**
 * @description Class to handle the storage of data for the tracker
 * @class TrackerStorage
 * @property  {IDBDatabase} db - The database instance
 * @property  {function} handleDbError - The function to handle database errors
 * @property  {function} handleDbSuccess - The function to handle database success
 * @property  {function} handleDbUpgradeNeeded - The function to handle database upgrade needed
 * @property  {function} bindEvents - The function to bind events to the database
 * @property  {function} init - The function to initialize the database
 * @property  {function} createTables - The function to create tables in the database
 * @property  {function} getStore - The function to get the object store for the database
 * @property  {function} saveData - The function to save data to the database
 * @property  {function} getData - The function to get data from the database
 * @property  {function} getTableData - The function to get all data from a table
 * @property  {function} updateData - The function to update data in the database
 */
export default class TrackerStorage {
    /**
     * @param  {string} [dbName='tracker'] name of the database
     */
    constructor(dbName = 'tracker') {
        const db = window.indexedDB.open(dbName, 1);

        if (!db) {
            throw new Error('Database could not be created');
        }

        this.db = db;
        this.init();
    }

    /**
     * @description Creates the tables for the database
     * @param  {IDBDatabase} [db=this.db]
     * @returns {void}
     */
    createTables(db = this.db) {
        if (!db) {
            throw new Error('Database not available');
        }
        const healthTable = db.createObjectStore('health', { keyPath: 'date' });
        const exerciseTable = db.createObjectStore('activities', { keyPath: 'date' });
        const consumptionTable = db.createObjectStore('consumption', { keyPath: 'date' });

        healthTable.createIndex('date', 'date', { unique: true });
        healthTable.createIndex('bmi', 'bmi', { unique: false });
        healthTable.createIndex('weight', 'weight', { unique: false });
        healthTable.createIndex('water', 'water', { unique: false });

        consumptionTable.createIndex('date', 'date', { unique: true });

        exerciseTable.createIndex('date', 'date', { unique: true });
    }

    /**
     * @description Get the object store for the database
     * @param  {string} tableName='health'
     * @returns {IDBObjectStore} The object store
     */
    getStore(tableName = 'health') {
        if (!this.db) {
            throw new Error('Database not available');
        }

        const transaction = this.db.transaction([tableName], 'readwrite');

        return transaction.objectStore(tableName);
    }

    /**
     * @description Save data to the database (if data already exists, it updates)
     * @param  {Object} data - The data to save
     * @param  {string} [table='health'] - The table to save the data to
     * @returns {Promise<>}
     */
    async saveData(data, table = 'health') {
        if (!this.db) {
            throw new Error('Database not available');
        }

        const alreadyExists = await this.getData(data.date, table);
        if (alreadyExists) {
            return this.updateData(data, table);
        }
        const store = this.getStore(table);

        return new Promise((resolve, reject) => {
            const query = store.add(data);
            query.onsuccess = (event) => {
                resolve(event);
            };
            query.onerror = (event) => {
                reject(event);
            };
        });
    }

    /**
     * @description Get data from a table
     * @param  {string} key - The key to get
     * @param  {string} table='health'
     * @returns {Promise<Object>}
     */
    getData(key, table = 'health') {
        if (!this.db) {
            throw new Error('Database not available');
        }

        const store = this.getStore(table);
        return new Promise((resolve, reject) => {
            const query = store.get(key);
            query.onsuccess = (event) => {
                resolve(event.target.result);
            };
            query.onerror = (event) => {
                reject(event);
            };
        });
    }

    /**
     * @description Get all data from a table
     * @param  {string} [table='health'] name of the table
     * @returns {Promise<Array<Object>>}
     */
    getTableData(table = 'health') {
        if (!this.db) {
            throw new Error('Database not available');
        }

        if (!table) {
            throw new Error('Table name required');
        }

        const store = this.getStore(table);

        return new Promise((resolve, reject) => {
            let cursor = store.openCursor();
            const rows = [];
            cursor.onsuccess = (event) => {
                cursor = event.target.result;
                if (cursor) {
                    rows.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(rows);
                }
            };

            cursor.onerror = (event) => {
                reject(event);
            };
        });
    }

    /**
     * @description Update data in the database
     * @param  {Object} updateData data to update
     * @param  {string} [table='health'] name of the table
     * @returns {Promise<>}
     */
    updateData(updateData, table = 'health') {
        if (!this.db) {
            throw new Error('Database not available');
        }

        const store = this.getStore(table);

        return new Promise((resolve, reject) => {
            const query = store.put(updateData);
            query.onsuccess = (event) => {
                resolve(event);
            };
            query.onerror = (event) => {
                reject(event);
            };
        });
    }

    // eslint-disable-next-line class-methods-use-this
    handleDbError(event) {
        throw new Error('Database error', event);
    }

    handleDbSuccess(event) {
        this.db = event.target.result;
    }

    handleDbUpgradeNeeded(event) {
        this.db = event.target.result;
        this.createTables(this.db);
    }

    /**
     * @description Binds events to the database
     * @returns {void}
     */
    bindEvents() {
        if (!this.db) {
            return;
        }
        this.db.addEventListener('error', (event) => {
            this.handleDbError(event);
        });
        this.db.addEventListener('success', (event) => {
            this.handleDbSuccess(event);
        });
        this.db.addEventListener('upgradeneeded', (event) => {
            this.handleDbUpgradeNeeded(event);
        });
    }

    /**
     * @description Initializes the database
     * @returns {void}
     */
    init() {
        this.bindEvents();
    }
}
