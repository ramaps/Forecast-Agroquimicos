// Manejo de datos: carga de archivos, estructuras, predicción
const Data = {
  mapeoProducto: new Map(),
  consumosPorProducto: new Map(),
  familiasSet: new Set(),
  productosPorFamilia: new Map(),
  productoAActivos: new Map(),
  activosSet: new Set(),
  productosPorActivo: new Map(),
  centrosSet: new Set(),
  stockFileObj: null,
  remitoFileObj: null,
  stockDisponible: new Map(), // producto -> cantidad en stock real (stock final)

  reset() {
    this.mapeoProducto.clear();
    this.consumosPorProducto.clear();
    this.familiasSet.clear();
    this.productosPorFamilia.clear();
    this.productoAActivos.clear();
    this.activosSet.clear();
    this.productosPorActivo.clear();
    this.centrosSet.clear();
    this.stockDisponible.clear();
  },

  async cargarStock(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (rows.length < 2) throw new Error('Archivo sin datos');
          const headers = rows[0].map(h => String(h).toLowerCase().trim());

          const idxProducto = headers.findIndex(h => h.includes('descarticulo'));
          const idxCentro = headers.findIndex(h => h.includes('desccentrooperativo'));

          // Buscar columnas de stock confiables (primero StockReal, después Existencia)
          const idxStockReal = headers.findIndex(h => h.includes('stockreal'));
          const idxExistencia = headers.findIndex(h => h.includes('existencia'));

          if (idxProducto === -1 || idxCentro === -1) {
            throw new Error('Columnas requeridas: DescArticulo, DescCentroOperativo');
          }

          const mapaTemp = new Map();
          const stockTemp = new Map();   // aquí juntaremos el stock final

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const productoRaw = row[idxProducto];
            const centroRaw = row[idxCentro];
            if (!productoRaw || !centroRaw) continue;

            const centroStr = Utils.normalizar(centroRaw);
            if (!centroStr.includes('AGROQUIMICOS')) continue;

            const familia = Utils.extraerFamilia(centroRaw);
            if (!familia) continue;

            const prodNorm = Utils.normalizar(productoRaw);

            // Almacenar info del producto (solo primera vez)
            if (!mapaTemp.has(prodNorm)) {
              const centroOriginal = String(centroRaw).trim();
              const partes = centroOriginal.split('\\');
              const centroNombre = partes[0]?.trim() || centroOriginal;
              mapaTemp.set(prodNorm, {
                centro: centroOriginal,
                centroNombre,
                familia,
                productoOriginal: String(productoRaw).trim()
              });
              Data.familiasSet.add(familia);
              Data.centrosSet.add(centroNombre);
            }

            // --- Captura de stock real ---
            // Prioridad: columna "StockReal" > columna "Existencia"
            if (idxStockReal >= 0) {
              const stockReal = parseFloat(row[idxStockReal]);
              if (!isNaN(stockReal)) {
                // El archivo de stock suele tener varias filas por producto;
                // el último valor positivo de StockReal representa el stock final.
                // Por eso, para cada producto guardamos el máximo valor positivo.
                const anterior = stockTemp.get(prodNorm) || 0;
                if (stockReal > 0 && stockReal > anterior) {
                  stockTemp.set(prodNorm, stockReal);
                } else if (stockReal <= 0 && anterior === 0) {
                  // si no teníamos nada, guardamos 0
                  stockTemp.set(prodNorm, 0);
                }
              }
            } else if (idxExistencia >= 0) {
              // Fallback a Existencia si no hay StockReal
              const existencia = parseFloat(row[idxExistencia]);
              if (!isNaN(existencia) && existencia > 0) {
                stockTemp.set(prodNorm, (stockTemp.get(prodNorm) || 0) + existencia);
              }
            }
          }

          // Después de procesar todas las filas, nos quedamos con el stock final
          Data.stockDisponible = stockTemp;

          resolve(mapaTemp);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer stock'));
      reader.readAsArrayBuffer(file);
    });
  },

  async cargarRemito(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (rows.length < 2) throw new Error('Archivo sin datos');
          const headers = rows[0].map(h => String(h).toLowerCase().trim());
          const idxProducto = headers.findIndex(h => h.includes('descarticulo'));
          const idxFecha = headers.findIndex(h => h.includes('fecha'));
          const idxCantidad = headers.findIndex(h => h.includes('cantidad'));
          if (idxProducto === -1 || idxFecha === -1 || idxCantidad === -1) {
            throw new Error('Columnas requeridas: DescArticulo, Fecha, Cantidad');
          }
          const consumos = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            const productoRaw = row[idxProducto];
            const fechaRaw = row[idxFecha];
            const cantidadRaw = row[idxCantidad];
            if (!productoRaw || !fechaRaw || cantidadRaw === undefined) continue;
            const fecha = Utils.parsearFecha(fechaRaw);
            if (!fecha) continue;
            let cantidad = parseFloat(cantidadRaw);
            if (isNaN(cantidad) || cantidad === 0) continue;
            cantidad = Math.abs(cantidad);
            consumos.push({
              productoNorm: Utils.normalizar(productoRaw),
              fecha: fecha,
              cantidad: cantidad
            });
          }
          resolve(consumos);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer remito'));
      reader.readAsArrayBuffer(file);
    });
  },

  predecirMensual(registros, mesesPrediccion = 12) {
    const historico = {};
    for (let r of registros) {
      const año = r.fecha.getFullYear();
      const mes = String(r.fecha.getMonth() + 1).padStart(2, '0');
      const clave = `${año}-${mes}`;
      historico[clave] = (historico[clave] || 0) + r.cantidad;
    }

    const tieneHistorialPorMes = new Array(13).fill(false);
    const sumaPorMes = new Array(13).fill(0);
    const conteoPorMes = new Array(13).fill(0);
    for (let [key, val] of Object.entries(historico)) {
      const mesNum = parseInt(key.split('-')[1], 10);
      sumaPorMes[mesNum] += val;
      conteoPorMes[mesNum] += 1;
      tieneHistorialPorMes[mesNum] = true;
    }
    const promedioPorMes = new Array(13).fill(0);
    for (let m = 1; m <= 12; m++) {
      if (conteoPorMes[m] > 0) promedioPorMes[m] = sumaPorMes[m] / conteoPorMes[m];
    }

    const hoy = new Date();
    let añoActual = hoy.getFullYear();
    let mesActual = hoy.getMonth() + 1;
    const prediccion = [];
    for (let i = 1; i <= mesesPrediccion; i++) {
      let mesPred = mesActual + i;
      let añoPred = añoActual;
      while (mesPred > 12) {
        mesPred -= 12;
        añoPred++;
      }
      const cantidadPred = tieneHistorialPorMes[mesPred] ? promedioPorMes[mesPred] : 0;
      const clave = `${añoPred}-${String(mesPred).padStart(2, '0')}`;
      prediccion.push({ mes: clave, cantidad: Math.round(cantidadPred * 100) / 100 });
    }

    const mesesHistoricos = Object.keys(historico).sort();
    const historicoArray = mesesHistoricos.map(m => ({ mes: m, cantidad: historico[m] }));
    return { historico: historicoArray, prediccion, conteoPorMes };
  },

  agregarConsumos(consumos, mapaProducto) {
    const mapa = new Map();
    const noEncontrados = new Set();
    for (let c of consumos) {
      if (!mapaProducto.has(c.productoNorm)) {
        noEncontrados.add(c.productoNorm);
        continue;
      }
      if (!mapa.has(c.productoNorm)) mapa.set(c.productoNorm, []);
      mapa.get(c.productoNorm).push({ fecha: c.fecha, cantidad: c.cantidad });
    }
    return { mapa, noEncontrados };
  },

  obtenerSeriesPorProductos(listaProductos) {
    let todosRegistros = [];
    for (let prod of listaProductos) {
      const regs = Data.consumosPorProducto.get(prod) || [];
      todosRegistros.push(...regs);
    }
    if (todosRegistros.length === 0) return null;
    return this.predecirMensual(todosRegistros, UI.getMesesPrediccion());
  },

  // Extracción de activos
  extraerActivosDeNombre(nombreOriginal) {
    const nombre = String(nombreOriginal).trim();
    const resultados = new Set();
    const regexParentesis = /\(([^)]+)\)/g;
    let match;
    while ((match = regexParentesis.exec(nombre)) !== null) {
      const contenido = match[1].trim();
      const matches = contenido.matchAll(/([A-Za-záéíóúñüÁÉÍÓÚÑÜ\s\-]+?)\s*(\d{1,3}\s*%)/g);
      for (const m of matches) {
        const posibleActivo = m[1].trim().toUpperCase();
        if (posibleActivo.length > 2 && !/^(X|DE|DEL|PARA|POR|AL|Y|E|O)$/i.test(posibleActivo)) {
          resultados.add(posibleActivo);
        }
      }
    }
    const fueraParentesis = nombre.replace(/\([^)]*\)/g, ' ');
    const matchesFuera = fueraParentesis.matchAll(/([A-Za-záéíóúñüÁÉÍÓÚÑÜ\s\-]+?)\s+(\d{1,3}\s*%)/g);
    for (const m of matchesFuera) {
      const posibleActivo = m[1].trim().toUpperCase();
      if (posibleActivo.length > 2 && !/^(X|DE|DEL|PARA|POR|AL|Y|E|O|BT|MON|IBC|AR)$/i.test(posibleActivo)) {
        resultados.add(posibleActivo);
      }
    }
    const palabrasClave = [
      'ATRAZINA', 'GLIFOSATO', 'IMIDACLOPRID', 'CLETODIM', 'PARAQUAT',
      'DICAMBA', 'FOMESAFEN', 'FLUMIOXAZIN', 'METRIBUZIN', 'TEBUCONAZOLE', 'PICLORAM',
      'ACETOCLOR', 'S-METOLACLOR', 'NICOSULFURON', 'CLORIMURON', 'METSULFURON',
      'IMAZETAPIR', 'IMAZAPIR', 'IMAZAPIC', 'SULFENTRAZONE', 'PENDIMETALIN',
      'PROPICONAZOLE', 'DIFENOCONAZOLE', 'EPOXICONAZOLE', 'PIRACLOSTROBIN',
      'AZOXISTROBIN', 'TRIFLOXISTROBIN', 'PROTIOCONAZOLE', 'FLUROXIPIR',
      'HALOXIFOP', 'QUIZALOFOP', 'CLODINAFOP', 'PINOXADEN', 'BIFENTRIN',
      'LAMBDA-CIALOTRINA', 'TIAMETOXAM', 'ACETAMIPRID', 'EMAMECTINA', 'LUFENURON',
      'NOVALURON', 'SPIROMESIFEN', 'ABAMECTINA', 'FLUBENDIAMIDE', 'CLORANTRANILIPROLE',
      'CIANTRANILIPROLE', 'DIURON', 'DIQUAT', 'GLUFOSINATO', 'MESOTRIONE', 'TEMBOTRIONE',
      'ISOXAFLUTOLE', 'FLUMETSULAM', 'PIROXASULFONE', 'SAFLUFENACIL', 'CARFENTRAZONE',
      'TIDIAZURON', 'PROPANIL', 'QUINCLORAC', 'BENTAZON', 'MCPA', '2,4-D', '2,4-DB',
      'DICLOSULAM', 'CLOMAZONE', 'AMICARBAZONE', 'DELTAMETRINA', 'CIPERMETRINA',
      'BETA-CIFLUTRINA', 'TRIFLUMURON', 'TIODICARB', 'FIPRONIL',
      'CLOROTALONIL', 'MANCOZEB', 'PROPINEB', 'FOSETIL', 'METALAXIL',
      'FLUDIOXONIL', 'SEDAXANE', 'PENFLUFEN', 'FLUXAPIROXAD', 'BOSCALID',
      'DIMETOMORF', 'CIMOXANIL', 'ZOXAMIDA', 'FLUAZINAM', 'OXICLORURO',
      'HIDROXIDO DE COBRE', 'SULFATO DE COBRE', 'AZUFRE',
    ];
    const nombreUpper = Utils.normalizar(nombre);
    for (const clave of palabrasClave) {
      if (nombreUpper.includes(clave)) resultados.add(clave);
    }
    const partesMas = nombre.split('+').map(s => s.trim());
    if (partesMas.length > 1) {
      for (const parte of partesMas) {
        const limpio = parte.replace(/\(.*?\)/g, '').replace(/[^A-Za-záéíóúñüÁÉÍÓÚÑÜ\s\-]/g, ' ').trim();
        if (limpio.length > 3 && !/^(X|DE|DEL|PARA|POR|AL|Y|E|O)$/i.test(limpio)) {
          resultados.add(limpio.toUpperCase());
        }
      }
    }
    if (resultados.size > 0) return Array.from(resultados).join(', ');
    return null;
  },

  asignarActivosAutomaticos() {
    Data.productoAActivos.clear();
    Data.activosSet.clear();
    Data.productosPorActivo.clear();
    for (let [prodNorm, info] of Data.mapeoProducto) {
      const nombre = info.productoOriginal || prodNorm;
      const activos = Data.extraerActivosDeNombre(nombre);
      if (activos) {
        Data.productoAActivos.set(prodNorm, activos);
        const lista = activos.split(',').map(a => a.trim()).filter(a => a);
        for (let act of lista) {
          const actNorm = Utils.normalizar(act);
          Data.activosSet.add(actNorm);
          if (!Data.productosPorActivo.has(actNorm)) Data.productosPorActivo.set(actNorm, new Set());
          Data.productosPorActivo.get(actNorm).add(prodNorm);
        }
      }
    }
  },

  // Obtener consumo total
  getConsumoTotal() {
    let total = 0;
    for (let regs of Data.consumosPorProducto.values()) {
      for (let r of regs) total += r.cantidad;
    }
    return total;
  }
};

window.Data = Data;
