// Configuration
const API_BASE = 'http://localhost:3000/api';
let isConnected = false;

// Utility Functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function fixAccentedText(text) {
    return text
        .replace(/Ã©/g, 'é')
        .replace(/Ã¨/g, 'è')
        .replace(/Ã /g, 'à')
        .replace(/Ã§/g, 'ç')
        .replace(/Ã´/g, 'ô')
        .replace(/Ã»/g, 'û')
        .replace(/Ã®/g, 'î')
        .replace(/Ã¢/g, 'â')
        .replace(/Ã«/g, 'ë')
        .replace(/Ã¯/g, 'ï')
        .replace(/Ã¹/g, 'ù')
        .replace(/Ã /g, 'à')
        .replace(/Ã‡/g, 'Ç')
        .replace(/Ã‰/g, 'É')
        .replace(/Ã¨/g, 'È');
}

function showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style the toast
    Object.assign(toast.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        background: type === 'success' ? 'rgba(52, 199, 89, 0.95)' : 
                   type === 'error' ? 'rgba(255, 59, 48, 0.95)' : 'rgba(0, 122, 255, 0.95)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.9rem',
        fontWeight: '500',
        transform: 'translateX(400px)',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        minWidth: '250px'
    });
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Animation utilities
function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const opacity = Math.min(progress / duration, 1);
        
        element.style.opacity = opacity;
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate);
}

function slideDown(element, duration = 300) {
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    const targetHeight = element.scrollHeight;
    let start = null;
    
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const height = Math.min((progress / duration) * targetHeight, targetHeight);
        
        element.style.height = height + 'px';
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        } else {
            element.style.height = '';
            element.style.overflow = '';
        }
    }
    requestAnimationFrame(animate);
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    populatePersonSelectors();
    checkConnection();
    setupTabNavigation();
    setupAnimations();
    injectAdditionalStyles();
    
    // Check connection every 5 seconds
    setInterval(checkConnection, 5000);
    
    showToast('Interface d\'enquête initialisée', 'success');
});

function populatePersonSelectors() {
    const persons = ['john', 'mary', 'alice', 'bruno', 'sophie', 'pierre', 'claire', 'lucas'];
    const selectors = ['suspect-person', 'quick-person', 'evidence-person'];
    
    selectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            selector.innerHTML = '<option value="">Choisir une personne...</option>';
            persons.forEach(person => {
                selector.innerHTML += `<option value="${person}">${capitalizeFirst(person)}</option>`;
            });
        }
    });
}

function setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.getAttribute('data-tab');
            showTab(targetTab, this);
        });
    });
}

function setupAnimations() {
    // Add intersection observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    // Observe all panels
    document.querySelectorAll('.panel, .person-card, .crime-analysis').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        observer.observe(el);
    });
}

function injectAdditionalStyles() {
    const additionalStyles = `
    .investigation-header h4,
    .evidence-header h4 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        font-size: 1.2rem;
        color: #1d1d1f;
        font-weight: 600;
    }

    .status-indicator-large {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-radius: 12px;
        margin: 20px 0;
        font-weight: 600;
        font-size: 1.1rem;
        justify-content: center;
    }

    .evidence-section h5 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 20px 0 15px;
        color: #007AFF;
        font-weight: 600;
    }

    .solution-container {
        max-width: 100%;
        margin: 0 auto;
    }

    .status-section {
        margin: 25px 0;
        padding: 20px;
        border-radius: 12px;
        background: rgba(248, 248, 248, 0.8);
    }

    .status-section h5 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
        font-weight: 600;
        font-size: 1.1rem;
    }

    .person-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .person-tag {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 20px;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.3s ease;
    }

    .person-tag:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .person-tag small {
        font-size: 0.8em;
        opacity: 0.8;
        display: block;
        margin-top: 2px;
    }

    .solution-summary {
        background: rgba(255, 255, 255, 0.95);
        padding: 40px;
        border-radius: 20px;
        margin: 30px 0;
        text-align: center;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.1);
    }

    .solution-summary h3 {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 30px;
        color: #1d1d1f;
        font-size: 1.8rem;
    }

    .toast {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
}

// Connection Management
async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE}/persons`, { 
            method: 'GET',
            timeout: 5000 
        });
        
        if (response.ok) {
            setConnectionStatus(true);
        } else {
            setConnectionStatus(false);
        }
    } catch (error) {
        setConnectionStatus(false);
        console.warn('Connection check failed:', error.message);
    }
}

function setConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    const wasConnected = isConnected;
    isConnected = connected;
    
    if (connected) {
        statusEl.innerHTML = '<i class="fas fa-wifi"></i><span>Connecté au serveur Prolog</span>';
        statusEl.className = 'status-indicator status-connected';
        
        if (!wasConnected) {
            showToast('Connexion au serveur Prolog établie', 'success');
        }
    } else {
        statusEl.innerHTML = '<i class="fas fa-wifi"></i><span>Déconnecté du serveur Prolog</span>';
        statusEl.className = 'status-indicator status-disconnected';
        
        if (wasConnected) {
            showToast('Connexion au serveur Prolog perdue', 'error');
        }
    }
}

// Loading Management
function showLoading(elementId, show = true) {
    const loadingEl = document.getElementById(elementId);
    if (loadingEl) {
        if (show) {
            loadingEl.style.display = 'block';
            loadingEl.classList.add('show');
        } else {
            loadingEl.classList.remove('show');
            setTimeout(() => {
                loadingEl.style.display = 'none';
            }, 300);
        }
    }
}

function showError(elementId, message) {
    const resultEl = document.getElementById(elementId);
    if (resultEl) {
        resultEl.innerHTML = `<div class="error-message">${fixAccentedText(message)}</div>`;
        slideDown(resultEl);
    }
}

function showSuccess(elementId, message) {
    const resultEl = document.getElementById(elementId);
    if (resultEl) {
        resultEl.innerHTML = `<div class="success-message">${fixAccentedText(message)}</div>`;
        slideDown(resultEl);
    }
}

