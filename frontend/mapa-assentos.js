// Planta visual do protótipo. O contrato aceita exatamente os IDs fixos de 1 a 120;
// os códigos e posições visuais desta lista correspondem a esses IDs.
(() => {
  const groups = [];
  let id = 0;

  function addGroup({ key, name, zone, side, rows, seatsPerRow, code }) {
    const group = { key, name, zone, side, rows: [] };
    for (const rowLabel of rows) {
      const seats = [];
      for (let place = 1; place <= seatsPerRow; place++) {
        id += 1;
        seats.push({
          id,
          code: code(rowLabel, place)
        });
      }
      group.rows.push({ label: rowLabel, seats });
    }
    groups.push(group);
  }

  addGroup({
    key: 'plateia', name: 'Plateia', zone: 'plateia', side: 'center',
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], seatsPerRow: 8,
    code: (row, place) => `${row}-${String(place).padStart(2, '0')}`
  });
  addGroup({
    key: 'frisas-esquerda', name: 'Frisas', zone: 'frisa', side: 'left',
    rows: ['1', '2', '3', '4', '5'], seatsPerRow: 2,
    code: (row, place) => `FL${row}-${String(place).padStart(2, '0')}`
  });
  addGroup({
    key: 'frisas-direita', name: 'Frisas', zone: 'frisa', side: 'right',
    rows: ['1', '2', '3', '4', '5'], seatsPerRow: 2,
    code: (row, place) => `FR${row}-${String(place).padStart(2, '0')}`
  });
  addGroup({
    key: 'camarotes-esquerda', name: 'Camarotes', zone: 'camarote', side: 'left',
    rows: ['1', '2'], seatsPerRow: 5,
    code: (row, place) => `CL${row}-${String(place).padStart(2, '0')}`
  });
  addGroup({
    key: 'camarotes-direita', name: 'Camarotes', zone: 'camarote', side: 'right',
    rows: ['1', '2'], seatsPerRow: 5,
    code: (row, place) => `CR${row}-${String(place).padStart(2, '0')}`
  });

  window.BILHETERIA_SEAT_MAP = { totalSeats: id, groups };
})();
