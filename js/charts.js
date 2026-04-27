const Charts = {
  chartInstance: null,
  distribucionFamiliaChart: null,
  distribucionActivoChart: null,

actualizarGraficoPrincipal(series, titulo, subtitulo, productosSeleccionados = []) {
    const ctx = document.getElementById('consumoChart').getContext('2d');
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    if (!series) {
      document.getElementById('chartTitle').innerHTML = `<span class="w-1.5 h-5 bg-blue-500 rounded-full"></span> Sin datos suficientes`;
      document.getElementById('chartSubtitle').textContent = 'No se encontraron consumos para la selección actual.';
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      UI.actualizarTablaPrediccion([], []);
      return;
    }

    const { historico, prediccion, conteoPorMes } = series;
    const cobertura = Data.calcularCoberturaStock(productosSeleccionados);
    const stockTotal = cobertura.stockTotal;
    
    if (!prediccion || prediccion.length === 0) {
      document.getElementById('chartTitle').innerHTML = `<span class="w-1.5 h-5 bg-blue-500 rounded-full"></span> Sin predicción`;
      document.getElementById('chartSubtitle').textContent = 'No se pudo calcular la predicción.';
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      UI.actualizarTablaPrediccion([], []);
      return;
    }

    const todosMeses = [...historico.map(h => h.mes), ...prediccion.map(p => p.mes)].sort();
    const labels = todosMeses.map(m => {
      const [a, mes] = m.split('-');
      return `${Utils.MESES_CORTOS[parseInt(mes,10)-1]} ${a.slice(2)}`;
    });
    
    const datosReales = todosMeses.map(m => {
      const h = historico.find(hh => hh.mes === m);
      return h ? h.cantidad : null;
    });
    
    const datosEstimados = todosMeses.map(m => {
      const p = prediccion.find(pp => pp.mes === m);
      return p ? p.cantidad : null;
    });

    let mesQuiebre = null;
    let indexQuiebre = null;

    for (let i = 0; i < datosEstimados.length; i++) {
      if (datosEstimados[i] !== null && datosEstimados[i] > stockTotal) {
        mesQuiebre = labels[i];
        indexQuiebre = i;
        break;
      }
    }

    let dataQuiebre = new Array(labels.length).fill(null);
    if (indexQuiebre !== null) {
      dataQuiebre[indexQuiebre] = datosEstimados[indexQuiebre];
    }

    const zonaRiesgo = datosEstimados.map(v => {
      if (v !== null && v > stockTotal) return v;
      return null;
    });

    // Lógica de Semáforo
    let colorCirculo = '';
    let mensajeEstado = '';
    let hexColor = '';

    if (stockTotal <= 0) {
      colorCirculo = 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]';
      mensajeEstado = 'Peligro: Sin stock disponible';
      hexColor = '#ef4444';
    } else if (mesQuiebre) {
      colorCirculo = 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.6)]';
      mensajeEstado = 'Precaución: Quiebre próximo';
      hexColor = '#eab308';
    } else {
      colorCirculo = 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]';
      mensajeEstado = 'Stock en niveles óptimos';
      hexColor = '#22c55e';
    }

    const stockFormateado = new Intl.NumberFormat('es-AR').format(stockTotal);

    // Inyección de Título
    document.getElementById('chartTitle').innerHTML = `
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-5 bg-blue-500 rounded-full"></span>
        <span>${titulo}</span>
      </div>`;

    // Inyección de Subtítulo (Ajustado con separaciones solicitadas)
    document.getElementById('chartSubtitle').innerHTML = `
      <div class="flex flex-col gap-3 mt-4">
        <div class="flex items-center">
          <div class="w-3.5 h-3.5 rounded-full ${colorCirculo} mr-3 ${stockTotal <= 0 || mesQuiebre ? 'animate-pulse' : ''}"></div>
          <div class="flex flex-col">
            <span class="text-white font-bold text-lg leading-none">
              ${stockFormateado} <span class="text-sm font-normal text-zinc-500">L / Kg</span>
            </span>
            <span class="text-[10px] uppercase tracking-widest font-bold mt-1" style="color: ${hexColor}">
              ${mensajeEstado}
            </span>
          </div>
        </div>
        
        <div class="flex items-center text-zinc-400 text-sm ml-6 border-l border-zinc-800 pl-4">
          <span>${subtitulo}</span>
          ${mesQuiebre ? `
            <span class="mx-3 text-zinc-700">|</span>
            <div class="flex items-center text-yellow-500/90 font-medium">
              <span class="material-symbols-outlined text-base mr-2">event_busy</span>
              <span>Cero stock en: ${mesQuiebre}</span>
            </div>
          ` : ''}
        </div>
      </div>`;

    // Configuración de Chart.js
    Chart.defaults.color = '#fff';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { 
            label: 'Consumo real', 
            data: datosReales, 
            borderColor: '#60a5fa', 
            borderWidth: 3, 
            pointBackgroundColor: '#60a5fa', 
            pointBorderColor: '#fff', 
            tension: 0.4, 
            fill: true,
            backgroundColor: 'rgba(96, 165, 250, 0.05)'
          },
          { 
            label: `Predicción`, 
            data: datosEstimados, 
            borderColor: '#fbbf24', 
            borderWidth: 3, 
            borderDash: [6,4], 
            pointBackgroundColor: '#fbbf24', 
            pointBorderColor: '#fff', 
            tension: 0.4, 
            fill: true,
            backgroundColor: 'rgba(251, 191, 36, 0.05)'
          },
          {
            label: 'Zona de riesgo',
            data: zonaRiesgo,
            backgroundColor: 'rgba(239,68,68,0.15)',
            borderWidth: 0,
            fill: true,
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: 'Stock disponible',
            data: labels.map(() => stockTotal),
            borderColor: '#ef4444',
            borderWidth: 2,
            borderDash: [6,6],
            pointRadius: 0,
            tension: 0
          },
          {
            label: 'Quiebre',
            data: dataQuiebre,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 7,
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#fff', usePointStyle: true } },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(10, 10, 10, 0.9)',
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw !== null ? ctx.raw.toFixed(2) : '-'}`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });

    UI.actualizarTablaPrediccion(prediccion, conteoPorMes);
  },

  actualizarGraficosDistribucion() {
    this._actualizarDistribucionFamilia();
    this._actualizarDistribucionActivo();
  },

  _actualizarDistribucionFamilia() {
    const ctx = document.getElementById('distribucionFamiliaChart').getContext('2d');
    if (this.distribucionFamiliaChart) this.distribucionFamiliaChart.destroy();
    const consumoPorFamilia = new Map();
    for (let [prod, regs] of Data.consumosPorProducto) {
      const info = Data.mapeoProducto.get(prod);
      if (!info) continue;
      const fam = info.familia;
      let total = 0;
      for (let r of regs) total += r.cantidad;
      consumoPorFamilia.set(fam, (consumoPorFamilia.get(fam) || 0) + total);
    }
    if (consumoPorFamilia.size === 0) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); return; }
    const sorted = [...consumoPorFamilia.entries()].sort((a,b) => b[1] - a[1]);
    const labels = sorted.map(e => e[0]);
    const data = sorted.map(e => e[1]);

    this.distribucionFamiliaChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#f472b6','#38bdf8','#fb923c'], borderColor: 'rgba(0,0,0,0.3)' }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#fff', padding: 15 }
          }
        }
      }
    });
  },

  _actualizarDistribucionActivo() {
    const ctx = document.getElementById('distribucionActivoChart').getContext('2d');
    if (this.distribucionActivoChart) this.distribucionActivoChart.destroy();
    const consumoPorActivo = new Map();
    for (let [activo, prods] of Data.productosPorActivo) {
      let total = 0;
      for (let prod of prods) {
        const regs = Data.consumosPorProducto.get(prod) || [];
        for (let r of regs) total += r.cantidad;
      }
      consumoPorActivo.set(activo, total);
    }
    if (consumoPorActivo.size === 0) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); return; }
    const sorted = [...consumoPorActivo.entries()].sort((a,b) => b[1] - a[1]).slice(0, 10);
    const labels = sorted.map(e => e[0]);
    const data = sorted.map(e => e[1]);

    this.distribucionActivoChart = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: 'Consumo (lts/kg)', data: data, backgroundColor: '#34d399', borderColor: 'rgba(0,0,0,0.3)' }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#888' }
          },
          y: {
            ticks: { color: '#888' }
          }
        }
      }
    });
  }
};

window.Charts = Charts;
