// Utilidades generales
const Utils = {
  normalizar(str) {
    return String(str).trim().toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  },

  parsearFecha(valor) {
    if (valor instanceof Date && !isNaN(valor)) return valor;
    if (typeof valor === 'number') return new Date((valor - 25569) * 86400 * 1000);
    if (typeof valor === 'string') {
      const str = valor.trim();
      const partes = str.split(/[-/]/);
      if (partes.length === 3) {
        let a, m, d;
        if (partes[0].length === 4) {
          a = parseInt(partes[0], 10);
          m = parseInt(partes[1], 10);
          d = parseInt(partes[2], 10);
        } else if (partes[2].length === 4) {
          d = parseInt(partes[0], 10);
          m = parseInt(partes[1], 10);
          a = parseInt(partes[2], 10);
        } else {
          return null;
        }
        if (a > 1900 && a < 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          return new Date(Date.UTC(a, m - 1, d));
        }
      }
      const time = Date.parse(str);
      if (!isNaN(time)) return new Date(time);
    }
    return null;
  },

  extraerFamilia(centroOperativo) {
    let texto = this.normalizar(centroOperativo);
    if (!texto.includes('AGROQUIMICOS')) return null;
    let partes = texto.split('\\');
    if (partes.length < 2) {
      if (texto.includes(' - ')) {
        partes = texto.split(' - ');
        if (partes.length >= 2 && partes[1].trim()) return partes[1].trim();
      }
      if (texto.includes('/')) {
        partes = texto.split('/');
        if (partes.length >= 2 && partes[1].trim()) return partes[1].trim();
      }
      return 'OTROS';
    }
    let familia = partes[1].trim();
    if (!familia) familia = 'OTROS';
    return familia;
  },

  formatNumber(n) {
    return Number(n).toFixed(2);
  },

  MESES_NOMBRES: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  MESES_CORTOS: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],

  // i18n
  i18n: {
    es: {
      loading: 'Procesando datos...',
      loadingStock: 'Leyendo stock...',
      loadingRemito: 'Procesando remitos...',
      loadingCalc: 'Calculando predicciones...',
      noData: 'No hay datos suficientes para mostrar',
      selectFamilia: 'Seleccione una familia primero',
      noProductsForActivo: (familia, activo) => `No hay productos en la familia ${familia} con el activo ${activo}`,
      noProductsInFamilia: (familia) => `No hay productos en la familia ${familia}`,
      csvExport: 'Mes,Cantidad estimada (lts/kg),Años con datos',
      alertNoData: 'No hay datos para exportar.',
    }
  },

  t(key, ...args) {
    let text = this.i18n.es[key] || key;
    if (typeof text === 'function') return text(...args);
    return text;
  }
};

window.Utils = Utils;