(function(){
  UI.init();

  // Eventos de carga de archivos
  UI.elements.dropStock.addEventListener('click', () => UI.elements.inputStock.click());
  UI.elements.inputStock.addEventListener('change', async (e) => {
    if (!UI.elements.inputStock.files.length) return;
    Data.stockFileObj = UI.elements.inputStock.files[0];
    Data.reset();
    UI.hideDashboard();
    UI.hideNoData();
    UI.elements.infoStock.innerHTML = 'Cargando stock...';
    try {
      const mapa = await Data.cargarStock(Data.stockFileObj);
      if (mapa.size === 0) throw new Error('No se encontraron productos agroquímicos.');
      Data.mapeoProducto = mapa;
      UI.elements.infoStock.innerHTML = `✅ Stock cargado: ${mapa.size} productos.`;
      UI.habilitarRemito();
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

  // Toggle Activo
  UI.elements.toggleActivo.addEventListener('change', () => {
    UI.elements.activoSelector.limpiar();
    UI.actualizarSelectores();
  });

  // Selector de Activo (cuando cambia el valor oculto)
  UI.elements.activoSelector.addEventListener('change', () => {
    UI.actualizarSelectores();
  });

  // Botón Actualizar gráfico
  UI.elements.verGraficoBtn.addEventListener('click', () => {
    const familia = UI.elements.familiaSelector.getValue();
    if (!familia) {
      UI.showToast('Seleccione una familia y presione Actualizar para ver la predicción', 'warning');
      return;
    }
    const usarActivo = UI.elements.toggleActivo.checked;
    const activo = UI.elements.activoSelector.getValue();
    const producto = UI.elements.productoSelector.getValue();

    let productosSeleccionados;
    let titulo;

    if (producto) {
      productosSeleccionados = [producto];
      titulo = `Producto: ${producto}`;
    } else if (usarActivo && activo) {
      const prodsFamilia = Data.productosPorFamilia.get(familia) || [];
      const prodsDelActivo = Data.productosPorActivo.get(activo) || new Set();
      productosSeleccionados = prodsFamilia.filter(p => prodsDelActivo.has(p));
      if (productosSeleccionados.length === 0) {
        UI.showToast(`No hay productos en la familia ${familia} con el activo ${activo}`, 'warning');
        return;
      }
      titulo = `Activo: ${activo} (familia ${familia})`;
    } else {
      productosSeleccionados = Data.productosPorFamilia.get(familia) || [];
      if (productosSeleccionados.length === 0) {
        UI.showToast(`No hay productos en la familia ${familia}`, 'warning');
        return;
      }
      titulo = `Familia: ${familia}`;
    }

    const series = Data.obtenerSeriesPorProductos(productosSeleccionados);
    Charts.actualizarGraficoPrincipal(series, titulo, '', productosSeleccionados);
    UI.showToast('Predicción actualizada', 'success');
  });

  // Exportar CSV
  if (UI.elements.exportarCsvBtn) {
    UI.elements.exportarCsvBtn.addEventListener('click', () => {
      if (UI.elements.tablaPrediccionBody.rows.length === 0) {
        UI.showToast('Sin datos para exportar', 'warning');
        return;
      }
      let csv = 'Mes,Cantidad estimada (lts/kg),Años con datos,Cultivos\n';
      const filas = UI.elements.tablaPrediccionBody.querySelectorAll('tr');
      filas.forEach(row => {
        const cols = row.querySelectorAll('td');
        const mes = cols[0].innerText;
        const cantidad = cols[1].innerText.replace(' lts/kg','');
        const confianzaSpan = cols[2]?.querySelector('span:last-child');
        const confianza = confianzaSpan ? confianzaSpan.innerText.trim() : '';
        const cultivosCell = cols[3];
        let cultivosText = '';
        if (cultivosCell) {
          const titleEl = cultivosCell.querySelector('[title]');
          cultivosText = titleEl ? titleEl.getAttribute('title') : cultivosCell.innerText.trim();
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
  }

  // Exportar PDF (vía impresión)
  if (UI.elements.exportarPdfBtn) {
    UI.elements.exportarPdfBtn.addEventListener('click', () => {
      window.print();
    });
  }

  async function procesarTodo() {
    UI.showLoading('Procesando remitos...');
    UI.hideDashboard();
    UI.hideNoData();

    try {
      const consumosRaw = await Data.cargarRemito(Data.remitoFileObj);
      if (consumosRaw.length === 0) throw new Error('No se encontraron consumos en el remito.');
      
      const { mapa: mapaConsumos, noEncontrados } = Data.agregarConsumos(consumosRaw, Data.mapeoProducto);
      Data.consumosPorProducto = mapaConsumos;
      if (Data.consumosPorProducto.size === 0) throw new Error('Ningún consumo corresponde a productos agroquímicos.');
      
      let infoText = `✅ Remito cargado: ${consumosRaw.length} registros, ${Data.consumosPorProducto.size} productos con consumo.`;
      if (noEncontrados.size > 0) {
        infoText += ` ⚠️ ${noEncontrados.size} productos del remito no están en stock.`;
      }
      UI.elements.infoRemito.innerHTML = infoText;

      UI.showLoading('Calculando predicciones...');
      Data.asignarActivosAutomaticos();
      const conActivo = Data.productoAActivos.size;
      UI.elements.infoStock.innerHTML += ` · Activos inferidos: ${conActivo} de ${Data.mapeoProducto.size}.`;

      UI.construirSelectoresIniciales();
      UI.actualizarDashboardEjecutivo();
      UI.showDashboard();
      Charts.actualizarGraficosDistribucion();

      // Activar el botón Dashboard en el sidebar
      if (UI.elements.navDashboard) {
        UI.elements.navDashboard.classList.add('active');
        UI.elements.navAnalisis.classList.remove('active');
      }

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