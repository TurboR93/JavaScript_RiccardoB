/**
 * app.js
 * ---------------------------------------------------------------------------
 * Punto di ingresso: mette insieme i pezzi.
 *
 *   storage.js  →  persistenza      (localStorage)
 *   counter.js  →  logica           (stato + regole)
 *   ui.js       →  interfaccia      (creazione DOM + rendering)
 *   app.js      →  orchestrazione   (eventi, tastiera, tema, storico)
 *
 * Ogni interazione dell'utente chiama un metodo del counter; il counter
 * notifica i sottoscrittori; i sottoscrittori aggiornano UI e salvataggio.
 * Il flusso è sempre a senso unico, quindi non esistono stati "disallineati"
 * tra ciò che vede l'utente e ciò che è realmente memorizzato.
 */
(function (ns) {
  'use strict';

  var HISTORY_LIMIT = 5;

  var LABELS = {
    increment: 'Incremento',
    decrement: 'Decremento',
    reset: 'Azzerato',
    set: 'Impostato'
  };

  function init() {
    var root = document.getElementById('app');
    if (!root) return;

    /* --- 1. Stato salvato ------------------------------------------- */
    var saved = ns.storage.load() || {};

    /* --- 2. Logica --------------------------------------------------- */
    var counter = ns.createCounter({
      value: saved.value,
      step: saved.step,
      min: -999999,
      max: 999999
    });

    /* --- 3. Interfaccia ---------------------------------------------- */
    var ui = ns.ui.buildUI(root);
    var els = ui.elements;

    var history = [];

    /* --- 4. Tema ----------------------------------------------------- */
    var theme = saved.theme;
    if (theme !== 'light' && theme !== 'dark') {
      // Nessuna preferenza salvata: seguiamo quella del sistema operativo.
      theme = window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
    }

    function applyTheme(next) {
      theme = next;
      document.documentElement.dataset.theme = next;

      // L'icona mostra il tema verso cui si passerà al click.
      els.themeButton.textContent = '';
      els.themeButton.appendChild(
        ui.icon(next === 'dark' ? ui.icons.sun : ui.icons.moon)
      );
      els.themeButton.setAttribute(
        'aria-label',
        next === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'
      );
    }

    applyTheme(theme);

    /* --- 5. Persistenza ---------------------------------------------- */
    function persist() {
      var state = counter.getState();
      ns.storage.save({
        value: state.value,
        step: state.step,
        theme: theme
      });
    }

    if (!ns.storage.isAvailable) {
      els.storageNote.hidden = false;
    }

    /* --- 6. Storico -------------------------------------------------- */
    function pushHistory(state, action) {
      if (!action.changed) return;

      var sign = action.delta > 0 ? '+' : '';
      var label = action.type === 'reset'
        ? LABELS.reset
        : LABELS[action.type] + ' ' + sign + action.delta;

      history.unshift({
        kind: action.delta > 0 ? 'up' : 'down',
        label: label,
        value: state.value
      });

      if (history.length > HISTORY_LIMIT) {
        history.length = HISTORY_LIMIT;
      }

      ui.renderHistory(history);
    }

    /* --- 7. Il counter guida tutto il resto -------------------------- */
    counter.subscribe(function (state, action) {
      ui.render(state);

      if (action.changed) {
        ui.pulse(action.delta);
        pushHistory(state, action);
      }

      persist();
    });

    // Primo disegno con lo stato iniziale (eventualmente ripristinato).
    ui.render(counter.getState());
    ui.renderHistory(history);

    /* --- 8. Eventi --------------------------------------------------- */
    els.incrementButton.addEventListener('click', function () {
      counter.increment();
    });

    els.decrementButton.addEventListener('click', function () {
      counter.decrement();
    });

    els.resetButton.addEventListener('click', function () {
      counter.reset();
    });

    els.stepInput.addEventListener('change', function () {
      counter.setStep(els.stepInput.value);
    });

    els.themeButton.addEventListener('click', function () {
      applyTheme(theme === 'dark' ? 'light' : 'dark');
      persist();
    });

    /* --- 9. Scorciatoie da tastiera ---------------------------------- */
    document.addEventListener('keydown', function (event) {
      // Non intercettiamo i tasti mentre si scrive nel campo "Passo".
      var target = event.target;
      if (target && (target.tagName === 'INPUT' || target.isContentEditable)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      switch (event.key) {
        case 'ArrowUp':
        case '+':
        case '=':
          event.preventDefault();
          counter.increment();
          break;

        case 'ArrowDown':
        case '-':
        case '_':
          event.preventDefault();
          counter.decrement();
          break;

        case 'r':
        case 'R':
          event.preventDefault();
          counter.reset();
          break;

        default:
          break;
      }
    });
  }

  // `defer` garantisce che il DOM sia pronto, ma manteniamo il controllo
  // per sicurezza se lo script venisse spostato o incluso diversamente.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.CounterApp);
