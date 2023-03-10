console.log('initial readyState:' + document.readyState, Date.now());

document.addEventListener('readystatechange', () => {
  console.log('readyState:' + document.readyState, Date.now());
});
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded', Date.now());
});
