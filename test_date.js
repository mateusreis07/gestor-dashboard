const formatDateToISO = (dateStr) => {
  if (!dateStr) return new Date().toISOString();

  if (dateStr.includes('-') && (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateStr))) return dateStr;

  try {
    const datePart = dateStr.split(' ')[0];
    const parts = datePart.includes('/') ? datePart.split('/') : datePart.split('-');

    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
    }
  } catch (e) {
    console.warn('Falha ao converter data:', dateStr);
  }

  return new Date().toISOString();
};

const inputs = [
  '09-01-2026 08:03',
  '09/01/2026',
  '2026-01-09',
  'Indefinido',
  '15-02-2026',
  '15/02/2026 10:00'
];

inputs.forEach(i => console.log(`"${i}" -> "${formatDateToISO(i)}"`));
