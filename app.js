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
    
    // Validar que no sea la misma opción en MÁS y MENOS
    const otherType = type === 'mas' ? 'menos' : 'mas';
    if (responses[currentQuestion][otherType] === index) {
        alert('No puedes seleccionar la misma palabra como MÁS y MENOS');
        return;
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
    const data = window.reportData;
    const profile = PROFILES[data.primary];
    
    const coloresPerfil = {
        D: { bg: '#dc3545', light: '#ffcccc', text: '#a02830' },
        I: { bg: '#ffc107', light: '#ffffcc', text: '#cc9900' },
        S: { bg: '#28a745', light: '#ccffcc', text: '#1e7e34' },
        C: { bg: '#007bff', light: '#ccccff', text: '#0056b3' }
    };
    
    const color = coloresPerfil[data.primary];

    // Contenedor oculto en la página real (evita el espacio en blanco
    // y los cortes de contenido que pasaban al usar un string de documento completo)
    const container = document.createElement('div');
    container.id = 'pdf-render-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    container.style.background = '#ffffff';

    container.innerHTML = `
        <style>
            #pdf-render-container * { margin: 0; padding: 0; box-sizing: border-box; }
            #pdf-render-container { font-family: Arial, sans-serif; color: #333; line-height: 1.5; font-size: 11px; }
            #pdf-render-container .header { background: ${color.bg}; color: white; padding: 20px; text-align: center; }
            #pdf-render-container .header h1 { font-size: 24px; margin-bottom: 5px; }
            #pdf-render-container .header p { font-size: 10px; opacity: 0.9; }
            #pdf-render-container .content { padding: 15px; }
            #pdf-render-container .section { margin-bottom: 20px; page-break-inside: avoid; }
            #pdf-render-container .section-title { background: ${color.light}; border-left: 4px solid ${color.bg}; padding: 10px; font-weight: bold; font-size: 12px; margin-bottom: 10px; }
            #pdf-render-container .profile-name { font-size: 18px; font-weight: bold; color: ${color.bg}; margin: 10px 0; text-align: center; }
            #pdf-render-container .charts-row { display: flex; gap: 8px; margin: 15px 0; height: 75px; align-items: flex-start; justify-content: space-around; }
            #pdf-render-container .chart-col { display: flex; flex-direction: column; align-items: center; flex: 1; }
            #pdf-render-container .chart-bar { width: 100%; background: #f0f0f0; border-radius: 2px; display: flex; align-items: flex-end; justify-content: center; position: relative; }
            #pdf-render-container .chart-bar-fill { width: 100%; border-radius: 2px 2px 0 0; }
            #pdf-render-container .chart-value { font-size: 10px; font-weight: bold; color: ${color.bg}; margin-top: 8px; margin-bottom: 3px; }
            #pdf-render-container .chart-label { font-size: 9px; color: #666; text-transform: uppercase; }
            #pdf-render-container .two-col { display: flex; gap: 15px; }
            #pdf-render-container .col { flex: 1; font-size: 10px; }
            #pdf-render-container .col h4 { color: ${color.bg}; font-size: 11px; margin-bottom: 5px; font-weight: bold; }
            #pdf-render-container .traits { font-size: 10px; line-height: 1.4; }
            #pdf-render-container .trait { margin-bottom: 3px; }
            #pdf-render-container .trait::before { content: "✓ "; color: ${color.bg}; font-weight: bold; }
            #pdf-render-container table { width: 100%; border-collapse: collapse; font-size: 9px; margin: 10px 0; }
            #pdf-render-container th { background: ${color.bg}; border: 1px solid ${color.bg}; padding: 6px; text-align: left; font-weight: bold; color: white; }
            #pdf-render-container th:not(:first-child) { text-align: center; }
            #pdf-render-container td { border: 1px solid #ddd; padding: 6px; }
            #pdf-render-container td:nth-child(2), #pdf-render-container td:nth-child(3), #pdf-render-container td:nth-child(4) { text-align: center; }
            #pdf-render-container .footer { font-size: 9px; color: #999; text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd; }
            #pdf-render-container .page-break { page-break-before: always; }
        </style>

        <div class="header">
            <h1>Test DISC</h1>
            <p>Análisis de Perfil Comportamental</p>
        </div>

        <div class="content">
            <div class="profile-name">Perfil: ${profile.name}</div>

            <div class="section">
                <div class="section-title">Puntuaciones</div>
                <div class="charts-row">
                    <div class="chart-col">
                        <div class="chart-bar" style="height: 60px;">
                            <div class="chart-bar-fill" style="height: ${Math.max(5, ((data.differential.D + 28) / 56) * 100)}%; background: #dc3545;"></div>
                        </div>
                        <div class="chart-value">${data.differential.D}</div>
                        <div class="chart-label">D</div>
                    </div>
                    <div class="chart-col">
                        <div class="chart-bar" style="height: 60px;">
                            <div class="chart-bar-fill" style="height: ${Math.max(5, ((data.differential.I + 28) / 56) * 100)}%; background: #ffc107;"></div>
                        </div>
                        <div class="chart-value">${data.differential.I}</div>
                        <div class="chart-label">I</div>
                    </div>
                    <div class="chart-col">
                        <div class="chart-bar" style="height: 60px;">
                            <div class="chart-bar-fill" style="height: ${Math.max(5, ((data.differential.S + 28) / 56) * 100)}%; background: #28a745;"></div>
                        </div>
                        <div class="chart-value">${data.differential.S}</div>
                        <div class="chart-label">S</div>
                    </div>
                    <div class="chart-col">
                        <div class="chart-bar" style="height: 60px;">
                            <div class="chart-bar-fill" style="height: ${Math.max(5, ((data.differential.C + 28) / 56) * 100)}%; background: #007bff;"></div>
                        </div>
                        <div class="chart-value">${data.differential.C}</div>
                        <div class="chart-label">C</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Características</div>
                <div class="traits">
                    ${profile.traits.map(t => '<div class="trait">' + t + '</div>').join('')}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Análisis</div>
                <div class="two-col">
                    <div class="col">
                        <h4>Fortalezas</h4>
                        <p>${profile.strengths}</p>
                    </div>
                    <div class="col">
                        <h4>Áreas de Desarrollo</h4>
                        <p>${profile.needs}</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Detalles de Puntuación</div>
                <table>
                    <tr>
                        <th style="width: 40%; text-align: left;">Dimensión</th>
                        <th style="width: 20%;">Más</th>
                        <th style="width: 20%;">Menos</th>
                        <th style="width: 20%;">Diferencial</th>
                    </tr>
                    <tr>
                        <td style="text-align: left;">D - Dominancia</td>
                        <td>${data.scorePlus.D}</td>
                        <td>${data.scoreMinus.D}</td>
                        <td style="font-weight: bold; color: #dc3545;">${data.differential.D}</td>
                    </tr>
                    <tr>
                        <td style="text-align: left;">I - Influencia</td>
                        <td>${data.scorePlus.I}</td>
                        <td>${data.scoreMinus.I}</td>
                        <td style="font-weight: bold; color: #ffc107;">${data.differential.I}</td>
                    </tr>
                    <tr>
                        <td style="text-align: left;">S - Estabilidad</td>
                        <td>${data.scorePlus.S}</td>
                        <td>${data.scoreMinus.S}</td>
                        <td style="font-weight: bold; color: #28a745;">${data.differential.S}</td>
                    </tr>
                    <tr>
                        <td style="text-align: left;">C - Conciencia</td>
                        <td>${data.scorePlus.C}</td>
                        <td>${data.scoreMinus.C}</td>
                        <td style="font-weight: bold; color: #007bff;">${data.differential.C}</td>
                    </tr>
                </table>
            </div>

            <div class="section page-break">
                <div class="section-title">Sobre el Test DISC</div>
                <p style="margin-bottom: 10px; font-size: 10px;">
                    El Test DISC es un instrumento que analiza cuatro patrones de comportamiento principales.
                </p>
            </div>

            <div class="section">
                <div class="section-title" style="border-left-color: #dc3545; background: #ffcccc;">D - DOMINANCIA</div>
                <p style="font-size: 10px;"><strong style="color: #333;">Orientación:</strong> Lograr resultados y controlar situaciones. Decisivos, competitivos, directos.</p>
            </div>

            <div class="section">
                <div class="section-title" style="border-left-color: #ffc107; background: #ffffcc;">I - INFLUENCIA</div>
                <p style="font-size: 10px;"><strong style="color: #333;">Orientación:</strong> Relaciones interpersonales y comunicación. Sociables, optimistas, persuasivos.</p>
            </div>

            <div class="section">
                <div class="section-title" style="border-left-color: #28a745; background: #ccffcc;">S - ESTABILIDAD</div>
                <p style="font-size: 10px;"><strong style="color: #333;">Orientación:</strong> Estabilidad y cooperación. Pacientes, leales, confiables.</p>
            </div>

            <div class="section">
                <div class="section-title" style="border-left-color: #007bff; background: #ccccff;">C - CONCIENCIA</div>
                <p style="font-size: 10px;"><strong style="color: #333;">Orientación:</strong> Calidad, precisión y análisis. Analíticos, reflexivos, perfeccionistas.</p>
            </div>

            <div class="footer">
                <p>Informe generado automáticamente • Test DISC de 28 Preguntas</p>
                <p>Escala: -28 a +28 • Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    const opt = {
        margin: [8, 8, 8, 8],
        filename: 'Perfil_DISC.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true, windowWidth: container.scrollWidth },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4', compress: true },
        pagebreak: { mode: ['css', 'avoid-all'] }
    };

    html2pdf().set(opt).from(container).save().then(() => {
        document.body.removeChild(container);
    });
}

// Inicializar
loadConfig().then(() => {
    renderQuestion();
});
