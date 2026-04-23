// Interfaz de usuario
const UI = {
  // Referencias a elementos DOM
  elements: {},

  init() {
    this.elements = {
      dropStock: document.getElementById('dropZoneStock'),
      inputStock: document.getElementById('fileStock'),
      infoStock: document.getElementById('infoStock'),
      previewStock: document.getElementById('previewStock'),
      dropRemito: document.getElementById('dropZoneRemito'),
      inputRemito: document.getElementById('fileRemito'),
      infoRemito: document.getElementById('infoRemito'),
      previewRemito: document.getElementById('previewRemito'),
      loadingMsg: document.getElementById('loadingMessage'),
      loadingText: document.getElementById('loadingText'),
      mainContent: document.getElementById('mainContent'),
      noDataMsg: document.getElementById('noDataMessage'),
      kpiSection: document.getElementById('kpiSection'),
      kpiProductos: document.getElementById('kpiProductos'),
      kpiFamilias: document.getElementById('kpiFamilias'),
      kpiActivos: document.getElementById('kpiActivos'),
      kpiConsumoTotal: document.getElementById('kpiConsumoTotal'),
      centroSelector: document.getElementById('centroSelector'),
      familiaSelector: document.getElementById('familiaSelector'),
      productoSelector: document.getElementById('productoSelector'),
      activoSelector: document.getElementById('activoSelector'),
      toggleActivo: document.getElementById('toggleActivo'),
      mesesPrediccionSelector: document.getElementById('mesesPrediccionSelector'),
      verGraficoBtn: document.getElementById('verGraficoBtn'),
      tablaPrediccionBody: document.getElementById('tablaPrediccionBody'),
      sugerenciasCompra: document.getElementById('sugerenciasCompra'),
      sugerenciasBody: document.getElementById('sugerenciasBody'),
      exportarCsvBtn: document.getElementById('exportarCsvBtn'),
      exportarPdfBtn: document.getElementById('exportarPdfBtn'),
      themeToggle: document.getElementById('themeToggle'),
      themeIcon: document.getElementById('themeIcon'),
      toastContainer: document.getElementById('toastContainer'),
    };
    this._setupThemeToggle();
  },

  getMesesPrediccion() {
    return parseInt(this.elements.mesesPrediccionSelector?.value || '12');
  },

  showLoading(text) {
    this.elements.loadingText.textContent = text || Utils.t('loading');
    this.elements.loadingMsg.classList.remove('hidden');
  },

  hideLoading() {
    this.elements.loadingMsg.classList.add('hidden');
  },

  showMain() {
    this.elements.mainContent.classList.remove('hidden');
    this.elements.kpiSection.classList.remove('hidden');
  },

  hideMain() {
    this.elements.mainContent.classList.add('hidden');
    this.elements.kpiSection.classList.add('hidden');
  },

  showNoData() {
    this.elements.noDataMsg.classList.remove('hidden');
  },

  hideNoData() {
    this.elements.noDataMsg.classList.add('hidden');
  },

  updateKPIs() {
    this.elements.kpiProductos.textContent = Data.mapeoProducto.size;
    this.elements.kpiFamilias.textContent = Data.familiasSet.size;
    this.elements.kpiActivos.textContent = Data.activosSet.size;
    this.elements.kpiConsumoTotal.textContent = Utils.formatNumber(Data.getConsumoTotal());
  },

  habilitarRemito() {
    const dz = this.elements.dropRemito;
    dz.style.opacity = '1';
    dz.style.pointerEvents = 'auto';
    dz.classList.remove('opacity-50', 'pointer-events-none');
    this.elements.inputRemito.disabled = false;
    this.elements.infoRemito.innerHTML = '';
  },

  mostrarPreview(container, rows, maxRows = 5) {
    if (!rows || rows.length === 0) return;
    const slice = rows.slice(0, maxRows);
    let html = '<div class="preview-table mt-2"><table class="w-full text-xs text-slate-400 dark:text-slate-400"><thead><tr>';
    if (slice[0]) {
      for (let key of Object.keys(slice[0]).slice(0, 5)) {
        html += `<th class="px-2 py-1 text-left">${key}</th>`;
      }
    }
    html += '</tr></thead><tbody>';
    for (let row of slice) {
      html += '<tr>';
      for (let key of Object.keys(row).slice(0, 5)) {
        html += `<td class="px-2 py-1">${String(row[key] || '').substring(0, 40)}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
    container.classList.remove('hidden');
  },

  showToast(message, type = 'info') {
    const colors = {
      info: 'bg-blue-600',
      success: 'bg-emerald-600',
      warning: 'bg-amber-600',
      error: 'bg-red-600',
    };
    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    const toast = document.createElement('div');
    toast.className = `toast ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`;
    toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
    this.elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // ---------------- TABLA DE PREDICCIÓN (CON CULTIVOS) ----------------
  actualizarTablaPrediccion(prediccion, conteoPorMes) {
    const maxCantidad = Math.max(...prediccion.map(p => p.cantidad), 1);
    const tabla = this.elements.tablaPrediccionBody.closest('table');
    const theadRow = tabla.querySelector('thead tr');
    // Agregar columna "Cultivos" si no existe
    if (!theadRow.querySelector('.th-cultivos')) {
      theadRow.innerHTML += '<th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase th-cultivos">Cultivos</th>';
    }

    this.elements.tablaPrediccionBody.innerHTML = '';
    for (let p of prediccion) {
      const [a, mes] = p.mes.split('-');
      const mesNum = parseInt(mes, 10);
      const nombreMes = `${Utils.MESES_NOMBRES[mesNum - 1]} ${a}`;
      const años = conteoPorMes[mesNum] || 0;
      const ratio = maxCantidad > 0 ? p.cantidad / maxCantidad : 0;
      let colorClass = 'text-green-400';
      if (ratio > 0.66) colorClass = 'text-red-400';
      else if (ratio > 0.33) colorClass = 'text-amber-400';

      const confianzaPct = Math.min(años * 20, 100);
      let confianzaColor = 'bg-red-500';
      if (años >= 3) confianzaColor = 'bg-green-500';
      else if (años >= 2) confianzaColor = 'bg-amber-500';

      const cultivosHtml = Calendario.getCultivosMes(mesNum);

      const row = `
        <tr>
          <td class="px-6 py-3 text-sm text-gray-900 dark:text-slate-300">${nombreMes}</td>
          <td class="px-6 py-3 text-right font-mono ${colorClass}">${p.cantidad.toFixed(2)} lts/kg</td>
          <td class="px-6 py-3 text-right text-xs text-gray-600 dark:text-slate-400">
            <div class="flex items-center justify-end gap-2">
              <div class="confianza-bar w-16"><div class="confianza-bar-fill ${confianzaColor}" style="width:${confianzaPct}%"></div></div>
              <span>${años} año${años!==1?'s':''}</span>
            </div>
          </td>
          <td class="px-6 py-3 text-xs text-gray-900 dark:text-slate-300">${cultivosHtml}</td>
        </tr>`;
      this.elements.tablaPrediccionBody.insertAdjacentHTML('beforeend', row);
    }
  },

  // ---------------- SUGERENCIAS DE COMPRA (conjunto filtrado) ----------------
  actualizarSugerenciasCompra(prediccion, productosSeleccionados = []) {
    this.elements.sugerenciasBody.innerHTML = '';
    // Stock disponible SOLO de los productos seleccionados
    let stockTotal = 0;
    for (let prod of productosSeleccionados) {
      stockTotal += Data.stockDisponible.get(prod) || 0;
    }
    if (stockTotal === 0) {
      this.elements.sugerenciasCompra.classList.add('hidden');
      return;
    }
    this.elements.sugerenciasCompra.classList.remove('hidden');
    let acumulado = stockTotal;
    for (let p of prediccion) {
      const [a, mes] = p.mes.split('-');
      const nombreMes = `${Utils.MESES_NOMBRES[parseInt(mes, 10) - 1]} ${a}`;
      acumulado -= p.cantidad;
      const diff = acumulado;
      let diffClass = 'text-green-400';
      if (diff < 0) diffClass = 'text-red-400';
      const row = `
        <tr>
          <td class="px-6 py-3 text-sm text-gray-900 dark:text-slate-300">${nombreMes}</td>
          <td class="px-6 py-3 text-right font-mono text-blue-300">${p.cantidad.toFixed(2)}</td>
          <td class="px-6 py-3 text-right font-mono text-gray-600 dark:text-slate-400">${stockTotal.toFixed(2)}</td>
          <td class="px-6 py-3 text-right font-mono ${diffClass}">${diff >= 0 ? '+' : ''}${diff.toFixed(2)}</td>
        </tr>`;
      this.elements.sugerenciasBody.insertAdjacentHTML('beforeend', row);
    }
  },

  // ---------------- CONSTRUIR SELECTORES INICIALES ----------------
  construirSelectoresIniciales() {
    const centros = [...Data.centrosSet].sort();
    this.elements.centroSelector.innerHTML = '<option value="">-- Todos --</option>';
    for (let c of centros) {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      this.elements.centroSelector.appendChild(opt);
    }

    const familias = [...Data.familiasSet].sort();
    this.elements.familiaSelector.innerHTML = '<option value="">-- Seleccione una familia --</option>';
    for (let f of familias) {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      this.elements.familiaSelector.appendChild(opt);
    }

    Data.productosPorFamilia.clear();
    for (let [prod, info] of Data.mapeoProducto) {
      const fam = info.familia;
      if (!Data.productosPorFamilia.has(fam)) Data.productosPorFamilia.set(fam, []);
      Data.productosPorFamilia.get(fam).push(prod);
    }

    this.elements.toggleActivo.checked = false;
    this.elements.activoSelector.innerHTML = '<option value="">-- Filtro de activo desactivado --</option>';
    this.elements.activoSelector.disabled = true;
    this.elements.productoSelector.innerHTML = '<option value="">-- Primero seleccione familia --</option>';
    this.elements.productoSelector.disabled = true;
  },

  // ---------------- ACTUALIZAR SELECTORES DEPENDIENTES ----------------
  actualizarSelectores() {
    const familia = this.elements.familiaSelector.value;
    const usarActivo = this.elements.toggleActivo.checked;
    const activoSeleccionado = this.elements.activoSelector.value;

    this.elements.activoSelector.innerHTML = '';
    if (!familia) {
      this.elements.activoSelector.innerHTML = '<option value="">-- Filtro de activo desactivado --</option>';
      this.elements.activoSelector.disabled = true;
    } else {
      const prodsFamilia = Data.productosPorFamilia.get(familia) || [];
      const activosEnFamilia = new Set();
      for (let prod of prodsFamilia) {
        const acts = Data.productoAActivos.get(prod);
        if (acts) acts.split(',').map(a => Utils.normalizar(a.trim())).forEach(a => activosEnFamilia.add(a));
      }
      if (usarActivo) {
        this.elements.activoSelector.innerHTML = '<option value="">-- Todos los activos de la familia --</option>';
        for (let act of [...activosEnFamilia].sort()) {
          const opt = document.createElement('option');
          opt.value = act;
          opt.textContent = act;
          if (act === activoSeleccionado) opt.selected = true;
          this.elements.activoSelector.appendChild(opt);
        }
        this.elements.activoSelector.disabled = false;
      } else {
        this.elements.activoSelector.innerHTML = '<option value="">-- Filtro de activo desactivado --</option>';
        this.elements.activoSelector.disabled = true;
      }
    }

    this.elements.productoSelector.innerHTML = '';
    if (!familia) {
      this.elements.productoSelector.innerHTML = '<option value="">-- Primero seleccione familia --</option>';
      this.elements.productoSelector.disabled = true;
      return;
    }
    const prodsFamilia = Data.productosPorFamilia.get(familia) || [];
    let productosFiltrados = prodsFamilia;
    if (usarActivo && activoSeleccionado) {
      const prodsDelActivo = Data.productosPorActivo.get(activoSeleccionado) || new Set();
      productosFiltrados = prodsFamilia.filter(p => prodsDelActivo.has(p));
    }
    this.elements.productoSelector.innerHTML = '<option value="">-- Ver todos los productos (gráfico agregado) --</option>';
    for (let prod of productosFiltrados.sort()) {
      const opt = document.createElement('option');
      opt.value = prod;
      opt.textContent = prod;
      this.elements.productoSelector.appendChild(opt);
    }
    this.elements.productoSelector.disabled = false;
  },

  // ---------------- TEMA CLARO / OSCURO ----------------
  _setupThemeToggle() {
    const applyTheme = (isLight) => {
      document.documentElement.classList.toggle('dark', !isLight);
      this.elements.themeIcon.textContent = isLight ? '🌙' : '☀️';
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    };

    this.elements.themeToggle.addEventListener('click', () => {
      const isLight = !document.documentElement.classList.contains('dark');
      applyTheme(isLight);
    });

    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      applyTheme(true);
    } else {
      applyTheme(false);
    }
  },

  // ---------------- PERSISTENCIA ----------------
  guardarEstado() {
    try {
      const estado = {
        stockFileName: Data.stockFileObj?.name,
        remitoFileName: Data.remitoFileObj?.name,
        timestamp: Date.now()
      };
      localStorage.setItem('forecast_estado', JSON.stringify(estado));
    } catch(e) {}
  },

  cargarEstado() {
    try {
      const raw = localStorage.getItem('forecast_estado');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return null;
  }
};

window.UI = UI;
