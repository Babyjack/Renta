/*
 * SCRIPT.JS
 * This file handles all the logic for the real estate investment calculator.
 * It reads user input, performs calculations, and updates the UI.
 */

// --- DOM ELEMENTS ---
// Get all number input elements to listen for changes.
const inputs = document.querySelectorAll('input[type="number"]');

// Get all output elements to display results.
const outputElements = {
    endettementActuel: document.getElementById('outputEndettementActuel'),
    endettementProjetSeul: document.getElementById('outputEndettementProjetSeul'),
    endettementTotal: document.getElementById('outputEndettementTotal'),
    capacite: document.getElementById('outputCapacite'),
    capaciteLocative: document.getElementById('outputCapaciteLocative'),
    mensualite: document.getElementById('outputMensualite'),
    capaciteMensualite: document.getElementById('outputCapaciteMensualite'),
    cashflow: document.getElementById('outputCashflow'),
    rendement: document.getElementById('outputRendement'),
    rendementSouhaite: document.getElementById('outputRendementSouhaite'),
    prixCible: document.getElementById('outputPrixCible'),
    reductionCible: document.getElementById('outputReductionCible'),
    prixAcceptable: document.getElementById('outputPrixAcceptable'),
    reductionMinimum: document.getElementById('outputReductionMinimum'),
};

// Get container elements that are conditionally shown/hidden.
const conditionalContainers = {
    locatifResults: document.getElementById('locatifResults'),
    locatifResults2: document.getElementById('locatifResults2'),
    locatifResults3: document.getElementById('locatifResults3'),
    locatifResults4: document.getElementById('locatifResults4'),
    reductionResults: document.getElementById('reductionResults'),
    reductionResults2: document.getElementById('reductionResults2'),
    itemPrixCible: document.getElementById('itemPrixCible'),
    itemReductionCible: document.getElementById('itemReductionCible'),
};

const errorElement = document.getElementById('error');

// --- DATA MANAGEMENT ---
// An array of input IDs to easily save and load data from local storage.
const inputIds = ['prix', 'loyer', 'taux', 'duree', 'salaire', 'mensualiteActuel', 'endettementMax', 'loyerPrisEnCompte'];

/**
 * Saves the current value of each input to the browser's local storage.
 * This function ensures that the user's data persists between sessions.
 */
function saveData() {
    inputIds.forEach(id => {
        const value = document.getElementById(id).value;
        localStorage.setItem(id, value);
    });
}

/**
 * Loads saved data from local storage and populates the input fields.
 * This is called on page load to restore the previous state.
 */
function loadData() {
    inputIds.forEach(id => {
        const savedValue = localStorage.getItem(id);
        if (savedValue !== null) {
            document.getElementById(id).value = savedValue;
        }
    });
}

// --- CALCULATION LOGIC ---
/**
 * Main calculation function. It validates inputs, performs all financial calculations,
 * and updates the UI with the results.
 */
