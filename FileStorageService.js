// fileStorage.js

class FileStorageService {
	constructor(dbName = 'FileStorageDB', version = 1) {
		this.dbName = dbName;
		this.version = version;
		this.db = null;
	}

	// Initialize the database
	async initDB() {
		try {
			return new Promise((resolve, reject) => {
				const request = indexedDB.open(this.dbName, this.version);

				request.onerror = () => reject(request.error);
				request.onsuccess = () => {
					this.db = request.result;
					resolve(this.db);
				};

				request.onupgradeneeded = (event) => {
					const db = event.target.result;
					if (!db.objectStoreNames.contains('files')) {
						db.createObjectStore('files', { keyPath: 'id' });
					}
				};
			});
		} catch (error) {
			console.error('Error initializing DB:', error);
			throw error;
		}
	}

	// Save file to IndexedDB
	async saveFile(file) {
		try {
			return new Promise((resolve, reject) => {
				const transaction = this.db.transaction(['files'], 'readwrite');
				const store = transaction.objectStore('files');
				const fileData = {
					id: Date.now() + '-' + file.name, // Unique ID
					name: file.name,
					type: file.type,
					blob: file,
					timestamp: Date.now(),
				};

				const request = store.add(fileData);
				request.onsuccess = () => resolve(fileData);
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error('Error saving file:', error);
			throw error;
		}
	}

	// Load all files from IndexedDB
	async loadAllFiles() {
		try {
			return new Promise((resolve, reject) => {
				const transaction = this.db.transaction(['files'], 'readonly');
				const store = transaction.objectStore('files');
				const request = store.getAll();

				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error('Error loading files:', error);
			throw error;
		}
	}

	// Delete file from IndexedDB
	async deleteFile(fileId) {
		try {
			return new Promise((resolve, reject) => {
				const transaction = this.db.transaction(['files'], 'readwrite');
				const store = transaction.objectStore('files');
				const request = store.delete(fileId);

				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error('Error deleting file:', error);
			throw error;
		}
	}

	// Clear all files from IndexedDB
	async clearAllFiles() {
		try {
			return new Promise((resolve, reject) => {
				const transaction = this.db.transaction(['files'], 'readwrite');
				const store = transaction.objectStore('files');
				const request = store.clear();

				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error('Error clearing files:', error);
			throw error;
		}
	}
}

export default FileStorageService;
