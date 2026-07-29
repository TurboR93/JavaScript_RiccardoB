/**
 * counter.js
 * ---------------------------------------------------------------------------
 * La logica del contatore, completamente separata dall'interfaccia.
 *
 * Il modulo non conosce il DOM: espone una factory `createCounter` che
 * restituisce un oggetto con lo stato incapsulato in una closure (non è
 * modificabile dall'esterno se non tramite i metodi esposti) e un semplice
 * meccanismo di sottoscrizione in stile observer.
 *
 * Questa separazione rende la logica testabile in isolamento e permette di
 * cambiare completamente la UI senza toccare una riga di questo file.
 */
window.CounterApp = window.CounterApp || {};

(function (ns) {
  'use strict';

  var DEFAULTS = {
    value: 0,
    step: 1,
    min: -999999,
    max: 999999
  };

  /**
   * Riporta un numero dentro l'intervallo [min, max].
   */
  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  /**
   * Converte un valore qualsiasi in intero valido, con fallback.
   */
  function toInt(value, fallback) {
    var n = parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * Crea una nuova istanza di contatore.
   *
   * @param {object} [options]
   * @param {number} [options.value=0]  valore iniziale
   * @param {number} [options.step=1]   incremento/decremento per click
   * @param {number} [options.min]      valore minimo consentito
   * @param {number} [options.max]      valore massimo consentito
   */
  function createCounter(options) {
    var opts = options || {};

    var min = toInt(opts.min, DEFAULTS.min);
    var max = toInt(opts.max, DEFAULTS.max);

    // Difesa: se qualcuno passa min > max, li scambiamo invece di rompere.
    if (min > max) {
      var tmp = min;
      min = max;
      max = tmp;
    }

    var value = clamp(toInt(opts.value, DEFAULTS.value), min, max);
    var step = Math.max(1, toInt(opts.step, DEFAULTS.step));

    var listeners = [];

    /** Snapshot immutabile dello stato corrente. */
    function getState() {
      return {
        value: value,
        step: step,
        min: min,
        max: max,
        canIncrement: value < max,
        canDecrement: value > min
      };
    }

    /** Notifica tutti i sottoscrittori con lo stato e il dettaglio dell'azione. */
    function emit(action) {
      var state = getState();
      listeners.forEach(function (listener) {
        listener(state, action);
      });
    }

    /**
     * Applica una variazione al valore corrente.
     * @param {number} delta variazione richiesta (può essere negativa)
     * @param {string} type  etichetta dell'azione, usata dalla UI/storico
     */
    function applyDelta(delta, type) {
      var previous = value;
      value = clamp(value + delta, min, max);

      emit({
        type: type,
        previous: previous,
        // Delta reale: se abbiamo toccato un limite può essere < di quello richiesto.
        delta: value - previous,
        changed: value !== previous
      });

      return getState();
    }

    return {
      /** Incrementa di `step` (o di `amount`, se fornito). */
      increment: function (amount) {
        return applyDelta(toInt(amount, step), 'increment');
      },

      /** Decrementa di `step` (o di `amount`, se fornito). */
      decrement: function (amount) {
        return applyDelta(-toInt(amount, step), 'decrement');
      },

      /** Riporta il contatore a zero (o al limite più vicino a zero). */
      reset: function () {
        var previous = value;
        value = clamp(0, min, max);

        emit({
          type: 'reset',
          previous: previous,
          delta: value - previous,
          changed: value !== previous
        });

        return getState();
      },

      /** Cambia il passo di incremento/decremento (minimo 1). */
      setStep: function (nextStep) {
        var parsed = Math.max(1, toInt(nextStep, step));
        if (parsed === step) return getState();

        step = parsed;
        emit({ type: 'step', previous: null, delta: 0, changed: false });

        return getState();
      },

      /** Imposta direttamente un valore, sempre rispettando i limiti. */
      setValue: function (nextValue) {
        var previous = value;
        value = clamp(toInt(nextValue, value), min, max);

        emit({
          type: 'set',
          previous: previous,
          delta: value - previous,
          changed: value !== previous
        });

        return getState();
      },

      getState: getState,

      /**
       * Registra un listener chiamato a ogni cambio di stato.
       * @returns {function} funzione per annullare la sottoscrizione
       */
      subscribe: function (listener) {
        if (typeof listener !== 'function') return function () {};

        listeners.push(listener);

        return function unsubscribe() {
          listeners = listeners.filter(function (l) {
            return l !== listener;
          });
        };
      }
    };
  }

  ns.createCounter = createCounter;
})(window.CounterApp);
