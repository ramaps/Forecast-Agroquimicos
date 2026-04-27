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

  // ==================== BOTÓN ACTUALIZAR GRÁFICO (CORREGIDO) ====================
  UI.elements.verGraficoBtn.addEventListener('click', () => {
    const producto = UI.elements.productoSelector.getValue();
    const familia = UI.elements.familiaSelector.getValue();
    const usarActivo = UI.elements.toggleActivo.checked;
    const activo = UI.elements.activoSelector.getValue();

    let productosSeleccionados = [];
    let titulo = '';

    // Caso 1: Hay un producto específico seleccionado
    if (producto) {
      productosSeleccionados = [producto];
      titulo = `Producto: ${producto}`;
    }
    // Caso 2: No hay producto, pero sí familia
    else if (familia) {
      if (usarActivo && activo) {
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
    }
    // Caso 3: No hay producto ni familia
    else {
      UI.showToast('Seleccione un producto o una familia para ver la predicción', 'warning');
      return;
    }

    const series = Data.obtenerSeriesPorProductos(productosSeleccionados);
    if (!series || series.prediccion.length === 0) {
      UI.showToast('No hay datos suficientes para predecir', 'error');
      return;
    }

    Charts.actualizarGraficoPrincipal(series, titulo, '', productosSeleccionados);
    UI.showToast('Predicción actualizada', 'success');
  });

  // ---------- EXPORTAR A EXCEL ----------
  if (UI.elements.exportarCsvBtn) {
    UI.elements.exportarCsvBtn.addEventListener('click', () => {
      if (UI.elements.tablaPrediccionBody.rows.length === 0) {
        UI.showToast('Sin datos para exportar', 'warning');
        return;
      }

      // Construir matriz de datos para Excel
      const filas = UI.elements.tablaPrediccionBody.querySelectorAll('tr');
      const datos = [];
      datos.push(['Mes', 'Cantidad estimada (lts/kg)', 'Años con datos', 'Cultivos']);

      filas.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length < 4) return;
        const mes = cols[0].innerText.trim();
        const cantidad = cols[1].innerText.replace(' lts/kg', '').trim();
        const confianzaSpan = cols[2]?.querySelector('span:last-child');
        const confianza = confianzaSpan ? confianzaSpan.innerText.trim() : '';
        let cultivos = '';
        const cultivosCell = cols[3];
        if (cultivosCell) {
          const titleEl = cultivosCell.querySelector('[title]');
          cultivos = titleEl ? titleEl.getAttribute('title') : cultivosCell.innerText.trim();
        }
        datos.push([mes, cantidad, confianza, cultivos]);
      });

      // Crear libro y hoja, luego descargar usando writeFile
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(datos);
      XLSX.utils.book_append_sheet(wb, ws, 'Predicción');
      XLSX.writeFile(wb, 'prediccion_agroquimicos.xlsx');
      UI.showToast('Excel exportado correctamente', 'success');
    });
  }

  // ---------- EXPORTAR A PDF OPTIMIZADO ----------
  if (UI.elements.exportarPdfBtn) {
    UI.elements.exportarPdfBtn.addEventListener('click', () => {
      // 1. Insertar estilos de impresión (una sola vez)
      const styleId = 'print-optimized-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #sidebar, #hamburgerBtn, #toastContainer, button, .btn,
            #dropZoneStock, #dropZoneRemito, #loadingMessage, .no-print {
              display: none !important;
            }
            .card, .kpi-card, .chart-container, table {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            thead {
              display: table-header-group;
            }
            .section {
              page-break-before: auto;
              page-break-after: auto;
            }
            .section:not(:first-of-type) {
              page-break-before: always;
            }
            .max-w-7xl {
              max-width: 100% !important;
              padding: 0 !important;
            }
            .canvas-img {
              max-width: 100% !important;
              height: auto !important;
            }
          }
        `;
        document.head.appendChild(style);
      }

      // 2. Reemplazar todos los <canvas> por imágenes (para que se impriman)
      const canvases = document.querySelectorAll('canvas');
      const replacements = []; // { parent, img, originalCanvas }

      canvases.forEach(canvas => {
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.className = canvas.className + ' canvas-img';
        img.style.width = canvas.style.width || canvas.width + 'px';
        img.style.height = canvas.style.height || canvas.height + 'px';
        img.alt = 'Gráfico';

        const parent = canvas.parentNode;
        parent.replaceChild(img, canvas);
        replacements.push({ parent, img, originalCanvas: canvas });
      });

      // 3. Imprimir
      window.print();

      // 4. Restaurar los canvas originales
      setTimeout(() => {
        replacements.forEach(({ parent, img, originalCanvas }) => {
          parent.replaceChild(originalCanvas, img);
        });
      }, 1000);
    });
  }

  // ==================== PROCESO PRINCIPAL CON ANIMACIÓN LOCAL ====================
  async function procesarTodo() {
    // 1. Mostrar animación local debajo de la carga del remito
    UI.mostrarCargaRemito();
    // Ocultar paneles anteriores
    UI.hideDashboard();
    UI.hideNoData();

    try {
      const consumosRaw = await Data.cargarRemito(Data.remitoFileObj);
      if (consumosRaw.length === 0) throw new Error('No se encontraron consumos en el remito.');
      
      const { mapa: mapaConsumos, noEncontrados } = Data.agregarConsumos(consumosRaw, Data.mapeoProducto);
      Data.consumosPorProducto = mapaConsumos;
      if (Data.consumosPorProducto.size === 0) throw new Error('Ningún consumo corresponde a productos agroquímicos.');
      
      let infoText = `Remito cargado: ${consumosRaw.length} registros, ${Data.consumosPorProducto.size} productos con consumo.`;
      if (noEncontrados.size > 0) {
        infoText += ` ⚠️ ${noEncontrados.size} productos del remito no están en stock.`;
      }

      // Seguimos procesando (no mostramos aún el resultado final, porque faltan pasos)
      Data.asignarActivosAutomaticos();
      const conActivo = Data.productoAActivos.size;
      UI.elements.infoStock.innerHTML += ` · Activos inferidos: ${conActivo} de ${Data.mapeoProducto.size}.`;

      UI.construirSelectoresIniciales();
      UI.actualizarDashboardEjecutivo();
      UI.showDashboard();
      Charts.actualizarGraficosDistribucion();

      if (UI.elements.navDashboard) {
        UI.elements.navDashboard.classList.add('active');
        UI.elements.navAnalisis.classList.remove('active');
      }

      UI.guardarEstado();

      // 2. Todo listo → transición a “Obteniendo resultados...” y luego mensaje final
      UI.mostrarResultadoRemito(infoText);

      UI.showToast('Datos procesados correctamente', 'success');
    } catch (err) {
      console.error(err);
      // Mostrar el error en el mismo lugar
      UI.mostrarResultadoRemito(`Error: ${err.message}`);
      UI.showNoData();
      UI.showToast(err.message, 'error');
    }
  }

  const estado = UI.cargarEstado();
  if (estado) {
    console.log('Estado anterior:', estado);
  }
})();
