// Get a reference to all the output elements and input fields by their IDs
const outputElements = {
    endettementPropre: document.getElementById('outputEndettementPropre'),
    endettementTotal: document.getElementById('outputEndettementTotal'),
    capaciteEmpruntPropre: document.getElementById('outputCapaciteEmpruntPropre'),
    capaciteEmpruntLocative: document.getElementById('outputCapaciteEmpruntLocative'),
    mensualiteProjet: document.getElementById('outputMensualiteProjet'),
    capaciteMensualite: document.getElementById('outputCapaciteMensualite'),
    cashflowBrut: document.getElementById('outputCashflowBrut'),
    rendementBrut: document.getElementById('outputRendementBrut'),
    rendementCible: document.getElementById('outputRendementCible'),
    prixCible: document.getElementById('outputPrixCible')
};

// Get references to the conditional containers that can be hidden or shown
const conditionalContainers = {
    locatifResults: document.getElementById('locatifResults'),
    locatifResults2: document.getElementById('locatifResults2'),
    locatifResults3: document.getElementById('locatifResults3'),
    locatifResults4: document.getElementById('locatifResults4'),
    situationResults: document.getElementById('situationResults') // This is the container we will modify
};

const inputElements = {
    prix: document.getElementById('prix'),
    loyer: document.getElementById('loyer'),
    tauxAnnuel: document.getElementById('tauxAnnuel'),
    nbMensualites: document.getElementById('nbMensualites'),
    salaireActuel: document.getElementById('salaireActuel'),
    mensualitesActuelles: document.getElementById('mensualitesActuelles')
};

// Get a reference to the error message element
const errorElement = document.getElementById('error-message');

// Define a currency formatter for euros
const currencyFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

// A debounced function to call the calculate function after a small delay
const debouncedCalculate = debounce(calculate, 300);

// Add event listeners to all input fields to trigger the calculation
Object.values(inputElements).forEach(input => {
    input.addEventListener('input', debouncedCalculate);
});

// Main calculation function
function calculate() {
    // 1. Get input values and validate them
    const prix = parseFloat(inputElements.prix.value);
    const loyer = parseFloat(inputElements.loyer.value);
    const tauxAnnuel = parseFloat(inputElements.tauxAnnuel.value);
    const nbMensualites = parseFloat(inputElements.nbMensualites.value);
    const salaireActuel = parseFloat(inputElements.salaireActuel.value);
    const mensualitesActuelles = parseFloat(inputElements.mensualitesActuelles.value);

    // Initial validation check to hide all results if any primary input is invalid
    if (isNaN(prix) || prix <= 0 || isNaN(tauxAnnuel) || tauxAnnuel <= 0 || isNaN(nbMensualites) || nbMensualites <= 0) {
        errorElement.style.display = 'block';
        Object.values(outputElements).forEach(el => el.textContent = '...');
        Object.values(conditionalContainers).forEach(el => el.style.display = 'none');
        // We now explicitly show the situationResults container, but with blank values
        conditionalContainers.situationResults.style.display = 'block';
        return;
    } else {
        errorElement.style.display = 'none';
    }

    // 2. Calculations
    const mensualiteProjet = calculateMensualiteProjet(prix, tauxAnnuel, nbMensualites);
    const tauxEndettementAcceptable = 0.35; // 35%
    const mensualiteMax = (salaireActuel || 0) * tauxEndettementAcceptable;
    const mensualiteRestante = Math.max(0, mensualiteMax - (mensualitesActuelles || 0));

    // A. Calculations for the project's debt
    const endettementPropreTaux = mensualiteProjet / Math.max(1, salaireActuel || 0);

    // B. Conditional calculations for rental projects
    const isRentalProject = loyer > 0;
    let capaciteEmpruntLocative = 0;
    let cashflowBrut = 0;
    let rendementBrut = 0;
    let rendementCible = 0;
    let prixCible = 0;

    if (isRentalProject) {
        capaciteEmpruntLocative = calculateCapaciteEmprunt(
            mensualiteMax,
            mensualitesActuelles,
            loyer,
            tauxAnnuel,
            nbMensualites
        );
        cashflowBrut = loyer - mensualiteProjet;
        rendementBrut = (loyer * 12) / prix;

        // Calculate a target yield based on a reasonable return
        const rendementObjectif = 0.05; // 5%
        prixCible = (loyer * 12) / rendementObjectif;
    }

    // C. Update the display for conditional containers
    conditionalContainers.locatifResults.style.display = isRentalProject ? 'block' : 'none';
    conditionalContainers.locatifResults2.style.display = isRentalProject ? 'block' : 'none';
    conditionalContainers.locatifResults3.style.display = isRentalProject ? 'block' : 'none';
    conditionalContainers.locatifResults4.style.display = isRentalProject ? 'block' : 'none';

    // D. Calculations for total debt (always shown, but values depend on inputs)
    const isSituationDataValid = !isNaN(salaireActuel) && !isNaN(mensualitesActuelles);

    // This section no longer hides the container. It just updates the values.
    conditionalContainers.situationResults.style.display = 'block';
    if (isSituationDataValid) {
        const endettementTotalTaux = (mensualiteProjet + mensualitesActuelles) / salaireActuel;
        outputElements.endettementPropre.textContent = `${(endettementPropreTaux * 100).toFixed(1).replace('.', ',')} %`;
        outputElements.endettementTotal.textContent = `${(endettementTotalTaux * 100).toFixed(1).replace('.', ',')} %`;
    } else {
        // Clear the values if inputs are not valid
        outputElements.endettementPropre.textContent = '...';
        outputElements.endettementTotal.textContent = '...';
    }

    // E. Update the display with calculated values
    outputElements.capaciteEmpruntPropre.textContent = currencyFormatter.format(mensualiteRestante);
    outputElements.capaciteEmpruntLocative.textContent = currencyFormatter.format(capaciteEmpruntLocative);
    outputElements.mensualiteProjet.textContent = currencyFormatter.format(mensualiteProjet);
    outputElements.capaciteMensualite.textContent = currencyFormatter.format(mensualiteRestante - mensualiteProjet);
    outputElements.cashflowBrut.textContent = currencyFormatter.format(cashflowBrut);
    outputElements.rendementBrut.textContent = `${(rendementBrut * 100).toFixed(1).replace('.', ',')} %`;
    outputElements.rendementCible.textContent = `${(rendementObjectif * 100).toFixed(1).replace('.', ',')} %`;
    outputElements.prixCible.textContent = currencyFormatter.format(prixCible);

    // 3. Helper Functions
    // Function to calculate monthly payment
    function calculateMensualiteProjet(capital, tauxAnnuel, dureeMois) {
        if (tauxAnnuel === 0) return capital / dureeMois;
        const tauxMensuel = tauxAnnuel / 1200;
        return capital * tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -dureeMois));
    }

    // Function to calculate borrowing capacity based on remaining monthly payment
    function calculateCapaciteEmprunt(mensualiteMax, mensualitesActuelles, loyer, tauxAnnuel, dureeMois) {
        const tauxMensuel = tauxAnnuel / 1200;
        const mensualiteEmpruntMax = Math.max(0, mensualiteMax - mensualitesActuelles + (loyer * 0.7));
        return mensualiteEmpruntMax / tauxMensuel * (1 - Math.pow(1 + tauxMensuel, -dureeMois));
    }
}

// Debounce function to limit how often a function is called
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}
