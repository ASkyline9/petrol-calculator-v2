// --- FUNCTIONS ---
// Initialize EmailJS and send notification
function initializeEmailAndSendNotification() {
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS is not loaded');
        return;
    }
    
    // Replace with your EmailJS Public Key
    emailjs.init("u8q8lvRWe9DBYUXRt"); 
    console.log('Petrol Cal loaded successfully');
    
    const toast = document.getElementById('notificationToast');
    if (toast) {
        toast.style.display = 'block';
        sendVisitNotification();
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    }
}

// Function to get visitor's IP address
async function getVisitorIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.log('Error fetching IP:', error);
        return 'Unable to detect';
    }
}

// Function to send visit notification
async function sendVisitNotification() {
    const page = "https://askyline9.github.io/petrol-calculator-v2/";
    const referrer = document.referrer || 'Direct visit';
    const time = new Date();
    const userAgent = navigator.userAgent;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const language = navigator.language || navigator.userLanguage;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const ipAddress = await getVisitorIP();
    
    const formattedTime = time.toLocaleString('en-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    const pageTitle = document.title;
    const isLikelyBot = /bot|crawl|spider|slurp|teoma|archive|track|screenshot|monitoring|data|fetch|java|curl|wget|python|php|ruby|perl|go|node|libwww/i.test(userAgent);
    
    const emailContent = `
🌐 NEW VISITOR ON Petrol Calculator 🌐

📄 Page Visited: ${pageTitle}
🔗 URL: ${page}
🌐 IP Address: ${ipAddress}

⏰ Visit Time: ${formattedTime}
🗺️ Timezone: ${timezone}

📍 Referral Source: ${referrer}
🌐 Language: ${language}

💻 Device Information:
- User Agent: ${userAgent}
- Screen Resolution: ${screenResolution}
- ${isLikelyBot ? '🤖 Likely Bot/Crawler' : '👤 Likely Human Visitor'}

---
This notification was sent automatically from your Petrol Calculator website.
    `;
    
    const templateParams = {
        to_email: 'aa.skyline99@gmail.com',
        from_name: 'Petrol Cal Visitor Alert',
        message: emailContent,
        reply_to: 'noreply@skylinehub.com',
        subject: 'New Visitor Petrol Calculator',
        website: 'Petrol Calculator',
        ip_address: ipAddress,
        email_subject: 'New Visitor Petrol Calculator',
        title: 'New Visitor Petrol Calculator'
    };
    
    emailjs.send('service_cc9cmen', 'template_kel4u0e', templateParams)
        .then(function(response) {
            console.log('Notification sent successfully!', response.status, response.text);
            const toast = document.getElementById('notificationToast');
            if (toast) {
                toast.textContent = 'Notification sent successfully!';
            }
        }, function(error) {
            console.log('Failed to send notification.', error);
            const toast = document.getElementById('notificationToast');
            if (toast) {
                toast.textContent = 'Notification failed. Check console.';
                toast.style.background = '#e74c3c';
            }
        });
}

// Function to update the price input based on selected RON type
function updatePriceInput(pumpRonSelect, litersPriceInput, defaultPrices) {
    const selectedRon = pumpRonSelect.value;
    litersPriceInput.value = defaultPrices[selectedRon];
}

// Function to calculate fuel efficiency
function calculateFuelEfficiency(mileage, pumpAmount) {
    if (pumpAmount === 0 || isNaN(pumpAmount)) {
        return 'N/A';
    }
    return (mileage / pumpAmount).toFixed(2);
}

// Function to save an entry to the database
function saveEntry(db, STORE_NAME, entry, loadHistory) {
    if (!db) {
        console.error('Database not open. Cannot save entry.');
        return;
    }
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(entry);

    request.onsuccess = () => {
        console.log('Entry added successfully.');
        loadHistory();
    };

    request.onerror = (event) => {
        console.error('Error adding entry:', event.target.error);
    };
}

// Function to load and display history
function loadHistory(db, historyBody, STORE_NAME, viewAllHistoryBtn, fullHistoryMode) {
    if (!db) {
        console.warn('Database not yet open for history load. Retrying in 500ms...');
        setTimeout(() => loadHistory(db, historyBody, STORE_NAME, viewAllHistoryBtn, fullHistoryMode), 500);
        return;
    }

    historyBody.innerHTML = '';
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
        let entries = event.target.result;
        entries.sort((a, b) => b.id - a.id);

        if (entries.length > 5 && !fullHistoryMode) {
            viewAllHistoryBtn.style.display = 'block';
        } else {
            viewAllHistoryBtn.style.display = 'none';
        }

        const entriesToRender = fullHistoryMode ? entries : entries.slice(0, 5);
        
        entriesToRender.forEach(entry => {
            const row = document.createElement('tr');
            row.className = 'bg-white border-b hover:bg-gray-50';

            let photoCell = '';
            if (entry.receiptPhoto) {
                // Use URL.createObjectURL to create a URL for the stored Blob
                const imageUrl = URL.createObjectURL(entry.receiptPhoto);
                photoCell = `<td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500 receipt-cell"><img src="${imageUrl}" class="w-10 h-10 object-cover rounded-md"></td>`;
                // Add an event listener to revoke the URL after the image has loaded to free up memory
                row.onload = () => URL.revokeObjectURL(imageUrl);
            } else {
                photoCell = `<td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500 receipt-cell">No Photo</td>`;
            }

            row.innerHTML = `
                <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${entry.date}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${entry.mileageReading} KM</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">RON ${entry.fuelType}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">RM ${entry.litersPrice}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${entry.kmPerRM}</td>
                ${photoCell}
            `;

            historyBody.appendChild(row);
        });
    };
}


// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered!', reg))
            .catch(err => console.log('Service Worker registration failed: ', err));
    });
}

// --- MAIN SCRIPT EXECUTION ---

document.addEventListener('DOMContentLoaded', () => {
    // IndexedDB setup
    const DB_NAME = 'PetrolCalculatorDB';
    const STORE_NAME = 'petrolEntries';
    let db;

    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = (event) => {
        console.error('Database error:', event.target.errorCode);
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('date', 'date', { unique: false });
        console.log('Database setup complete.');
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Database opened successfully.');
        loadHistory(db, historyBody, STORE_NAME, viewAllHistoryBtn, fullHistoryMode);
    };

    // DOM Elements
    const form = document.getElementById('calculator-form');
    const mileageInput = document.getElementById('mileage');
    const pumpRonSelect = document.getElementById('pumpRon');
    const litersPriceInput = document.getElementById('litersPrice');
    const pumpAmountInput = document.getElementById('pumpAmount');
    const durationDaysInput = document.getElementById('durationDays');
    const resultsDiv = document.getElementById('results');
    const kmPerRmDisplay = document.getElementById('km-per-rm');
    const resultsDetailsDisplay = document.getElementById('results-details');
    const historyBody = document.getElementById('history-body');
    const resetHistoryBtn = document.getElementById('reset-history');
    const viewAllHistoryBtn = document.getElementById('view-all-history');
    const receiptPhotoInput = document.getElementById('receipt-photo');

    // Default prices based on West Malaysia data (from HTML)
    const defaultPrices = {
        '95': 2.60,
	'BUDI95': 1.99,
        '97': 3.21,
        'Diesel': 2.93
    };

    let fullHistoryMode = false;

    // --- EVENT LISTENERS ---

    // PWA Install Logic
    let deferredPrompt;
    const installButton = document.getElementById('install-button');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.classList.remove('hidden');
    });

    installButton.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
                installButton.classList.add('hidden');
            });
        }
    });
    
    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const mileage = parseFloat(mileageInput.value);
        const pumpAmount = parseFloat(pumpAmountInput.value);
        const litersPrice = parseFloat(litersPriceInput.value);
        const ron = pumpRonSelect.value;
        const durationDays = durationDaysInput.value;
        
        if (isNaN(mileage) || isNaN(pumpAmount) || isNaN(litersPrice) || isNaN(durationDays) ||
            mileage <= 0 || pumpAmount <= 0 || litersPrice <= 0 || durationDays < 0) {
            alert("Please fill in all fields with valid positive numbers.");
            return;
        }

        const receiptPhotoFile = receiptPhotoInput.files[0];

        const kmPerRm = calculateFuelEfficiency(mileage, pumpAmount);
        const totalLiters = (litersPrice !== 0 && !isNaN(litersPrice)) ? (pumpAmount / litersPrice).toFixed(2) : 'N/A';

        kmPerRmDisplay.textContent = `${kmPerRm} KM per RM`;
        resultsDetailsDisplay.textContent = `Based on a ${mileage} KM trip, using ${totalLiters} liters of ${ron} at RM${litersPrice} per liter, for RM${pumpAmount} over ${durationDays} days.`;
        resultsDiv.classList.remove('hidden');

        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();
        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        const entry = {
            date: formattedDate,
            mileageReading: mileage,
            fuelType: ron,
            litersPrice: litersPrice,
            pumpAmount: pumpAmount,
            durationDays: durationDays,
            kmPerRM: kmPerRm,
            receiptPhoto: receiptPhotoFile
        };

        saveEntry(db, STORE_NAME, entry, () => loadHistory(db, historyBody, STORE_NAME, viewAllHistoryBtn, fullHistoryMode));

        form.reset();
        updatePriceInput(pumpRonSelect, litersPriceInput, defaultPrices);
    });

    // Update price on RON selection change
    pumpRonSelect.addEventListener('change', () => updatePriceInput(pumpRonSelect, litersPriceInput, defaultPrices));

    // Reset history button
    resetHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            if (!db) {
                console.error('Database not open. Cannot clear history.');
                return;
            }
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const clearRequest = objectStore.clear();

            clearRequest.onsuccess = () => {
                console.log('History cleared successfully.');
                loadHistory(db, historyBody, STORE_NAME, viewAllHistoryBtn, fullHistoryMode);
                resultsDiv.classList.add('hidden');
            };

            clearRequest.onerror = (event) => {
                console.error('Error clearing history:', event.target.error);
            };
        }
    });

    // View All History button
    viewAllHistoryBtn.addEventListener('click', () => {
        fullHistoryMode = true;
        loadHistory(db, historyBody, STORE_NAME, viewAllHistoryBtn, fullHistoryMode);
    });

    // Initial page load
    updatePriceInput(pumpRonSelect, litersPriceInput, defaultPrices);
    initializeEmailAndSendNotification();
});