document.addEventListener('DOMContentLoaded', function () {
	const fileInput = document.getElementById('file');
	const previewContainer = document.getElementById('filePreviewContainer');
	const fileDropArea = document.querySelector('.files');
	const maxFiles = 100;
	let uploadedFiles = [];
	let db;

	// Initialize IndexedDB
	const initDB = () => {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('FileStorageDB', 1);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				db = request.result;
				resolve(db);
			};

			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				if (!db.objectStoreNames.contains('files')) {
					db.createObjectStore('files', { keyPath: 'id' });
				}
			};
		});
	};

	// Save file to IndexedDB
	const saveFileToDB = async (file) => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(['files'], 'readwrite');
			const store = transaction.objectStore('files');
			const fileId = 	file.name;
			const fileData = {
				id: fileId,
				name: file.name,
				type: file.type,
				blob: file,
				timestamp: Date.now(),
			};

			// Store the ID on the file object itself
			file.fileId = fileId; // Add this line

			const request = store.add(fileData);
			request.onsuccess = () => resolve(fileData);
			request.onerror = () => reject(request.error);
		});
	};
	// Load files from IndexedDB
	const loadFilesFromDB = async () => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(['files'], 'readonly');
			const store = transaction.objectStore('files');
			const request = store.getAll();

			request.onsuccess = () => {
				const files = request.result;
				uploadedFiles = files.map((fileData) => fileData.blob);
				resolve(files);
			};
			request.onerror = () => reject(request.error);
		});
	};

	// Delete file from IndexedDB
	const deleteFileFromDB = async (fileId) => {
		console.log(fileId, 'FIeID')
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(['files'], 'readwrite');
			const store = transaction.objectStore('files');
			const request = store.delete(fileId);

			request.onsuccess = () => resolve();
			request.onerror = (...errArray) => {
				console.log(error,errArray)
				reject(request.error)
			};
		});
	};

	// Initialize the application
	const init = async () => {
		try {
			await initDB();
			const savedFiles = await loadFilesFromDB();
			if (savedFiles.length > 0) {
				updateFilePreview();
				fileDropArea.setAttribute('data-before', `${savedFiles.length} files loaded`);
			} else {
				fileDropArea.setAttribute('data-before', 'Drag file here or click to upload');
			}
		} catch (error) {
			console.error('Error initializing:', error);
		}
	};

	// File Input Change Handler
	fileInput.addEventListener('change', async function (e) {
		const newFiles = Array.from(e.target.files);

		if (uploadedFiles.length + newFiles.length > maxFiles) {
			alert(`You can only upload up to ${maxFiles} files.`);
			return;
		}

		const pdfFiles = newFiles.filter((file) => file.type === 'application/pdf');
		if (pdfFiles.length !== newFiles.length) {
			alert('Only PDF files are allowed');
			return;
		}

		// Save each file to IndexedDB
		for (const file of pdfFiles) {
			try {
				await saveFileToDB(file);
			} catch (error) {
				console.error('Error saving file:', error);
			}
		}

		uploadedFiles = [...uploadedFiles, ...pdfFiles];
		updateFilePreview();

		fileDropArea.setAttribute(
			'data-before',
			uploadedFiles.length
				? `${uploadedFiles.length} files selected`
				: 'Drag file here or click to upload'
		);
	});

	// Update File Preview with file IDs
	function updateFilePreview() {
		previewContainer.innerHTML = '';

		uploadedFiles.forEach((file, index) => {
			const fileItem = document.createElement('div');
			fileItem.className = 'file-item';

			const previewSection = document.createElement('div');
			previewSection.className = 'file-preview-section';

			const objectPreview = document.createElement('object');
			objectPreview.data = URL.createObjectURL(file);
			objectPreview.type = 'application/pdf';
			objectPreview.width = '100%';
			objectPreview.height = '150px';
			previewSection.appendChild(objectPreview);

			const fileInfo = document.createElement('div');
			fileInfo.className = 'file-info';
			fileInfo.innerHTML = `
							<span class="file-name">${file.name}</span>
    <div class="file-actions">
        <button type="button" class="preview-btn" data-index="${index}">Preview</button>
        <button type="button" class="remove-file" data-index="${index}" data-file-id="${file.name}">&times;</button>
    </div>
					`;

			fileItem.appendChild(previewSection);
			fileItem.appendChild(fileInfo);
			previewContainer.appendChild(fileItem);

			const previewBtn = fileItem.querySelector('.preview-btn');
			previewBtn.addEventListener('click', () => {
				showFullPreview(file);
			});
		});

		document.querySelectorAll('.remove-file').forEach((button) => {
			button.addEventListener('click', async function () {
				const index = parseInt(this.getAttribute('data-index'));
				const fileId = this.getAttribute('data-file-id');
				console.log('fileIDDDD', fileId)
				await removeFile(index, fileId);
			});
		});
	}

	// Remove File with IndexedDB deletion
	async function removeFile(index, fileId) {
		try {
			await deleteFileFromDB(fileId);
			uploadedFiles.splice(index, 1);
			updateFilePreview();

			fileDropArea.setAttribute(
				'data-before',
				uploadedFiles.length
					? `${uploadedFiles.length} files selected`
					: 'Drag file here or click to upload'
			);

			if (uploadedFiles.length === 0) {
				fileInput.value = '';
			}
		} catch (error) {
			console.error('Error removing file:', error);
		}
	}

	// Show full preview modal (unchanged)
	function showFullPreview(file) {
		const modal = document.createElement('div');
		modal.className = 'preview-modal';

		modal.innerHTML = `
					<div class="modal-content">
							<div class="modal-header">
									<h5>${file.name}</h5>
									<button class="close-modal">&times;</button>
							</div>
							<div class="modal-body">
									<object data="${URL.createObjectURL(file)}" 
													type="application/pdf" 
													width="100%" 
													height="100%">
											<p>Unable to display PDF file. <a href="${URL.createObjectURL(
												file
											)}" target="_blank">Download</a> instead.</p>
									</object>
							</div>
					</div>
			`;

		document.body.appendChild(modal);

		const closeBtn = modal.querySelector('.close-modal');
		closeBtn.addEventListener('click', () => {
			document.body.removeChild(modal);
		});

		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				document.body.removeChild(modal);
			}
		});
	}

	// Initialize the application
	init();
});
