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

    // Configuración de colores para tema oscuro SaaS
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
            pointBorderColor: '#000', 
            tension: 0.4, 
            pointRadius: 0, 
            pointHoverRadius: 6, 
            fill: true,
            backgroundColor: 'rgba(96, 165, 250, 0.05)'
          },
          { 
            label: `Predicción (${prediccion.length} meses)`, 
            data: datosEstimados, 
            borderColor: '#fbbf24', 
            borderWidth: 3, 
            borderDash: [6,4], 
            pointBackgroundColor: '#fbbf24', 
            pointBorderColor: '#000', 
            tension: 0.4, 
            pointRadius: 0, 
            pointHoverRadius: 6, 
            fill: true,
            backgroundColor: 'rgba(251, 191, 36, 0.05)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#fff'
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw !== null ? ctx.raw.toFixed(2) : '-'} lts/kg`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#888' },
            title: { display: true, text: 'Cantidad (lts/kg)', color: '#888' }
          },
          x: {
            ticks: { color: '#888' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });

    document.getElementById('chartTitle').innerHTML = `<span class="w-1.5 h-5 bg-blue-500 rounded-full"></span> ${titulo}`;
    document.getElementById('chartSubtitle').textContent = subtitulo;

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

    Chart.defaults.color = '#fff';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';

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

    Chart.defaults.color = '#fff';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';

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