const UI = {
  elements: {},

weatherMap: {
    0:  { day: 'wi-day-sunny', night: 'wi-night-clear', desc: 'Despejado', class: 'text-yellow-400' },
    1:  { day: 'wi-day-sunny-overcast', night: 'wi-night-alt-cloudy', desc: 'Mayormente despejado', class: '' },
    2:  { day: 'wi-day-cloudy', night: 'wi-night-alt-cloudy', desc: 'Parcialmente nublado', class: 'cloudy' },
    3:  { day: 'wi-cloudy', night: 'wi-night-alt-cloudy', desc: 'Nublado', class: 'cloudy' },
    45: { day: 'wi-fog', night: 'wi-night-fog', desc: 'Niebla', class: 'cloudy' },
    48: { day: 'wi-fog', night: 'wi-night-fog', desc: 'Niebla', class: 'cloudy' },
    51: { day: 'wi-day-sprinkle', night: 'wi-night-alt-sprinkle', desc: 'Llovizna ligera', class: 'rainy' },
    53: { day: 'wi-day-showers', night: 'wi-night-alt-showers', desc: 'Llovizna', class: 'rainy' },
    55: { day: 'wi-day-rain', night: 'wi-night-alt-rain', desc: 'Llovizna intensa', class: 'rainy' },
    61: { day: 'wi-day-rain-mix', night: 'wi-night-alt-rain-mix', desc: 'Lluvia ligera', class: 'rainy' },
    63: { day: 'wi-day-rain', night: 'wi-night-alt-rain', desc: 'Lluvia', class: 'rainy' },
    65: { day: 'wi-day-rain-wind', night: 'wi-night-alt-rain-wind', desc: 'Lluvia intensa', class: 'rainy' },
    71: { day: 'wi-day-snow', night: 'wi-night-alt-snow', desc: 'Nieve ligera', class: '' },
    73: { day: 'wi-day-snow', night: 'wi-night-alt-snow', desc: 'Nieve', class: '' },
    75: { day: 'wi-day-snow-wind', night: 'wi-night-alt-snow-wind', desc: 'Nieve intensa', class: '' },
    80: { day: 'wi-day-showers', night: 'wi-night-alt-showers', desc: 'Chubascos', class: 'rainy' },
    95: { day: 'wi-day-thunderstorm', night: 'wi-night-alt-thunderstorm', desc: 'Tormenta', class: 'rainy' },
    96: { day: 'wi-day-hail', night: 'wi-night-alt-hail', desc: 'Tormenta con granizo', class: 'rainy' },
    99: { day: 'wi-day-storm-showers', night: 'wi-night-alt-storm-showers', desc: 'Tormenta intensa', class: 'rainy' },
  },

  init() {
    this.elements = {
      // carga de archivos
      dropStock: document.getElementById('dropZoneStock'),
      inputStock: document.getElementById('fileStock'),
      infoStock: document.getElementById('infoStock'),
      dropRemito: document.getElementById('dropZoneRemito'),
      inputRemito: document.getElementById('fileRemito'),
      infoRemito: document.getElementById('infoRemito'),
      loadingMsg: document.getElementById('loadingMessage'),
      loadingText: document.getElementById('loadingText'),
      uploadSection: document.getElementById('uploadSection'),
      noDataMsg: document.getElementById('noDataMessage'),

      // KPI
      kpiConsumoMes: document.getElementById('kpiConsumoMes'),
      kpiStockTotal: document.getElementById('kpiStockTotal'),
      kpiCoberturaMeses: document.getElementById('kpiCoberturaMeses'),
      kpiProductosRiesgo: document.getElementById('kpiProductosRiesgo'),

      // semáforo
      countOk: document.getElementById('countOk'),
      countWarning: document.getElementById('countWarning'),
      countCritical: document.getElementById('countCritical'),

      // productos críticos y acciones
      productosCriticosBody: document.getElementById('productosCriticosBody'),
      accionesRecomendadas: document.getElementById('accionesRecomendadas'),

      // paneles y navegación
      panelDashboard: document.getElementById('panelDashboard'),
      panelAnalisis: document.getElementById('panelAnalisis'),
      navDashboard: document.getElementById('navDashboard'),
      navAnalisis: document.getElementById('navAnalisis'),
      headerTitle: document.getElementById('headerTitle'),
      headerSubtitle: document.getElementById('headerSubtitle'),

      // filtros del panel de análisis
      centroSelector: document.getElementById('centroSelector'),
      familiaSelector: document.getElementById('familiaSelector'),
      productoSelector: document.getElementById('productoSelector'),
      activoSelector: document.getElementById('activoSelector'),
      toggleActivo: document.getElementById('toggleActivo'),
      mesesPrediccionSelector: document.getElementById('mesesPrediccionSelector'),
      verGraficoBtn: document.getElementById('verGraficoBtn'),
      tablaPrediccionBody: document.getElementById('tablaPrediccionBody'),
      chartTitle: document.getElementById('chartTitle'),

      // exportar
      exportarCsvBtn: document.getElementById('exportarCsvBtn'),
      exportarPdfBtn: document.getElementById('exportarPdfBtn'),

      // clima y reloj
      weatherWidget: document.getElementById('weatherWidget'),
      weatherIcon: document.getElementById('weatherIcon'),
      weatherTemp: document.getElementById('weatherTemp'),
      weatherDesc: document.getElementById('weatherDesc'),
      currentTime: document.getElementById('currentTime'),
      currentDate: document.getElementById('currentDate'),
      toastContainer: document.getElementById('toastContainer'),
    };

    // ---------- Navegación del sidebar (solo alterna clase 'active') ----------
    this.elements.navDashboard.addEventListener('click', () => {
      this.elements.panelDashboard.classList.remove('hidden');
      this.elements.panelAnalisis.classList.add('hidden');
      this.elements.navDashboard.classList.add('active');
      this.elements.navAnalisis.classList.remove('active');
      this.elements.headerTitle.textContent = 'Dashboard';
      this.elements.headerSubtitle.textContent = 'Resumen general del sistema';
    });

    this.elements.navAnalisis.addEventListener('click', () => {
      this.elements.panelDashboard.classList.add('hidden');
      this.elements.panelAnalisis.classList.remove('hidden');
      this.elements.navAnalisis.classList.add('active');
      this.elements.navDashboard.classList.remove('active');
      this.elements.headerTitle.textContent = 'Análisis Avanzado';
      this.elements.headerSubtitle.textContent = 'Predicciones, gráficos y exportación de datos';
    });
    
    // ---------- Reproductor de radio Aspen ----------
    (() => {
      const radioBtn = document.getElementById('radioBtn');
      const radioPlayer = document.getElementById('radioPlayer');
      const radioIcon = document.getElementById('radioIcon');
      const radioStatus = document.getElementById('radioStatus');
      let radioPlaying = false;

      if (!radioBtn || !radioPlayer || !radioIcon || !radioStatus) return;

     radioBtn.addEventListener('click', () => {
  if (!radioPlaying) {
    // REPARACIÓN AQUÍ: Forzar la carga del stream para que sea en vivo
    const currentSrc = radioPlayer.src;
    radioPlayer.src = ''; // Limpiamos
    radioPlayer.src = currentSrc; // Reasignamos para forzar el "en vivo"
    radioPlayer.load();

    radioPlayer.play().then(() => {
      // Icono de Pausa
      radioIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      radioStatus.textContent = '●';
      radioStatus.classList.remove('hidden');
    }).catch(() => {
      radioStatus.textContent = '⚠️';
      radioStatus.classList.remove('hidden');
      setTimeout(() => radioStatus.classList.add('hidden'), 2000);
    });
  } else {
    radioPlayer.pause();
    radioPlayer.src = radioPlayer.src; 
    
    // Icono de Play
    radioIcon.innerHTML = '<path d="M5 3l14 9-14 9V3z"/>';
    radioStatus.classList.add('hidden');
  }
  radioPlaying = !radioPlaying;
});
    })();

    // ---------- Menú móvil (hamburguesa) ----------
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (hamburger && sidebar && overlay) {
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
      });
      
      overlay.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
      });
      
      // Cerrar sidebar al seleccionar una opción
      document.querySelectorAll('#navDashboard, #navAnalisis').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.innerWidth < 768) {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
          }
        });
      });
    }

    // Reloj y clima
    this.startClock();
    this.fetchWeather();
    setInterval(() => this.startClock(), 1000);
    setInterval(() => this.fetchWeather(), 60000);
  },

  // -------------------- COMPONENTE SELECT CON BÚSQUEDA --------------------
  crearSelectBusqueda(contenedor, opciones, placeholder = 'Buscar...', onChange = null) {
    contenedor.innerHTML = '';
    contenedor.className = 'select-search relative';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.className = 'w-full p-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500/50';

    const lista = document.createElement('ul');
    lista.className = 'absolute z-20 mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-lg max-h-48 overflow-y-auto hidden text-sm';

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.value = '';
    contenedor.appendChild(hiddenInput);
    contenedor.appendChild(input);
    contenedor.appendChild(lista);

    let opcionesArray = opciones;
    let valorSeleccionado = '';

    const renderLista = (filtro = '') => {
      lista.innerHTML = '';
      const filtradas = opcionesArray.filter(opt =>
        opt.texto.toLowerCase().includes(filtro.toLowerCase())
      );
      if (filtradas.length === 0) {
        lista.innerHTML = '<li class="px-3 py-2 text-gray-500 text-xs">Sin resultados</li>';
        lista.classList.remove('hidden');
        return;
      }
      filtradas.forEach(opt => {
        const li = document.createElement('li');
        li.className = 'px-3 py-2 cursor-pointer hover:bg-white/10 text-white text-sm';
        li.textContent = opt.texto;
        li.addEventListener('click', () => {
          input.value = opt.texto;
          hiddenInput.value = opt.valor;
          valorSeleccionado = opt.valor;
          lista.classList.add('hidden');
          if (onChange) onChange(opt.valor);
          hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
        lista.appendChild(li);
      });
      lista.classList.remove('hidden');
    };

    input.addEventListener('focus', () => renderLista(input.value));
    input.addEventListener('input', () => renderLista(input.value));

    document.addEventListener('click', (e) => {
      if (!contenedor.contains(e.target)) lista.classList.add('hidden');
    });

    contenedor.setOpciones = (nuevasOpciones) => {
      opcionesArray = nuevasOpciones;
      input.value = '';
      hiddenInput.value = '';
      valorSeleccionado = '';
    };
    contenedor.setValue = (valor, texto) => {
      input.value = texto || '';
      hiddenInput.value = valor;
      valorSeleccionado = valor;
    };
    contenedor.getValue = () => hiddenInput.value;
    contenedor.getInput = () => input;
    contenedor.disable = () => { input.disabled = true; input.placeholder = 'Desactivado'; };
    contenedor.enable = () => { input.disabled = false; input.placeholder = placeholder; };
    contenedor.limpiar = () => { input.value = ''; hiddenInput.value = ''; valorSeleccionado = ''; };

    return contenedor;
  },

  // -------------------- RELOJ --------------------
  startClock() {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    const ss = String(ahora.getSeconds()).padStart(2, '0');
    this.elements.currentTime.textContent = `${hh}:${mm}:${ss}`;

    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    this.elements.currentDate.textContent = `${dias[ahora.getDay()]}, ${ahora.getDate()} de ${meses[ahora.getMonth()]} de ${ahora.getFullYear()}`;
  },

// -------------------- CLIMA --------------------
  async fetchWeather() {
    const lat = -28.8858842; 
    const lon = -62.2663477;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto&_ts=${Date.now()}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      const w = data.current_weather;
      const isDay = w.is_day === 1;
      const code = w.weathercode;

      // 1. Buscamos la configuración en nuestro mapa
      const info = this.weatherMap[code] || { day: 'wi-na', night: 'wi-na', desc: 'Desconocido', class: '' };

      // 2. Selección de icono y descripción
      const iconClass = isDay ? info.day : info.night;
      const desc = info.desc + (!isDay && code === 0 ? ' (noche)' : '');

      // 3. Actualización del DOM (Usamos 'wi' que es la librería correcta)
      this.elements.weatherIcon.innerHTML = `<i class="wi ${iconClass} text-xl"></i>`;
      this.elements.weatherTemp.textContent = `${Math.round(w.temperature)}°C`;
      this.elements.weatherDesc.textContent = desc;

      // 4. Gestión de clases visuales para el widget
      this.elements.weatherWidget.classList.remove('cloudy', 'rainy', 'night');
      
      if (!isDay) {
        this.elements.weatherWidget.classList.add('night');
      }
      
      if (info.class) {
        this.elements.weatherWidget.classList.add(info.class);
      }

      // 5. Color amarillo especial para el sol de día
      if (isDay && code === 0) {
        this.elements.weatherIcon.classList.add('text-yellow-400');
      } else {
        this.elements.weatherIcon.classList.remove('text-yellow-400');
      }

    } catch (err) {
      console.error("Fallo al actualizar clima:", err);
      this.elements.weatherIcon.innerHTML = `<i class="wi wi-na"></i>`;
      this.elements.weatherDesc.textContent = 'Sin conexión';
    }
  },

  // -------------------- MÉTODOS GENERALES --------------------
  getMesesPrediccion() {
    return parseInt(this.elements.mesesPrediccionSelector?.value || '12');
  },

showLoading(text) {
    this.elements.loadingText.textContent = text || 'Procesando...';
    this.elements.loadingMsg.classList.remove('hidden');
    this.elements.loadingMsg.classList.add('flex');
},

hideLoading() {
    this.elements.loadingMsg.classList.add('hidden');
    this.elements.loadingMsg.classList.remove('flex');
},

  showDashboard() {
    this.elements.panelDashboard.classList.remove('hidden');
  },

  hideDashboard() {
    this.elements.panelDashboard.classList.add('hidden');
    this.elements.panelAnalisis.classList.add('hidden');
  },

  showNoData() {
    this.elements.noDataMsg.classList.remove('hidden');
  },

  hideNoData() {
    this.elements.noDataMsg.classList.add('hidden');
  },

  habilitarRemito() {
    const dz = this.elements.dropRemito;
    
    // 1. Activamos la zona (opacidad y clics)
    dz.classList.remove('opacity-50', 'pointer-events-none');
    dz.style.opacity = '1';
    dz.style.pointerEvents = 'auto';

    // 2. Cambiamos el texto y su color a un verde suave
    const statusText = document.getElementById('statusRemitoText');
    if (statusText) {
      statusText.textContent = 'Habilitado'; // O "Listo para cargar"
      statusText.classList.remove('text-gray-600');
      statusText.classList.add('text-emerald-500/80'); // Verde suave no agresivo
    }

    // 3. Cambiamos el icono a naranja (o verde si prefieres que combine)
    const iconRemito = dz.querySelector('svg');
    if (iconRemito) {
      iconRemito.classList.remove('text-gray-500');
      iconRemito.classList.add('text-orange-400'); // Mantenemos tu color de identidad para remitos
    }

    // 4. Habilitamos el input real
    this.elements.inputRemito.disabled = false;
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

  // -------------------- DASHBOARD EJECUTIVO --------------------
  actualizarDashboardEjecutivo() {
    let consumoTotal = 0;
    const hoy = new Date();
    const unAñoAtras = new Date(hoy.getFullYear() - 1, hoy.getMonth(), 1);
    for (let [prod, regs] of Data.consumosPorProducto) {
      for (let r of regs) {
        if (r.fecha >= unAñoAtras) consumoTotal += r.cantidad;
      }
    }
    const consumoPromedioMensual = consumoTotal / 12;
    this.elements.kpiConsumoMes.textContent = Utils.formatNumber(consumoPromedioMensual) + ' L';
    this.elements.kpiConsumoMes.className = 'kpi-value text-white'; // neutro

    let stockTotal = 0;
    for (let [prod, stock] of Data.stockDisponible) {
      stockTotal += stock;
    }
    this.elements.kpiStockTotal.textContent = Utils.formatNumber(stockTotal) + ' L';
    this.elements.kpiStockTotal.className = 'kpi-value text-white'; // neutro

    const coberturaGlobal = consumoPromedioMensual > 0 ? stockTotal / consumoPromedioMensual : 999;
    this.elements.kpiCoberturaMeses.textContent = coberturaGlobal === 999 ? '∞' : coberturaGlobal.toFixed(1);
    this.elements.kpiCoberturaMeses.className = 'kpi-value';
    if (coberturaGlobal >= 3) {
      this.elements.kpiCoberturaMeses.classList.add('text-green-400');
    } else if (coberturaGlobal >= 1.5) {
      this.elements.kpiCoberturaMeses.classList.add('text-amber-400');
    } else if (coberturaGlobal < 999) {
      this.elements.kpiCoberturaMeses.classList.add('text-red-400');
    }

    let riesgoCount = 0;
    const productosCriticos = [];
    for (let [prod, stock] of Data.stockDisponible) {
      const regs = Data.consumosPorProducto.get(prod) || [];
      let consumoProd = 0;
      for (let r of regs) {
        if (r.fecha >= unAñoAtras) consumoProd += r.cantidad;
      }
      const consumoPromProd = consumoProd / 12;
      const coberturaProd = consumoPromProd > 0 ? stock / consumoPromProd : 999;
      if (coberturaProd < 1.5) {
        riesgoCount++;
        productosCriticos.push({ producto: prod, stock, cobertura: coberturaProd.toFixed(1), estado: coberturaProd < 0.5 ? 'Crítico' : 'Precaución' });
      }
    }
    this.elements.kpiProductosRiesgo.textContent = riesgoCount;
    this.elements.kpiProductosRiesgo.className = 'kpi-value text-red-400'; // siempre rojo

    let ok = 0, warning = 0, critical = 0;
    for (let [prod, stock] of Data.stockDisponible) {
      const regs = Data.consumosPorProducto.get(prod) || [];
      let consumoProd = 0;
      for (let r of regs) {
        if (r.fecha >= unAñoAtras) consumoProd += r.cantidad;
      }
      const consumoPromProd = consumoProd / 12;
      const coberturaProd = consumoPromProd > 0 ? stock / consumoPromProd : 999;
      if (coberturaProd >= 3) ok++;
      else if (coberturaProd >= 1.5) warning++;
      else critical++;
    }
    this.elements.countOk.textContent = ok;
    this.elements.countWarning.textContent = warning;
    this.elements.countCritical.textContent = critical;

    productosCriticos.sort((a, b) => a.cobertura - b.cobertura);
    const topCriticos = productosCriticos.slice(0, 10);
    this.elements.productosCriticosBody.innerHTML = '';
    for (let p of topCriticos) {
      const colorEstado = p.estado === 'Crítico' ? 'text-red-400' : 'text-amber-400';
      const row = `
        <tr>
          <td class="px-4 py-2 text-sm text-white">${p.producto}</td>
          <td class="px-4 py-2 text-right font-mono text-sm text-white">${Utils.formatNumber(p.stock)}</td>
          <td class="px-4 py-2 text-right font-mono text-sm ${colorEstado}">${p.cobertura} m.</td>
          <td class="px-4 py-2 text-right text-sm ${colorEstado}">${p.estado}</td>
        </tr>`;
      this.elements.productosCriticosBody.insertAdjacentHTML('beforeend', row);
    }

    this.elements.accionesRecomendadas.innerHTML = '';
    for (let p of topCriticos) {
      const regs = Data.consumosPorProducto.get(p.producto) || [];
      const prediccionProd = Data.predecirMensual(regs, 3);
      const consumo3Meses = prediccionProd.prediccion.reduce((sum, x) => sum + x.cantidad, 0);
      const margen = consumo3Meses * 0.2;
      const compraRecomendada = Math.max(0, (consumo3Meses + margen) - p.stock);
      if (compraRecomendada > 0) {
        const div = document.createElement('div');
        div.className = 'flex items-start gap-2 p-3 rounded-lg bg-red-900/20 border border-red-500/20';
        div.innerHTML = `<span class="text-red-400 text-xl">🛑</span><p class="text-sm text-white">Comprar <strong class="text-white">${compraRecomendada.toFixed(1)} L</strong> de <strong class="text-white">${p.producto}</strong></p>`;
        this.elements.accionesRecomendadas.appendChild(div);
      }
    }
    if (this.elements.accionesRecomendadas.children.length === 0) {
      this.elements.accionesRecomendadas.innerHTML = '<p class="text-sm text-green-400">✅ Stock adecuado para todos los productos críticos.</p>';
    }
  },

  // -------------------- SELECTORES CON BÚSQUEDA --------------------
  construirSelectoresIniciales() {
    const centros = [...Data.centrosSet].sort().map(c => ({ valor: c, texto: c }));
    this.crearSelectBusqueda(this.elements.centroSelector, [{ valor: '', texto: '-- Todos --' }, ...centros], 'Buscar centro...');

    const familias = [...Data.familiasSet].sort().map(f => ({ valor: f, texto: f }));
    this.crearSelectBusqueda(this.elements.familiaSelector, [{ valor: '', texto: '-- Seleccione --' }, ...familias], 'Buscar familia...', (valor) => {
      this.actualizarSelectores();
    });

    this.crearSelectBusqueda(this.elements.activoSelector, [{ valor: '', texto: '-- Desactivado --' }], 'Buscar activo...');
    this.elements.activoSelector.disable();

    this.crearSelectBusqueda(this.elements.productoSelector, [{ valor: '', texto: '-- Primero seleccione familia --' }], 'Buscar producto...');
    this.elements.productoSelector.disable();

    Data.productosPorFamilia.clear();
    for (let [prod, info] of Data.mapeoProducto) {
      const fam = info.familia;
      if (!Data.productosPorFamilia.has(fam)) Data.productosPorFamilia.set(fam, []);
      Data.productosPorFamilia.get(fam).push(prod);
    }

    this.elements.toggleActivo.checked = false;
  },

  actualizarSelectores() {
    const familia = this.elements.familiaSelector.getValue();
    const usarActivo = this.elements.toggleActivo.checked;
    const activoSeleccionado = this.elements.activoSelector.getValue();

    if (!familia) {
      this.elements.activoSelector.setOpciones([{ valor: '', texto: '-- Desactivado --' }]);
      this.elements.activoSelector.disable();
      this.elements.activoSelector.limpiar();
    } else {
      const prodsFamilia = Data.productosPorFamilia.get(familia) || [];
      const activosEnFamilia = new Set();
      for (let prod of prodsFamilia) {
        const acts = Data.productoAActivos.get(prod);
        if (acts) acts.split(',').map(a => Utils.normalizar(a.trim())).forEach(a => activosEnFamilia.add(a));
      }
      const opcionesActivo = [{ valor: '', texto: '-- Todos los activos --' }, ...[...activosEnFamilia].sort().map(a => ({ valor: a, texto: a }))];
      this.elements.activoSelector.setOpciones(opcionesActivo);
      if (usarActivo) {
        this.elements.activoSelector.enable();
        if (activoSeleccionado) {
          const opcion = opcionesActivo.find(o => o.valor === activoSeleccionado);
          if (opcion) this.elements.activoSelector.setValue(opcion.valor, opcion.texto);
        }
      } else {
        this.elements.activoSelector.disable();
        this.elements.activoSelector.limpiar();
      }
    }

    if (!familia) {
      this.elements.productoSelector.setOpciones([{ valor: '', texto: '-- Primero seleccione familia --' }]);
      this.elements.productoSelector.disable();
      this.elements.productoSelector.limpiar();
      return;
    }
    const prodsFamilia = Data.productosPorFamilia.get(familia) || [];
    let productosFiltrados = prodsFamilia;
    if (usarActivo && activoSeleccionado) {
      const prodsDelActivo = Data.productosPorActivo.get(activoSeleccionado) || new Set();
      productosFiltrados = prodsFamilia.filter(p => prodsDelActivo.has(p));
    }
    const opcionesProducto = [{ valor: '', texto: '-- Ver todos --' }, ...productosFiltrados.sort().map(p => ({ valor: p, texto: p }))];
    this.elements.productoSelector.setOpciones(opcionesProducto);
    this.elements.productoSelector.enable();
  },

  // -------------------- TABLA DE PREDICCIÓN --------------------
  actualizarTablaPrediccion(prediccion, conteoPorMes) {
    const tabla = this.elements.tablaPrediccionBody.closest('table');
    const theadRow = tabla.querySelector('thead tr');
    if (!theadRow.querySelector('.th-cultivos')) {
      theadRow.innerHTML += '<th class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase th-cultivos">Cultivos</th>';
    }

    this.elements.tablaPrediccionBody.innerHTML = '';

    if (!prediccion || prediccion.length === 0) {
      const colspan = theadRow.querySelectorAll('th').length || 4;
      this.elements.tablaPrediccionBody.innerHTML = `<tr><td colspan="${colspan}" class="px-4 py-4 text-center text-gray-500">Sin datos</td></tr>`;
      return;
    }

    const maxCantidad = Math.max(...prediccion.map(p => p.cantidad), 1);
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
          <td class="px-4 py-2 text-sm text-white">${nombreMes}</td>
          <td class="px-4 py-2 text-right font-mono ${colorClass}">${p.cantidad.toFixed(2)}</td>
          <td class="px-4 py-2 text-right text-xs text-gray-400">
            <div class="flex items-center justify-end gap-1">
              <div class="confianza-bar w-12"><div class="confianza-bar-fill ${confianzaColor}" style="width:${confianzaPct}%"></div></div>
              <span>${años} año${años!==1?'s':''}</span>
            </div>
          </td>
          <td class="px-4 py-2 text-xs text-gray-400">${cultivosHtml}</td>
        </tr>`;
      this.elements.tablaPrediccionBody.insertAdjacentHTML('beforeend', row);
    }
  },

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
  },

  // ===== NUEVO: Animación de carga debajo del remito =====
  // 
 mostrarCargaRemito() {
  const container = document.getElementById('loadingRemitoLocal');
  if (!container) return;
  
  container.innerHTML = '';
  container.className = 'flex flex-col items-center justify-center py-8 mb-6';
  container.classList.remove('hidden');

  const spinnerContainer = document.createElement('div');
  spinnerContainer.className = 'flex flex-col items-center gap-3';

  const spinner = document.createElement('div');
  spinner.className = 'w11-spinner-small';
  spinner.innerHTML = `
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  `;

  const textoProcesando = document.createElement('p');
  textoProcesando.className = 'text-xs text-gray-400 font-light tracking-wider uppercase';
  textoProcesando.textContent = 'Procesando...';

  const textoResultados = document.createElement('p');
  textoResultados.className = 'text-xs text-emerald-400 font-light tracking-wider uppercase hidden';
  textoResultados.textContent = 'Obteniendo resultados...';

  spinnerContainer.appendChild(spinner);
  spinnerContainer.appendChild(textoProcesando);
  spinnerContainer.appendChild(textoResultados);
  container.appendChild(spinnerContainer);

  this._remitoLoading = { container, textoProcesando, textoResultados, spinner };
  return this._remitoLoading;
},

mostrarResultadoRemito(mensaje = 'Remito procesado correctamente') {
  const container = document.getElementById('loadingRemitoLocal');
  if (!container || !this._remitoLoading) return;

  if (this._remitoLoading.textoProcesando) {
    this._remitoLoading.textoProcesando.classList.add('hidden');
  }
  if (this._remitoLoading.textoResultados) {
    this._remitoLoading.textoResultados.classList.remove('hidden');
    this._remitoLoading.textoResultados.textContent = mensaje;
  }

  setTimeout(() => {
    // Limpiar el contenedor central
    container.innerHTML = '';
    container.classList.add('hidden');
    
    // Mostrar mensaje final en infoRemito (debajo del bloque de Remito)
    const infoRemitoDiv = this.elements.infoRemito;
    if (infoRemitoDiv) {
      infoRemitoDiv.innerHTML = '';
      infoRemitoDiv.className = 'px-2 mt-2';
      const resumenFinal = document.createElement('div');
      resumenFinal.className = 'flex items-center gap-2';
      resumenFinal.innerHTML = `<span class="text-emerald-400 text-xs">✅</span><span class="text-[10px] text-emerald-400 font-medium">${mensaje}</span>`;
      infoRemitoDiv.appendChild(resumenFinal);
    }
    this._remitoLoading = null;
  }, 1500);
},

limpiarCargaRemito() {
  const infoRemitoDiv = this.elements.infoRemito;
  if (infoRemitoDiv) {
    infoRemitoDiv.innerHTML = '';
    infoRemitoDiv.className = 'px-2 mt-1 text-[10px] text-gray-500 truncate';
  }
  this._remitoLoading = null;
  }
};

window.UI = UI;