function calculate() {
    // 1. Get and parse input values.
    // parseFloat is used for decimals, parseInt for integers.
    const salaire = parseFloat(document.getElementById('salaire').value);
    const mensualiteActuel = parseFloat(document.getElementById('mensualiteActuel').value);
    const prix = parseFloat(document.getElementById('prix').value);
    const loyer = parseFloat(document.getElementById('loyer').value);
    const tauxAnnuel = parseFloat(document.getElementById('taux').value);
    const nbMensualites = parseInt(document.getElementById('duree').value, 10);
    const endettementMax = parseFloat(document.getElementById('endettementMax').value) / 100;
    const loyerPrisEnCompte = parseFloat(document.getElementById('loyerPrisEnCompte').value) / 100;

    // 2. Input Validation
    // This check ensures all inputs are valid numbers and greater than zero where required.
    // If validation fails, show an error and hide all result fields.
    if (isNaN(salaire) || isNaN(mensualiteActuel) || isNaN(prix) || isNaN(loyer) || isNaN(tauxAnnuel) || isNaN(nbMensualites) ||
        isNaN(endettementMax) || isNaN(loyerPrisEnCompte) ||
        salaire < 0 || mensualiteActuel < 0 || prix <= 0 || loyer < 0 || tauxAnnuel <= 0 || nbMensualites <= 0) {
        errorElement.style.display = 'block';
        Object.values(outputElements).forEach(el => el.textContent = '...');
        Object.values(conditionalContainers).forEach(el => el.style.display = 'none');
        return;
    }
    // Hide the error message if all inputs are valid.
    errorElement.style.display = 'none';

    // 3. Calculation Constants & Utilities
    const currencyFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
    const tauxMensuel = tauxAnnuel / 100 / 12;

    // 4. Financial Calculations
    // A. Current Situation
    const endettementActuelTaux = salaire > 0 ? (mensualiteActuel / salaire) : 0;
    // Utilise la valeur d'endettement max du nouvel input
    const capaciteEndettement = endettementMax * salaire;

    // B. Project Metrics (Loan details)
    // PMT factor for calculating the monthly mortgage payment.
    const facteurPMT = (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / (Math.pow(1 + tauxMensuel, nbMensualites) - 1);
    const mensualiteProjet = prix * facteurPMT;

    // C. Rental-related Calculations
    const cashflow = loyer - mensualiteProjet;
    const endettementProjetSeulTaux = loyer > 0 ? (mensualiteProjet / loyer) : 0;
    const rendementBrut = prix > 0 && loyer > 0 ? ((loyer * 12) / prix) * 100 : 0;
    
    // Formula for calculating the desired return rate based on the loan.
    const part1 = (1 - Math.pow(1 + tauxMensuel, -nbMensualites)) / tauxMensuel;
    // Utilise la valeur d'endettement max du nouvel input
    const rendementSouhaite = (12 / (endettementMax * part1)) * 100;
    
    // Calculate the target price to achieve the desired return.
    const prixCibleRendement = rendementSouhaite > 0 && loyer > 0 ? (loyer * 12) / (rendementSouhaite / 100) : 0;
    const reductionCible = prix > 0 ? ((prix - prixCibleRendement) / prix) * 100 : 0;
    
    // Capacity to borrow based on rental income, using the new input value
    const capaciteEmpruntLocative = endettementMax * (loyerPrisEnCompte * loyer);

    // D. Combined Financial Analysis
    // Calculates the remaining borrowing capacity after the project's monthly payment.
    const capaciteMensualite = capaciteEndettement + capaciteEmpruntLocative - mensualiteProjet - mensualiteActuel;

    // E. Negotiation Calculations
    const denominateurDette = loyer + salaire;
    const endettementTotalTaux = denominateurDette > 0 ? ((mensualiteProjet + mensualiteActuel) / denominateurDette) : 0;
    
    // Calculates the maximum purchase price while respecting the new debt ratio.
    const mensualiteCible = (endettementMax * denominateurDette) - mensualiteActuel;
    let prixAcceptable = 0;
    if (mensualiteCible > 0 && facteurPMT > 0) {
        prixAcceptable = mensualiteCible / facteurPMT;
    }
    const reductionMinimum = prix > 0 ? ((prix - prixAcceptable) / prix) * 100 : 0;

    // 5. UI Updates
    
    // A. Update permanent results
    outputElements.mensualite.textContent = currencyFormatter.format(mensualiteProjet);
    outputElements.endettementActuel.textContent = `${(endettementActuelTaux * 100).toFixed(1).replace('.', ',')} %`;
    outputElements.capacite.textContent = currencyFormatter.format(Math.max(0, capaciteEndettement));
    
    // Update the 'Capacité-Mensualité' value and apply a color class based on its sign.
    outputElements.capaciteMensualite.textContent = currencyFormatter.format(capaciteMensualite);
    outputElements.capaciteMensualite.className = `value ${capaciteMensualite >= 0 ? 'cashflow-positive' : 'cashflow-negative'}`;

    // B. Conditionally show/hide rental-related results.
    const isRentalProject = loyer > 0;
    conditionalContainers.locatifResults.style.display = isRentalProject ? 'block' : 'none';
    conditionalContainers.locatifResults2.style.display = isRentalProject ? 'block' : 'none';
    conditionalContainers.locatifResults3.style.display = isRentalProject ? 'block' : 'none';
    conditionalContainers.locatifResults4.style.display = isRentalProject ? 'block' : 'none';
    
    if (isRentalProject) {
        outputElements.cashflow.textContent = currencyFormatter.format(cashflow);
        outputElements.endettementProjetSeul.textContent = `${(endettementProjetSeulTaux * 100).toFixed(1).replace('.', ',')} %`;
        outputElements.rendement.textContent = `${rendementBrut.toFixed(2).replace('.', ',')} %`;
        outputElements.rendementSouhaite.textContent = `${rendementSouhaite.toFixed(2).replace('.', ',')} %`;
        outputElements.capaciteLocative.textContent = currencyFormatter.format(capaciteEmpruntLocative);

        // Update cashflow color.
        outputElements.cashflow.className = `value ${cashflow >= 0 ? 'cashflow-positive' : 'cashflow-negative'}`;

        // Conditionally show/hide target price and reduction.
        const shouldShowTargetPrice = prix >= prixCibleRendement;
        conditionalContainers.itemPrixCible.style.display = shouldShowTargetPrice ? 'flex' : 'none';
        conditionalContainers.itemReductionCible.style.display = shouldShowTargetPrice ? 'flex' : 'none';
        
        if (shouldShowTargetPrice) {
            outputElements.prixCible.textContent = currencyFormatter.format(prixCibleRendement);
            outputElements.reductionCible.textContent = `${Math.max(0, reductionCible).toFixed(1).replace('.', ',')} %`;
        }
    }

    // C. Conditionally show/hide negotiation results.
    const isNegotiationRequired = prix > prixAcceptable;
    conditionalContainers.reductionResults.style.display = isNegotiationRequired ? 'block' : 'none';
    conditionalContainers.reductionResults2.style.display = isNegotiationRequired ? 'block' : 'none';

    if (isNegotiationRequired) {
        outputElements.endettementTotal.textContent = `${(endettementTotalTaux * 100).toFixed(1).replace('.', ',')} %`;
        outputElements.prixAcceptable.textContent = currencyFormatter.format(prixAcceptable);
        outputElements.reductionMinimum.textContent = `${Math.max(0, reductionMinimum).toFixed(1).replace('.', ',')} %`;
    }
    
    // Save the new data after a successful calculation.
    saveData();
}

// --- EVENT LISTENERS ---
// Listen for input events on all number fields. This makes the calculation dynamic.
inputs.forEach(input => input.addEventListener('input', calculate));

// --- INITIALIZATION ---
// Load saved data and perform the initial calculation when the page first loads.
loadData();
calculate();
