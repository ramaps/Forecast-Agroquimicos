// Archivo principal - Inicialización y eventos
(function(){
  UI.init();

  // Eventos de carga de archivos
  UI.elements.dropStock.addEventListener('click', () => UI.elements.inputStock.click());
  UI.elements.inputStock.addEventListener('change', async (e) => {
    if (!UI.elements.inputStock.files.length) return;
    Data.stockFileObj = UI.elements.inputStock.files[0];
    Data.reset();
    UI.hideMain();
    UI.hideNoData();
    UI.elements.infoStock.innerHTML = 'Cargando stock...';
    try {
      const mapa = await Data.cargarStock(Data.stockFileObj);
      if (mapa.size === 0) throw new Error('No se encontraron productos agroquímicos.');
      Data.mapeoProducto = mapa;
      UI.elements.infoStock.innerHTML = `✅ Stock cargado: ${mapa.size} productos agroquímicos.`;
      UI.habilitarRemito();
      // Vista previa
      const previewData = [];
      let count = 0;
      for (let [prod, info] of Data.mapeoProducto) {
        if (count++ >= 5) break;
        previewData.push({ Producto: prod, Familia: info.familia, Centro: info.centroNombre });
      }
      UI.mostrarPreview(UI.elements.previewStock, previewData);
    } catch(err) {
      UI.elements.infoStock.innerHTML = `❌ Error: ${err.message}`;
      UI.showToast(err.message, 'error');
    }
  });
  UI.elements.dropStock.addEventListener('dragover', (e) => { e.preventDefault(); UI.elements.dropStock.classList.add('dragover'); });
  UI.elements.dropStock.addEventListener('dragleave', () => UI.elements.dropStock.classList.remove('dragover'));
  UI.elements.dropStock.addEventListener('drop', (e) => { e.preventDefault(); UI.elements.dropStock.classList.remove('dragover'); const file = e.dataTransfer.files[0]; if (file) { UI.elements.inputStock.files = e.dataTransfer.files; UI.elements.inputStock.dispatchEvent(new Event('change')); } });

  UI.elements.dropRemito.addEventListener('click', () => UI.elements.inputRemito.click());
  UI.elements.inputRemito.addEventListener('change', async (e) => {
    if (!UI.elements.inputRemito.files.length) return;
    if (!Data.mapeoProducto || Data.mapeoProducto.size === 0) {
      UI.elements.infoRemito.innerHTML = '⚠️ Primero cargue el archivo de stock.';
      return;
    }
    Data.remitoFileObj = UI.elements.inputRemito.files[0];
    await procesarTodo();
  });
  UI.elements.dropRemito.addEventListener('dragover', (e) => { e.preventDefault(); UI.elements.dropRemito.classList.add('dragover'); });
  UI.elements.dropRemito.addEventListener('dragleave', () => UI.elements.dropRemito.classList.remove('dragover'));
  UI.elements.dropRemito.addEventListener('drop', (e) => { e.preventDefault(); UI.elements.dropRemito.classList.remove('dragover'); const file = e.dataTransfer.files[0]; if (file) { UI.elements.inputRemito.files = e.dataTransfer.files; UI.elements.inputRemito.dispatchEvent(new Event('change')); } });

  // Selectores
  UI.elements.familiaSelector.addEventListener('change', UI.actualizarSelectores.bind(UI));
  UI.elements.toggleActivo.addEventListener('change', () => {
    UI.elements.activoSelector.value = '';
    UI.actualizarSelectores();
  });
  UI.elements.activoSelector.addEventListener('change', UI.actualizarSelectores.bind(UI));

  // Botón principal
  UI.elements.verGraficoBtn.addEventListener('click', () => {
    const familia = UI.elements.familiaSelector.value;
    if (!familia) {
      UI.showToast(Utils.t('selectFamilia'), 'warning');
      return;
    }
    const usarActivo = UI.elements.toggleActivo.checked;
    const activo = UI.elements.activoSelector.value;
    const producto = UI.elements.productoSelector.value;

    let productosSeleccionados;
    let titulo, subtitulo;

    if (producto) {
      productosSeleccionados = [producto];
      titulo = `Producto: ${producto}`;
      subtitulo = `Familia: ${familia} · Consumo histórico y predicción individual`;
    } else if (usarActivo && activo) {
      const prodsFamilia = Data.productosPorFamilia.get(familia) || [];
      const prodsDelActivo = Data.productosPorActivo.get(activo) || new Set();
      productosSeleccionados = prodsFamilia.filter(p => prodsDelActivo.has(p));
      if (productosSeleccionados.length === 0) {
        UI.showToast(Utils.t('noProductsForActivo', familia, activo), 'warning');
        return;
      }
      titulo = `Activo: ${activo} (en familia ${familia})`;
      subtitulo = `Consumo histórico y predicción aglutinada de ${productosSeleccionados.length} productos`;
    } else {
      productosSeleccionados = Data.productosPorFamilia.get(familia) || [];
      if (productosSeleccionados.length === 0) {
        UI.showToast(Utils.t('noProductsInFamilia', familia), 'warning');
        return;
      }
      titulo = `Familia: ${familia}`;
      subtitulo = `Consumo histórico y predicción agregada de todos sus productos`;
    }

    const series = Data.obtenerSeriesPorProductos(productosSeleccionados);
    // *** PASAR productosSeleccionados para que las sugerencias usen el mismo conjunto ***
    Charts.actualizarGraficoPrincipal(series, titulo, subtitulo, productosSeleccionados);
  });

  // Exportar CSV (ahora incluye Cultivos)
  UI.elements.exportarCsvBtn.addEventListener('click', () => {
    if (UI.elements.tablaPrediccionBody.rows.length === 0) {
      UI.showToast(Utils.t('alertNoData'), 'warning');
      return;
    }
    let csv = 'Mes,Cantidad estimada (lts/kg),Años con datos,Cultivos\n';
    const filas = UI.elements.tablaPrediccionBody.querySelectorAll('tr');
    filas.forEach(row => {
      const cols = row.querySelectorAll('td');
      const mes = cols[0].innerText;
      const cantidad = cols[1].innerText.replace(' lts/kg','');
      // La tercera columna (confianza) contiene un div con barra y un span al final con el texto
      const confianzaSpan = cols[2].querySelector('span:last-child');
      const confianza = confianzaSpan ? confianzaSpan.innerText.trim() : '';
      // Cuarta columna: cultivos (puede contener HTML con título en el span)
      const cultivosCell = cols[3];
      let cultivosText = '';
      if (cultivosCell) {
        const titleEl = cultivosCell.querySelector('[title]');
        if (titleEl) {
          cultivosText = titleEl.getAttribute('title'); // texto completo del tooltip
        } else {
          cultivosText = cultivosCell.innerText.replace(/\n/g,' ').trim();
        }
      }
      csv += `"${mes}",${cantidad},"${confianza}","${cultivosText}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prediccion_agroquimicos.csv';
    a.click();
    URL.revokeObjectURL(url);
    UI.showToast('CSV exportado correctamente', 'success');
  });

  // Exportar PDF (vía impresión)
  UI.elements.exportarPdfBtn.addEventListener('click', () => {
    window.print();
  });

  // Procesar todo
  async function procesarTodo() {
    UI.showLoading(Utils.t('loadingRemito'));
    UI.hideMain();
    UI.hideNoData();

    try {
      const consumosRaw = await Data.cargarRemito(Data.remitoFileObj);
      if (consumosRaw.length === 0) throw new Error('No se encontraron consumos en el remito.');
      
      const { mapa: mapaConsumos, noEncontrados } = Data.agregarConsumos(consumosRaw, Data.mapeoProducto);
      Data.consumosPorProducto = mapaConsumos;
      if (Data.consumosPorProducto.size === 0) throw new Error('Ningún consumo corresponde a productos agroquímicos.');
      
      let infoText = `✅ Remito cargado: ${consumosRaw.length} registros, ${Data.consumosPorProducto.size} productos con consumo.`;
      if (noEncontrados.size > 0) {
        infoText += ` ⚠️ ${noEncontrados.size} productos del remito no tienen correspondencia en el stock: ${[...noEncontrados].slice(0,5).join(', ')}${noEncontrados.size>5?'...':''}`;
      }
      UI.elements.infoRemito.innerHTML = infoText;

      const previewData = [];
      let count = 0;
      for (let [prod, regs] of Data.consumosPorProducto) {
        if (count++ >= 5) break;
        previewData.push({ Producto: prod, Registros: regs.length, Total: Utils.formatNumber(regs.reduce((s,r) => s + r.cantidad, 0)) });
      }
      UI.mostrarPreview(UI.elements.previewRemito, previewData);

      UI.showLoading(Utils.t('loadingCalc'));
      Data.asignarActivosAutomaticos();
      const conActivo = Data.productoAActivos.size;
      UI.elements.infoStock.innerHTML += ` · Activos inferidos: ${conActivo} de ${Data.mapeoProducto.size} productos.`;

      UI.construirSelectoresIniciales();
      UI.updateKPIs();
      UI.showMain();
      Charts.actualizarGraficosDistribucion();
      UI.guardarEstado();
      UI.showToast('Datos procesados correctamente', 'success');
    } catch (err) {
      console.error(err);
      UI.elements.infoRemito.innerHTML = `❌ Error: ${err.message}`;
      UI.showNoData();
      UI.showToast(err.message, 'error');
    } finally {
      UI.hideLoading();
    }
  }

  const estado = UI.cargarEstado();
  if (estado) {
    console.log('Estado anterior:', estado);
  }
})();
