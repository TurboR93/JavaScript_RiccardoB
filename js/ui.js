/**
 * ui.js
 * ---------------------------------------------------------------------------
 * Costruzione dell'interfaccia tramite manipolazione del DOM.
 *
 * Nel documento HTML esiste soltanto <div id="app"></div>: ogni singolo
 * elemento visibile (titolo, display, pulsanti + / −, controlli, storico)
 * viene creato qui con `document.createElement` e inserito nell'albero.
 *
 * Il modulo non contiene logica di conteggio: si limita a disegnare lo stato
 * che riceve e a esporre i riferimenti agli elementi interattivi.
 */
window.CounterApp = window.CounterApp || {};

(function (ns) {
  'use strict';

  /**
   * Helper per creare un elemento in modo dichiarativo.
   *
   * @param {string} tag             nome del tag
   * @param {object} [props]         proprietà, attributi e dataset
   * @param {Array|string} [children] figli (nodi o stringhe)
   */
  function el(tag, props, children) {
    var node = document.createElement(tag);
    var options = props || {};

    Object.keys(options).forEach(function (key) {
      var value = options[key];

      if (key === 'class') {
        node.className = value;
      } else if (key === 'text') {
        node.textContent = value;
      } else if (key === 'dataset') {
        Object.keys(value).forEach(function (dataKey) {
          node.dataset[dataKey] = value[dataKey];
        });
      } else if (key in node && key !== 'list') {
        // Proprietà DOM native (id, type, value, disabled, ...)
        node[key] = value;
      } else {
        // Attributi (aria-*, role, min, max, ...)
        node.setAttribute(key, value);
      }
    });

    if (children != null) {
      var list = Array.isArray(children) ? children : [children];
      list.forEach(function (child) {
        if (child == null) return;
        node.appendChild(
          typeof child === 'string' ? document.createTextNode(child) : child
        );
      });
    }

    return node;
  }

  /** Icona SVG inline: evita dipendenze esterne e resta nitida a ogni scala. */
  function icon(path, label) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.classList.add('icon');

    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', path);
    svg.appendChild(p);

    if (label) svg.setAttribute('data-label', label);
    return svg;
  }

  var ICONS = {
    minus: 'M5 11h14v2H5z',
    plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
    reset: 'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z',
    sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM3.5 4.9l1.4-1.4 2.1 2.1-1.4 1.4zm13.5 13.5 1.4-1.4 2.1 2.1-1.4 1.4zm1.6-13.5 2.1-2.1 1.4 1.4-2.1 2.1zM4.9 20.5l-1.4-1.4 2.1-2.1 1.4 1.4z',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'
  };

  /**
   * Costruisce l'intera interfaccia dentro `root`.
   *
   * @param {HTMLElement} root
   * @returns {object} riferimenti agli elementi + funzioni di rendering
   */
  function buildUI(root) {
    /* ----------------------------------------------------------------- */
    /* Intestazione                                                       */
    /* ----------------------------------------------------------------- */
    var themeButton = el('button', {
      type: 'button',
      class: 'icon-button',
      id: 'theme-toggle',
      title: 'Cambia tema chiaro/scuro',
      'aria-label': 'Cambia tema chiaro/scuro'
    }, [icon(ICONS.moon)]);

    var header = el('header', { class: 'header' }, [
      el('div', { class: 'header__titles' }, [
        el('h1', { class: 'header__title', text: 'Counter' }),
        el('p', {
          class: 'header__subtitle',
          text: 'Un contatore in JavaScript puro, con interfaccia generata via DOM.'
        })
      ]),
      themeButton
    ]);

    /* ----------------------------------------------------------------- */
    /* Display del valore                                                 */
    /* ----------------------------------------------------------------- */
    var valueEl = el('output', {
      class: 'display__value',
      id: 'counter-value',
      text: '0'
    });

    // role="status" fa annunciare il nuovo valore dagli screen reader
    // senza interrompere l'utente.
    var display = el('div', {
      class: 'display',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    }, [
      el('span', { class: 'display__label', text: 'Valore attuale' }),
      valueEl,
      el('span', { class: 'display__hint', id: 'counter-hint', text: 'Passo: 1' })
    ]);

    /* ----------------------------------------------------------------- */
    /* Pulsanti principali  −  /  +                                       */
    /* ----------------------------------------------------------------- */
    var decrementButton = el('button', {
      type: 'button',
      class: 'btn btn--decrement',
      id: 'decrement',
      'aria-label': 'Diminuisci il contatore'
    }, [icon(ICONS.minus)]);

    var incrementButton = el('button', {
      type: 'button',
      class: 'btn btn--increment',
      id: 'increment',
      'aria-label': 'Aumenta il contatore'
    }, [icon(ICONS.plus)]);

    var controls = el('div', { class: 'controls' }, [
      decrementButton,
      incrementButton
    ]);

    /* ----------------------------------------------------------------- */
    /* Riga opzioni: passo + reset                                        */
    /* ----------------------------------------------------------------- */
    var stepInput = el('input', {
      type: 'number',
      class: 'field__input',
      id: 'step',
      min: '1',
      max: '1000',
      step: '1',
      value: '1',
      inputMode: 'numeric'
    });

    var stepField = el('div', { class: 'field' }, [
      el('label', { class: 'field__label', htmlFor: 'step', text: 'Passo' }),
      stepInput
    ]);

    var resetButton = el('button', {
      type: 'button',
      class: 'btn btn--ghost',
      id: 'reset',
      'aria-label': 'Azzera il contatore'
    }, [icon(ICONS.reset), el('span', { text: 'Azzera' })]);

    var options = el('div', { class: 'options' }, [stepField, resetButton]);

    /* ----------------------------------------------------------------- */
    /* Storico delle ultime operazioni                                    */
    /* ----------------------------------------------------------------- */
    var historyList = el('ul', { class: 'history__list', id: 'history-list' });

    var historyEmpty = el('p', {
      class: 'history__empty',
      id: 'history-empty',
      text: 'Nessuna operazione: usa i pulsanti + e − per iniziare.'
    });

    var history = el('section', { class: 'history', 'aria-label': 'Storico operazioni' }, [
      el('h2', { class: 'history__title', text: 'Ultime operazioni' }),
      historyList,
      historyEmpty
    ]);

    /* ----------------------------------------------------------------- */
    /* Card + footer                                                      */
    /* ----------------------------------------------------------------- */
    var card = el('main', { class: 'card' }, [display, controls, options, history]);

    var footer = el('footer', { class: 'footer' }, [
      el('p', { class: 'footer__hint' }, [
        'Scorciatoie: ',
        el('kbd', { text: '↑' }), ' / ', el('kbd', { text: '+' }),
        ' per aumentare, ',
        el('kbd', { text: '↓' }), ' / ', el('kbd', { text: '−' }),
        ' per diminuire, ',
        el('kbd', { text: 'R' }), ' per azzerare.'
      ]),
      el('p', { class: 'footer__credits' }, [
        'Progetto start2impact · ',
        el('a', {
          href: 'https://github.com/TurboR93/JavaScript_RiccardoB',
          target: '_blank',
          rel: 'noopener noreferrer',
          text: 'codice sorgente'
        })
      ])
    ]);

    var storageNote = el('p', {
      class: 'storage-note',
      id: 'storage-note',
      hidden: true,
      text: 'Salvataggio non disponibile: il valore non verrà ricordato.'
    });

    root.appendChild(header);
    root.appendChild(card);
    root.appendChild(storageNote);
    root.appendChild(footer);

    /* ----------------------------------------------------------------- */
    /* Rendering                                                          */
    /* ----------------------------------------------------------------- */

    /**
     * Aggiorna il display e lo stato dei pulsanti a partire dallo stato.
     * @param {object} state stato restituito dal counter
     */
    function render(state) {
      valueEl.textContent = String(state.value);

      // Colore del numero in base al segno.
      display.dataset.sign =
        state.value > 0 ? 'positive' : (state.value < 0 ? 'negative' : 'zero');

      // I pulsanti si disattivano quando si tocca un limite.
      incrementButton.disabled = !state.canIncrement;
      decrementButton.disabled = !state.canDecrement;

      var hint = 'Passo: ' + state.step;
      if (!state.canIncrement) hint += ' · massimo raggiunto';
      if (!state.canDecrement) hint += ' · minimo raggiunto';
      display.querySelector('#counter-hint').textContent = hint;

      if (String(state.step) !== stepInput.value) {
        stepInput.value = String(state.step);
      }
    }

    /** Riproduce una breve animazione sul numero. */
    function pulse(direction) {
      valueEl.classList.remove('is-up', 'is-down');
      // Forza il reflow così l'animazione riparte anche a click ravvicinati.
      void valueEl.offsetWidth;
      valueEl.classList.add(direction > 0 ? 'is-up' : 'is-down');
    }

    /**
     * Ridisegna lo storico.
     * @param {Array} entries elenco di voci { label, value, delta }
     */
    function renderHistory(entries) {
      historyList.textContent = '';
      historyEmpty.hidden = entries.length > 0;

      entries.forEach(function (entry) {
        var item = el('li', {
          class: 'history__item',
          dataset: { kind: entry.kind }
        }, [
          el('span', { class: 'history__badge', text: entry.label }),
          el('span', { class: 'history__value', text: '→ ' + entry.value })
        ]);

        historyList.appendChild(item);
      });
    }

    return {
      elements: {
        incrementButton: incrementButton,
        decrementButton: decrementButton,
        resetButton: resetButton,
        stepInput: stepInput,
        themeButton: themeButton,
        storageNote: storageNote,
        display: display
      },
      icons: ICONS,
      icon: icon,
      render: render,
      renderHistory: renderHistory,
      pulse: pulse
    };
  }

  ns.ui = { buildUI: buildUI, el: el };
})(window.CounterApp);
