document.addEventListener('DOMContentLoaded', () => {
    // IndexedDB setup
    const DB_NAME = 'PetrolCalculatorDB';
    const STORE_NAME = 'petrolEntries';
    let db;

    // Open the IndexedDB database
    const request = indexedDB.open(DB_NAME, 1);

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
        loadHistory();
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

    // Default prices based on West Malaysia data (from HTML)
    const defaultPrices = {
        '95': 2.05,
        '97': 3.47,
        'Diesel': 2.15
    };

    let fullHistoryMode = false;

    // --- FUNCTIONS ---

    // Function to update the price input based on selected RON type
    function updatePriceInput() {
        const selectedRon = pumpRonSelect.value;
        litersPriceInput.value = defaultPrices[selectedRon];
    }

    // Function to calculate fuel efficiency
    function calculateFuelEfficiency(mileage, pumpAmount) {
        return (mileage / pumpAmount).toFixed(2);
    }

    // Function to save an entry to the database
    function saveEntry(entry) {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.add(entry);

        request.onsuccess = () => {
            console.log('Entry added successfully.');
            loadHistory(); // Reload history after saving
        };

        request.onerror = (event) => {
            console.error('Error adding entry:', event.target.error);
        };
    }

    // Function to load and display history
    function loadHistory() {
        historyBody.innerHTML = ''; // Clear existing rows
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            let entries = event.target.result;

            if (entries.length > 5 && !fullHistoryMode) {
                viewAllHistoryBtn.style.display = 'block';
            } else {
                viewAllHistoryBtn.style.display = 'none';
            }

            const entriesToRender = fullHistoryMode ? entries : entries.slice(-5);
            entriesToRender.reverse().forEach(entry => {
                const row = document.createElement('tr');
                row.className = 'bg-white border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${entry.date}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${entry.mileageReading} KM</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">RON ${entry.fuelType}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">RM ${entry.litersPrice}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${entry.kmPerRM}</td>
                `;
                historyBody.appendChild(row);
            });
        };
    }

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

        // Calculate
        const kmPerRm = calculateFuelEfficiency(mileage, pumpAmount);
        const totalLiters = (pumpAmount / litersPrice).toFixed(2);

        // Display results
        kmPerRmDisplay.textContent = `${kmPerRm} KM per RM`;
        resultsDetailsDisplay.textContent = `Based on a ${mileage} KM trip, using ${totalLiters} liters of ${ron} at RM${litersPrice} per liter, for RM${pumpAmount} over ${durationDays} days.`;
        resultsDiv.classList.remove('hidden');

        // Prepare data for saving
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
            kmPerRM: kmPerRm
        };

        // Save and re-render history
        saveEntry(entry);

        // Clear form after submission
        form.reset();
        updatePriceInput();
    });

    // Update price on RON selection change
    pumpRonSelect.addEventListener('change', updatePriceInput);

    // Reset history button
    resetHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const clearRequest = objectStore.clear();

            clearRequest.onsuccess = () => {
                console.log('History cleared successfully.');
                loadHistory(); // Reload to show empty table
                resultsDiv.classList.add('hidden');
            };
        }
    });

    // View All History button
    viewAllHistoryBtn.addEventListener('click', () => {
        fullHistoryMode = true;
        loadHistory();
    });

    // Initial page load
    updatePriceInput();
});

// Add this code to the very top of your main.js file
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered!', reg))
            .catch(err => console.log('Service Worker registration failed: ', err));
    });
}