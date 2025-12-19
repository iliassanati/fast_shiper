export const formatShipmentDate = (
  date: string | Date | null | undefined
): string => {
  if (!date) return 'TBD';

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'TBD';

    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }); // "Jan 15, 2025"
  } catch {
    return 'TBD';
  }
};
