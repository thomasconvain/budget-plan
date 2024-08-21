export const formatDate = (timestamp) => {
  const date = timestamp.toDate(); // Convertir el Timestamp a Date
  let day = date.getUTCDate();
  let month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();

  if (day < 10) {
    day = '0' + day;
  }
  if (month < 10) {
    month = '0' + month;
  }

  return `${day}-${month}-${year}`;
};

export const formatDateToLargeString = (dateString) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', options).format(date);
};