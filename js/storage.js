/**
 * storage.js
 * ---------------------------------------------------------------------------
 * Piccolo wrapper attorno a localStorage.
 *
 * Perché non usare localStorage direttamente?
 * Perché in alcuni contesti (navigazione privata, cookie di terze parti
 * bloccati, quota esaurita) l'accesso a localStorage lancia un'eccezione.
 * Incapsulandolo qui, l'applicazione continua a funzionare anche quando il
 * salvataggio non è disponibile: semplicemente non ricorda il valore.
 */
window.CounterApp = window.CounterApp || {};

(function (ns) {
  'use strict';

  var KEY = 'counter-app:state';

  /** Verifica una sola volta se localStorage è realmente utilizzabile. */
  var available = (function () {
    try {
      var probe = '__counter_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (err) {
      return false;
    }
  })();

  /**
   * Legge lo stato salvato.
   * @returns {object|null} lo stato persistito, oppure null se assente/corrotto
   */
  function load() {
    if (!available) return null;

    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;

      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : null;
    } catch (err) {
      // JSON non valido: meglio ripartire puliti che crashare.
      return null;
    }
  }

  /**
   * Salva lo stato.
   * @param {object} state
   * @returns {boolean} true se il salvataggio è andato a buon fine
   */
  function save(state) {
    if (!available) return false;

    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      return false;
    }
  }

  /** Cancella lo stato salvato. */
  function clear() {
    if (!available) return;

    try {
      window.localStorage.removeItem(KEY);
    } catch (err) {
      /* niente da fare */
    }
  }

  ns.storage = {
    isAvailable: available,
    load: load,
    save: save,
    clear: clear
  };
})(window.CounterApp);
