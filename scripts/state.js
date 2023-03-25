console.log('initialReadyState', document.readyState, Date.now());
document.addEventListener('readystatechange', () => {
  console.log('readystatechange', document.readyState, Date.now());
});
