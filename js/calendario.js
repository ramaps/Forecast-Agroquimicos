// Calendario de siembra y cosecha de cultivos extensivos en Argentina
const Calendario = {
  // Para cada mes (1=Ene, 12=Dic), lista de cultivos con su etapa.
  data: {
    1:  [], // Enero
    2:  [], // Febrero
    3:  ['Soja 1ª (cosecha)', 'Maíz (cosecha)', 'Maíz tardío (cosecha)', 'Girasol (cosecha)'],
    4:  ['Soja 1ª (cosecha)', 'Soja 2ª (cosecha)', 'Maíz (cosecha)', 'Maíz tardío (cosecha)', 'Girasol (cosecha)', 'Algodón (cosecha)'],
    5:  ['Soja 1ª (cosecha)', 'Soja 2ª (cosecha)', 'Maíz (cosecha)', 'Maíz tardío (cosecha)', 'Girasol (cosecha)', 'Trigo (siembra)', 'Sorgo (cosecha)', 'Algodón (cosecha)'],
    6:  ['Soja 1ª (cosecha)', 'Soja 2ª (cosecha)', 'Maíz tardío (cosecha)', 'Trigo (siembra)', 'Algodón (cosecha)'],
    7:  ['Soja 2ª (cosecha)', 'Maíz tardío (cosecha)', 'Trigo (siembra)', 'Algodón (cosecha)'],
    8:  ['Algodón (cosecha)'],
    9:  ['Soja 1ª (siembra)', 'Maíz (siembra)', 'Girasol (siembra)', 'Sorgo (siembra)'],
    10: ['Soja 1ª (siembra)', 'Maíz (siembra)', 'Girasol (siembra)', 'Sorgo (siembra)', 'Algodón (siembra)'],
    11: ['Soja 1ª (siembra)', 'Soja 2ª (siembra)', 'Maíz tardío (siembra)', 'Girasol (siembra)', 'Sorgo (siembra)', 'Trigo (cosecha)', 'Algodón (siembra)'],
    12: ['Soja 2ª (siembra)', 'Maíz tardío (siembra)', 'Girasol (siembra)', 'Trigo (cosecha)', 'Algodón (siembra)'],
  },

  // Devuelve un string abreviado para mostrar en la tabla, con tooltip
  getCultivosMes(mesNum) {
    const lista = this.data[mesNum] || [];
    if (lista.length === 0) return '<span class="text-slate-500">—</span>';
    // Mostrar solo el primer cultivo y un "+N más" si hay varios
    const primero = lista[0];
    const resto = lista.length - 1;
    let html = `<span title="${lista.join(', ')}" class="cursor-help border-b border-dotted border-slate-500">${primero}</span>`;
    if (resto > 0) {
      html += ` <span class="text-xs text-slate-500">+${resto}</span>`;
    }
    return html;
  }
};

window.Calendario = Calendario;