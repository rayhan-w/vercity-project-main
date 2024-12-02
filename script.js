const signUpButton=document.getElementById('signUpButton');
const signInButton=document.getElementById('signInButton');
const signInForm=document.getElementById('signIn');
const signUpForm=document.getElementById('signup');

signUpButton.addEventListener('click',function(){
    signInForm.style.display="none";
    signUpForm.style.display="block";
})
signInButton.addEventListener('click', function(){
    signInForm.style.display="block";
    signUpForm.style.display="none";
})

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
