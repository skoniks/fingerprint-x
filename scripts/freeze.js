const freezeScripts = () => {
  console.log('freezing scripts');
  if (!document.documentElement.dataset.freeze) {
    document.documentElement.dataset.unfreeze = 'true';
    window.freezedScripts = [];
    const dispatch = (script, target) => {
      if (script.tagName !== 'SCRIPT') return;
      // if (script.innerHTML === '') return;
      window.freezedScripts.push({ script, target });
      script.remove();
    };
    const observer = new MutationObserver((ms) =>
      ms.forEach((m) => m.addedNodes.forEach((n) => dispatch(n, m.target))),
    );
    observer.observe(document, { childList: true, subtree: true });
    document.addEventListener('unfreeze', () => {
      observer.disconnect();
      window.freezedScripts.splice(0).forEach(({ script, target }) => {
        target.appendChild(script);
      });
    });
  }
};

chrome.runtime.onMessage.addListener(({ action }, sender) => {
  if (sender.id != chrome.runtime.id) return;
  document.dispatchEvent(new CustomEvent(action));
  document.documentElement.dataset.unfreeze = 'true';
  console.log('unfreezing scripts');
});

try {
  const preload = `(${freezeScripts.toString()})();`;
  document.documentElement.setAttribute('onreset', preload);
  document.documentElement.dispatchEvent(new CustomEvent('reset'));
  document.documentElement.removeAttribute('onreset');
} catch (error) {}
