let QUESTIONS = [];
let PROFILES = {};
let currentQuestion = 0;
let responses = {};

// Cargar configuración
async function loadConfig() {
    const response = await fetch('config.json');
    const config = await response.json();
    QUESTIONS = config.questions;
    PROFILES = config.profiles;
}

function renderQuestion() {
    const container = document.getElementById('root');
    const question = QUESTIONS[currentQuestion];
    const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
    const response = responses[currentQuestion] || {};

    container.innerHTML = `
        <div class="container">
            <h1>Test DISC</h1>
            <p class="subtitle">Análisis de Perfil Comportamental - 28 Preguntas</p>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>

            <div class="question-container">
                <div class="question-number">Pregunta ${currentQuestion + 1} de 28</div>
                <div class="question-title">Selecciona una palabra en MÁS y otra en MENOS</div>
                
                <div class="options-table">
                    <div class="table-header">
                        <div class="table-header-cell">Características</div>
                        <div class="table-header-cell">✓ Más</div>
                        <div class="table-header-cell">✗ Menos</div>
                    </div>
                    ${question.options.map((opt, idx) => `
                        <div class="table-row">
                            <div class="table-word">${opt}</div>
                            <div class="table-button-cell">
                                <div class="option-radio ${response.mas === idx ? 'selected' : ''}" 
                                     onclick="selectOption(${idx}, 'mas')"></div>
                            </div>
                            <div class="table-button-cell">
                                <div class="option-radio ${response.menos === idx ? 'selected' : ''}" 
                                     onclick="selectOption(${idx}, 'menos')"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="button-group">
                <button class="btn-secondary" onclick="previousQuestion()" ${currentQuestion === 0 ? 'disabled' : ''}>
                    ← Anterior
                </button>
                <button class="btn-primary" onclick="nextQuestion()" 
                        ${(!response.mas && response.mas !== 0) || (!response.menos && response.menos !== 0) ? 'disabled' : ''}>
                    ${currentQuestion === QUESTIONS.length - 1 ? 'Calcular Resultados' : 'Siguiente →'}
                </button>
            </div>
        </div>
    `;
}

function selectOption(index, type) {
    if (!responses[currentQuestion]) {
        responses[currentQuestion] = {};
    }
    responses[currentQuestion][type] = index;
    renderQuestion();
}

function nextQuestion() {
    if (currentQuestion < QUESTIONS.length - 1) {
        currentQuestion++;
        renderQuestion();
    } else {
        showResults();
    }
}

function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        renderQuestion();
    }
}

function showResults() {
    const scorePlus = { D: 0, I: 0, S: 0, C: 0 };
    const scoreMinus = { D: 0, I: 0, S: 0, C: 0 };

    Object.entries(responses).forEach(([idx, resp]) => {
        const question = QUESTIONS[idx];
        if (resp.mas !== undefined) {
            const typeMore = question.types[resp.mas];
            scorePlus[typeMore]++;
        }
        if (resp.menos !== undefined) {
            const typeLess = question.types[resp.menos];
            scoreMinus[typeLess]++;
        }
    });

    const differential = {
        D: scorePlus.D - scoreMinus.D,
        I: scorePlus.I - scoreMinus.I,
        S: scorePlus.S - scoreMinus.S,
        C: scorePlus.C - scoreMinus.C
    };

    const primary = Object.entries(differential).sort((a, b) => b[1] - a[1])[0][0];
    const desc = PROFILES[primary];

    const container = document.getElementById('root');
    container.innerHTML = `
        <div class="results-container">
            <div class="container">
                <h1>Tu Perfil DISC</h1>
                <p class="subtitle">Análisis de tu patrón comportamental</p>

                <div class="info-box">
                    Tu perfil primario es <strong>${desc.name}</strong>
                </div>

                <div class="profile-section">
                    <h2>Tu Perfil DISC</h2>
                    <div class="chart-container">
                        <canvas id="profileChart"></canvas>
                    </div>
                </div>

                <div class="profile-section">
                    <h2>Características del Perfil ${desc.name}</h2>
                    <div class="characteristics">
                        <div class="char-box">
                            <h3>Características</h3>
                            <ul>
                                ${desc.traits.map(t => `<li>${t}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="char-box">
                            <h3>Fortalezas</h3>
                            <p>${desc.strengths}</p>
                            <h3 style="margin-top: 16px;">Áreas de Desarrollo</h3>
                            <p>${desc.needs}</p>
                        </div>
                    </div>
                </div>

                <button class="btn-primary" style="width: 100%; margin-top: 20px; margin-bottom: 20px;" onclick="descargarPDF()">
                    📄 Descargar Informe (PDF)
                </button>
            </div>
        </div>
    `;

    window.reportData = { differential, primary, profileDesc: desc, scorePlus, scoreMinus };

    setTimeout(() => {
        crearGrafico('profileChart', differential);
    }, 100);
}

function crearGrafico(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['D', 'I', 'S', 'C'],
            datasets: [{
                label: 'Diferencial (Más - Menos)',
                data: [data.D, data.I, data.S, data.C],
                backgroundColor: [
                    data.D >= 0 ? 'rgba(220, 53, 69, 0.8)' : 'rgba(220, 53, 69, 0.3)',
                    data.I >= 0 ? 'rgba(255, 193, 7, 0.8)' : 'rgba(255, 193, 7, 0.3)',
                    data.S >= 0 ? 'rgba(40, 167, 69, 0.8)' : 'rgba(40, 167, 69, 0.3)',
                    data.C >= 0 ? 'rgba(0, 123, 255, 0.8)' : 'rgba(0, 123, 255, 0.3)'
                ],
                borderColor: ['#dc3545', '#ffc107', '#28a745', '#007bff'],
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: -28,
                    max: 28,
                    ticks: { stepSize: 7 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Dibujar números en las barras
    setTimeout(() => {
        const canvas = document.getElementById(canvasId);
        const rect = canvas.getBoundingClientRect();
        const chartInstance = Chart.instances.find(c => c.canvas.id === canvasId);
        
        if (chartInstance) {
            ['D', 'I', 'S', 'C'].forEach((trait, idx) => {
                const meta = chartInstance.getDatasetMeta(0);
                const bar = meta.data[idx];
                chartInstance.ctx.fillStyle = '#333';
                chartInstance.ctx.font = 'bold 14px Arial';
                chartInstance.ctx.textAlign = 'center';
                chartInstance.ctx.fillText(data[trait], bar.x, bar.y - 10);
            });
        }
    }, 300);
}

function descargarPDF() {
    const element = document.querySelector('.results-container');
    const opt = {
        margin: 10,
        filename: 'Perfil_DISC.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
}

// Inicializar
loadConfig().then(() => {
    renderQuestion();
});