// Tab Management
function showTab(tabName, clickedTab) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected content with animation
    const selectedContent = document.getElementById(tabName);
    const selectedTab = clickedTab;
    
    if (selectedContent && selectedTab) {
        selectedContent.classList.add('active');
        selectedTab.classList.add('active');
        
        // Special actions for specific tabs
        if (tabName === 'suspects') {
            setTimeout(loadPersonsData, 200);
        }
        
        // Trigger re-animation of elements in the new tab
        const panels = selectedContent.querySelectorAll('.panel, .person-card');
        panels.forEach((panel, index) => {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(20px)';
            setTimeout(() => {
                panel.style.opacity = '1';
                panel.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

// Investigation Functions
async function investigateSuspect() {
    console.log("The button is clicked");
    if (!isConnected) {
        showError('investigation-result', 'Serveur Prolog déconnecté. Veuillez réessayer lorsque la connexion sera rétablie.');
        showToast('Serveur déconnecté', 'error');
        return;
    }

    const person = document.getElementById('suspect-person').value;
    const crime = document.getElementById('suspect-crime').value;
    
    if (!person || !crime) {
        showError('investigation-result', 'Veuillez sélectionner une personne et un crime avant de lancer l\'enquête.');
        return;
    }

    showLoading('investigation-loading', true);
    document.getElementById('investigation-result').innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/investigate?person=${person}&crime=${crime}`)
        const data = await response.json();
        showLoading('investigation-loading', false);

        if (response.ok) {
            console.log(data);
            console.log(data.status);
            displayInvestigationResult(data);
            showToast(`Enquête terminée pour ${capitalizeFirst(person)}`, 'success');
        } else {
            showError('investigation-result', 'Erreur lors de la consultation du moteur Prolog. Veuillez réessayer.');
            showToast('Erreur lors de l\'enquête', 'error');
        }
    } catch (error) {
        showLoading('investigation-loading', false);
        showError('investigation-result', `Erreur de connexion: ${error.message}`);
        showToast('Erreur de connexion', 'error');
        console.error('Investigation error:', error);
    }
}

function displayInvestigationResult(data) {
    const resultEl = document.getElementById('investigation-result');
    const personName = capitalizeFirst(data.person);
    const crimeName = capitalizeFirst(data.crime);

    let result = `<div class="investigation-header">
        <h4><i class="fas fa-search"></i> Enquête Prolog: ${personName} - ${crimeName}</h4>
    </div>`;
    
    let statusClass, statusIcon, statusText;
    switch(data.status) {
        case 'coupable':
            statusClass = 'status-guilty';
            statusText = 'COUPABLE';
            break;
        case 'complice':
            statusClass = 'status-complice';
            statusText = 'COMPLICE';
            break;
        case 'suspect':
            statusClass = 'status-suspect';
            statusText = 'SUSPECT';
            break;
        default:
            statusClass = 'status-innocent';
            statusText = 'INNOCENT';
    }

    result += `<div class="status-indicator-large ${statusClass}">
        <i class="${statusIcon}"></i>
        <span>${statusText}</span>
    </div>`;

    if (data.evidence && data.evidence.length > 0) {
        result += '<div class="evidence-section"><h5><i class="fas fa-clipboard-list"></i> Preuves Prolog:</h5><ul class="evidence-list">';
        data.evidence.forEach(evidence => {
            result += `<li class="evidence-item">
                <div class="evidence-type">${fixAccentedText(evidence.type)}</div>
                <div class="evidence-description">${fixAccentedText(evidence.description)}</div>
            </li>`;
        });
        result += '</ul></div>';
    }

    resultEl.innerHTML = result;
    slideDown(resultEl);
}

async function quickTest() {
    if (!isConnected) {
        showError('quick-result', 'Serveur Prolog déconnecté');
        showToast('Serveur déconnecté', 'error');
        return;
    }

    const person = document.getElementById('quick-person').value;
    const crime = document.getElementById('quick-crime').value;
    
    if (!person || !crime) {
        showError('quick-result', 'Veuillez sélectionner une personne et un crime');
        return;
    }

    showLoading('quick-loading', true);
    document.getElementById('quick-result').innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/investigate?person=${person}&crime=${crime}`);
        const data = await response.json();
        showLoading('quick-loading', false);
        if (response.ok) {
            const resultEl = document.getElementById('quick-result');
            const personName = capitalizeFirst(data.person);
            
            let statusClass, resultText, iconClass;
            switch(data.status) {
                case 'coupable':
                    statusClass = 'error-message';
                    resultText = `${personName} est COUPABLE`;
                    break;
                case 'complice':
                    statusClass = 'error-message';
                    resultText = `${personName} est COMPLICE`;
                    break;
                case 'suspect':
                    statusClass = '';
                    resultText = `${personName} est SUSPECT`;
                    break;
                default:
                    statusClass = 'success-message';
                    resultText = `${personName} est INNOCENT`;
            }

            resultEl.innerHTML = `<div class="${statusClass}" style="text-align: center; font-size: 1.1em;">
                <i class="${iconClass}"></i> ${resultText}
            </div>`;
            slideDown(resultEl);
            showToast(`Test rapide: ${resultText}`, data.status === 'innocent' ? 'success' : 'error');
        } else {
            showError('quick-result', 'Erreur lors du test Prolog');
            showToast('Erreur lors du test', 'error');
        }
    } catch (error) {
        showLoading('quick-loading', false);
        showError('quick-result', `Erreur de connexion: ${error.message}`);
        showToast('Erreur de connexion', 'error');
        console.error('Quick test error:', error);
    }
}

// Persons Management
async function loadPersonsData() {
    if (!isConnected) {
        showError('persons-grid', 'Serveur Prolog déconnecté');
        return;
    }

    showLoading('persons-loading', true);
    document.getElementById('persons-grid').innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/persons`);
        const data = await response.json();
        showLoading('persons-loading', false);

        if (response.ok) {
            displayPersonsGrid(data.persons);
            showToast(`${data.persons.length} personnes chargées`, 'success');
        } else {
            showError('persons-grid', 'Erreur lors du chargement des données Prolog');
            showToast('Erreur de chargement', 'error');
        }
    } catch (error) {
        showLoading('persons-loading', false);
        showError('persons-grid', `Erreur de connexion: ${error.message}`);
        showToast('Erreur de connexion', 'error');
        console.error('Load persons error:', error);
    }
}

function displayPersonsGrid(persons) {
    const grid = document.getElementById('persons-grid');
    grid.innerHTML = '';

    persons.forEach((personData, index) => {
        const card = document.createElement('div');
        card.className = 'person-card';
        
        // Determine overall status
        let overallStatus = 'innocent';
        let statusInfo = '';
        let statusCounts = { coupable: 0, complice: 0, suspect: 0, innocent: 0 };

        personData.crimes.forEach(crimeData => {
            const status = crimeData.status;
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            
            if (status === 'coupable' && overallStatus !== 'coupable') {
                overallStatus = 'coupable';
            } else if (status === 'complice' && overallStatus !== 'coupable' && overallStatus !== 'complice') {
                overallStatus = 'complice';
            } else if (status === 'suspect' && overallStatus === 'innocent') {
                overallStatus = 'suspect';
            }

            let statusIcon, statusColor;
            switch(status) {
                case 'coupable': 
                    statusIcon = 'fas fa-exclamation-triangle';
                    statusColor = '#FF3B30';
                    break;
                case 'complice': 
                    statusIcon = 'fas fa-handshake';
                    statusColor = '#FF9500';
                    break;
                case 'suspect': 
                    statusIcon = 'fas fa-search';
                    statusColor = '#FF2D92';
                    break;
                default: 
                    statusIcon = 'fas fa-check-circle';
                    statusColor = '#34C759';
            }

            statusInfo += `<div style="margin: 8px 0; font-size: 0.9em; display: flex; align-items: center; gap: 8px; color: ${statusColor}">
                <i class="${statusIcon}"></i>
                <strong>${capitalizeFirst(crimeData.crime)}:</strong> ${status.toUpperCase()}
            </div>`;
        });

        card.className += ` ${overallStatus}`;
        
        let overallIcon, overallColor;
        switch(overallStatus) {
            case 'coupable': 
                overallIcon = 'fas fa-exclamation-triangle';
                overallColor = '#FF3B30';
                break;
            case 'complice': 
                overallIcon = 'fas fa-handshake';
                overallColor = '#FF9500';
                break;
            case 'suspect': 
                overallIcon = 'fas fa-search';
                overallColor = '#FF2D92';
                break;
            default: 
                overallIcon = 'fas fa-check-circle';
                overallColor = '#34C759';
        }

        card.innerHTML = `
            <div class="person-name">${capitalizeFirst(personData.name)}</div>
            <div style="font-size: 3em; margin: 16px 0; color: ${overallColor};">
                <i class="${overallIcon}"></i>
            </div>
            <div style="font-weight: 600; margin-bottom: 20px; text-transform: uppercase; color: ${overallColor}; font-size: 1.1em;">
                ${overallStatus}
            </div>
            <div style="border-top: 1px solid rgba(0,0,0,0.1); padding-top: 16px;">
                ${statusInfo}
            </div>
        `;

        // Add animation delay
        card.style.animationDelay = `${index * 0.1}s`;
        grid.appendChild(card);
    });
}

// Evidence Management
async function loadPersonEvidence() {
    if (!isConnected) {
        showError('person-evidence-result', 'Serveur Prolog déconnecté');
        return;
    }

    const person = document.getElementById('evidence-person').value;
    if (!person) {
        showError('person-evidence-result', 'Veuillez sélectionner une personne');
        return;
    }

    showLoading('person-evidence-loading', true);
    document.getElementById('person-evidence-result').innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/evidence?person=${person}`);
        const data = await response.json();
        showLoading('person-evidence-loading', false);

        if (response.ok) {
            displayPersonEvidence(person, data.evidence);
            showToast(`Indices chargés pour ${capitalizeFirst(person)}`, 'success');
        } else {
            showError('person-evidence-result', 'Erreur lors du chargement des indices');
            showToast('Erreur de chargement des indices', 'error');
        }
    } catch (error) {
        showLoading('person-evidence-loading', false);
        showError('person-evidence-result', `Erreur de connexion: ${error.message}`);
        showToast('Erreur de connexion', 'error');
        console.error('Load person evidence error:', error);
    }
}

function displayPersonEvidence(person, evidence) {
    const resultEl = document.getElementById('person-evidence-result');
    const personName = capitalizeFirst(person);

    let result = `<div class="evidence-header">
        <h4><i class="fas fa-clipboard-list"></i> Indices Prolog - ${personName}</h4>
    </div>`;

    if (evidence && evidence.length > 0) {
        result += '<ul class="evidence-list">';
        evidence.forEach(evidenceItem => {
            result += `<li class="evidence-item">
                <div class="evidence-type">${fixAccentedText(evidenceItem.type)}</div>
                <div class="evidence-description">${fixAccentedText(evidenceItem.description)}</div>
            </li>`;
        });
        result += '</ul>';
    } else {
        result += `<div style="text-align: center; padding: 30px; color: #6e6e73; font-style: italic;">
            <i class="fas fa-search" style="font-size: 2em; margin-bottom: 16px; opacity: 0.5;"></i><br>
            Aucun indice trouvé pour ce crime.
        </div>`;
    }

    resultEl.innerHTML = result;
    slideDown(resultEl);
}

// Final Solution
async function revealFinalSolution() {
    if (!isConnected) {
        showError('final-solution', 'Serveur Prolog déconnecté');
        showToast('Serveur déconnecté', 'error');
        return;
    }

    showLoading('reveal-loading', true);
    document.getElementById('final-solution').innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/full-analysis`);
        const data = await response.json();
        showLoading('reveal-loading', false);

        if (response.ok) {
            displayFinalSolution(data.crimes);
            showToast('Solution finale révélée', 'success');
        } else {
            showError('final-solution', 'Erreur lors du calcul de la solution finale');
            showToast('Erreur lors du calcul', 'error');
        }
    } catch (error) {
        showLoading('reveal-loading', false);
        showError('final-solution', `Erreur de connexion: ${error.message}`);
        showToast('Erreur de connexion', 'error');
        console.error('Reveal final solution error:', error);
    }
}

function displayFinalSolution(crimes) {
    const resultEl = document.getElementById('final-solution');
    let result = '<div class="solution-container">';

    crimes.forEach(crimeData => {
        result += `<div class="crime-analysis">`;
        result += `<div class="crime-title">
            <i class="fas fa-balance-scale"></i>
            ${crimeData.crime.toUpperCase()}
        </div>`;

        // Main criminals
        if (crimeData.guilty && crimeData.guilty.length > 0) {
            result += `<div class="status-section guilty-section">
                <h5><i class="fas fa-exclamation-triangle"></i> COUPABLES PRINCIPAUX</h5>
                <div class="person-list">`;
            crimeData.guilty.forEach(criminal => {
                result += `<div class="person-tag guilty">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${capitalizeFirst(criminal)}
                </div>`;
            });
            result += `</div></div>`;
        }

        // Accomplices
        if (crimeData.accomplices && crimeData.accomplices.length > 0) {
            result += `<div class="status-section accomplice-section">
                <h5><i class="fas fa-handshake"></i> COMPLICES</h5>
                <div class="person-list">`;
            crimeData.accomplices.forEach(accompliceData => {
                result += `<div class="person-tag complice">
                    <i class="fas fa-handshake"></i>
                    ${capitalizeFirst(accompliceData.accomplice)}
                    <small>(complice de ${accompliceData.main_criminal})</small>
                </div>`;
            });
            result += `</div></div>`;
        }

        // Suspects
        if (crimeData.suspects && crimeData.suspects.length > 0) {
            result += `<div class="status-section suspect-section">
                <h5><i class="fas fa-search"></i> SUSPECTS RESTANTS</h5>
                <div class="person-list">`;
            crimeData.suspects.forEach(suspect => {
                result += `<div class="person-tag suspect">
                    <i class="fas fa-search"></i>
                    ${capitalizeFirst(suspect)}
                </div>`;
            });
            result += `</div></div>`;
        }

        // Innocents
        if (crimeData.innocents && crimeData.innocents.length > 0) {
            result += `<div class="status-section innocent-section">
                <h5><i class="fas fa-check-circle"></i> INNOCENTS</h5>
                <div class="person-list">`;
            crimeData.innocents.forEach(innocent => {
                result += `<div class="person-tag innocent">
                    <i class="fas fa-check-circle"></i>
                    ${capitalizeFirst(innocent)}
                </div>`;
            });
            result += `</div></div>`;
        }

        // If no specific results
        if (!crimeData.guilty?.length && !crimeData.accomplices?.length && 
            !crimeData.suspects?.length && !crimeData.innocents?.length) {
            result += `<div style="text-align: center; padding: 30px; color: #6e6e73; font-style: italic;">
                <i class="fas fa-question-circle" style="font-size: 2em; margin-bottom: 16px; opacity: 0.5;"></i><br>
                Aucun résultat spécifique identifié par Prolog pour ce crime.
            </div>`;
        }

        result += `</div>`;
    });

    // Statistics summary
    let totalGuilty = 0;
    let totalAccomplices = 0;
    let totalSuspects = 0;
    let totalInnocents = 0;

    crimes.forEach(crimeData => {
        totalGuilty += crimeData.guilty ? crimeData.guilty.length : 0;
        totalAccomplices += crimeData.accomplices ? crimeData.accomplices.length : 0;
        totalSuspects += crimeData.suspects ? crimeData.suspects.length : 0;
        totalInnocents += crimeData.innocents ? crimeData.innocents.length : 0;
    });

    result += `<div class="solution-summary">
        <h3><i class="fas fa-chart-bar"></i> Résumé Statistique</h3>
        <div class="stats-grid">
            <div class="stat-card stat-guilty">
                <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="stat-number">${totalGuilty}</div>
                <div class="stat-label">Coupables</div>
            </div>
            <div class="stat-card stat-complice">
                <div class="stat-icon"><i class="fas fa-handshake"></i></div>
                <div class="stat-number">${totalAccomplices}</div>
                <div class="stat-label">Complices</div>
            </div>
            <div class="stat-card stat-suspect">
                <div class="stat-icon"><i class="fas fa-search"></i></div>
                <div class="stat-number">${totalSuspects}</div>
                <div class="stat-label">Suspects</div>
            </div>
            <div class="stat-card stat-innocent">
                <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                <div class="stat-number">${totalInnocents}</div>
                <div class="stat-label">Innocents</div>
            </div>
        </div>
    </div>`;

    result += `</div>`;

    resultEl.innerHTML = result;
    fadeIn(resultEl);

    // Animate stats
    setTimeout(() => {
        animateStats();
    }, 500);
}

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.textContent);
        let current = 0;
        const increment = target / 30;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = target;
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 50);
    });
}

// Global functions that might be called from HTML onclick attributes
window.investigateSuspect = investigateSuspect;
window.quickTest = quickTest;
window.loadPersonsData = loadPersonsData;
window.loadPersonEvidence = loadPersonEvidence;
window.loadCrimeEvidence = loadCrimeEvidence;
window.revealFinalSolution = revealFinalSolution;
window.showTab = showTab;

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        investigateSuspect,
        quickTest,
        loadPersonsData,
        loadPersonEvidence,
        loadCrimeEvidence,
        revealFinalSolution,
        showTab,
        capitalizeFirst,
        fixAccentedText,
        showToast
    };
}

resultEl.innerHTML = `
    <div>
        <i></i><br>
        Aucun indice spécifique trouvé pour cette personne.
    </div>`;
slideDown(resultEl);


async function loadCrimeEvidence() {
    if (!isConnected) {
        showError('crime-evidence-result', 'Serveur Prolog déconnecté');
        return;
    }

    const crime = document.getElementById('evidence-crime').value;
    if (!crime) {
        showError('crime-evidence-result', 'Veuillez sélectionner un crime');
        return;
    }

    showLoading('crime-evidence-loading', true);
    document.getElementById('crime-evidence-result').innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/evidence?crime=${crime}`);
        const data = await response.json();
        showLoading('crime-evidence-loading', false);

        if (response.ok) {
            displayCrimeEvidence(crime, data.evidence);
            showToast(`Indices chargés pour ${capitalizeFirst(crime)}`, 'success');
        } else {
            showError('crime-evidence-result', 'Erreur lors du chargement des indices');
            showToast('Erreur de chargement des indices', 'error');
        }
    } catch (error) {
        showLoading('crime-evidence-loading', false);
        showError('crime-evidence-result', `Erreur de connexion: ${error.message}`);
        showToast('Erreur de connexion', 'error');
        console.error('Load crime evidence error:', error);
    }
}

function displayCrimeEvidence(crime, evidence) {
    const resultEl = document.getElementById('crime-evidence-result');
    const crimeName = capitalizeFirst(crime);

    let result = `<div class="evidence-header">
        <h4><i class="fas fa-clipboard-list"></i> Indices Prolog - ${crimeName}</h4>
    </div>`;

    if (evidence && evidence.length > 0) {
        result += '<ul class="evidence-list">';
        evidence.forEach(item => {
            const personName = capitalizeFirst(item.person);
            result += `<li class="evidence-item">
                <div class="evidence-type">
                    <i class="fas fa-user"></i> ${personName}
                </div>
                <div class="evidence-description">
                    ${fixAccentedText(item.evidence.description)} 
                    <span style="color: #007AFF; font-weight: 500;">(${fixAccentedText(item.evidence.type)})</span>
                </div>
            </li>`;
        });
        result += '</ul>';
    } else {
        result += `<div style="text-align: center; padding: 30px; color: #6e6e73; font-style: italic;">
            <i class="fas fa-search" style="font-size: 2em; margin-bottom: 16px; opacity: 0.5;"></i><br>
            Aucun indice trouvé pour ce crime.
        </div>`;
    }

    resultEl.innerHTML = result;
    slideDown(resultEl);
}