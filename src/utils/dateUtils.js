export const toLocalISOString = (date) => {
  if (!date) return null;
  const pad = (num) => (num < 10 ? '0' : '') + num;
  return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds());
};

export const getAbsoluteInterval = (booking) => {
  const { bookingType, startDate, endDate, selectedDate, startTime, endTime, startMonth, endMonth } = booking;
  
  if (bookingType === 'HOUR') {
    if (!selectedDate) return null;
    const start = new Date(selectedDate);
    const [sH, sM] = (startTime || "00:00").split(':').map(Number);
    start.setHours(sH, sM, 0, 0);

    const end = new Date(selectedDate);
    const [eH, eM] = (endTime || "00:00").split(':').map(Number);
    end.setHours(eH, eM, 0, 0);
    
    return { start, end };
  }
  
  if (bookingType === 'DAY') {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  
  if (bookingType === 'MONTH') {
    if (!startMonth || !endMonth) return null;
    const start = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  
  return null;
};
