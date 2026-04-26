// Calendario de siembra y cosecha actualizado - Región Pampeana / Santiago del Estero
const Calendario = {
  // Definición de ciclos por cultivo
  cultivos: [
    { nombre: 'Soja 1ª', siembra: [9], cosecha: [1] },
    { nombre: 'Soja 2ª', siembra: [12, 1], cosecha: [4, 5] },
    { nombre: 'Maíz 1ª', siembra: [8, 9], cosecha: [2] },
    { nombre: 'Maíz 2ª', siembra: [12, 1], cosecha: [7, 8] },
    { nombre: 'Girasol', siembra: [8, 9], cosecha: [1, 2] },
    { nombre: 'Trigo', siembra: [5, 6], cosecha: [10, 11] },
    { nombre: 'Sorgo', siembra: [10, 11], cosecha: [3, 4] },
    { nombre: 'Algodón', siembra: [11, 12], cosecha: [4, 5, 6, 7, 8] },
  ],

  // Genera la lista de eventos para un mes específico
  getEventosMes(mesNum) {
    const eventos = [];
    this.cultivos.forEach(c => {
      if (c.siembra.includes(mesNum)) {
        eventos.push({ nombre: c.nombre, tipo: 'Siembra', color: 'text-emerald-400' });
      }
      if (c.cosecha.includes(mesNum)) {
        eventos.push({ nombre: c.nombre, tipo: 'Cosecha', color: 'text-amber-400' });
      }
    });
    return eventos;
  },

  // Devuelve el HTML formateado para la tabla
  getCultivosMes(mesNum) {
    const eventos = this.getEventosMes(mesNum);
    if (eventos.length === 0) return '<span class="text-slate-500">—</span>';

    // Formateamos para que aparezca "Siembra de X" y debajo "Cosecha de Y"
    // Limitamos a 2 visibles para no romper el diseño de la tabla, el resto en tooltip
    const htmlVisible = eventos.slice(0, 2).map(e => 
      `<div class="leading-tight mb-1">
        <span class="font-bold ${e.color}">${e.tipo.charAt(0)}:</span> 
        <span class="text-white">${e.nombre}</span>
      </div>`
    ).join('');

    const todos = eventos.map(e => `${e.tipo} de ${e.nombre}`).join(', ');
    const extra = eventos.length > 2 ? `<div class="text-[10px] text-slate-500">+${eventos.length - 2} más</div>` : '';

    return `<div title="${todos}" class="cursor-help">${htmlVisible}${extra}</div>`;
  }
};

window.Calendario = Calendario;