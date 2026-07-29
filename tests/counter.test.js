/**
 * tests/counter.test.js
 * ---------------------------------------------------------------------------
 * Test della logica del contatore, senza dipendenze esterne e senza browser.
 *
 * È possibile eseguirli proprio perché `js/counter.js` non conosce il DOM:
 * basta fornire un oggetto `window` finto e il modulo si carica in Node.
 *
 *   node tests/counter.test.js
 */
'use strict';

var path = require('path');

// Il modulo si registra su `window`: in Node lo simuliamo.
global.window = {};
require(path.join(__dirname, '..', 'js', 'counter.js'));

var createCounter = global.window.CounterApp.createCounter;

var passed = 0;
var failed = 0;

function check(name, condition) {
  if (condition) {
    passed++;
    console.log('  ✓ ' + name);
  } else {
    failed++;
    console.log('  ✗ ' + name);
  }
}

console.log('\nComportamento di base');
var c = createCounter();
check('parte da 0', c.getState().value === 0);
c.increment();
check('increment porta a 1', c.getState().value === 1);
c.decrement();
c.decrement();
check('decrement porta a -1', c.getState().value === -1);
c.reset();
check('reset riporta a 0', c.getState().value === 0);
c.setValue(42);
check('setValue imposta il valore', c.getState().value === 42);

console.log('\nPasso personalizzato');
var s = createCounter({ step: 5 });
s.increment();
check('incrementa di 5', s.getState().value === 5);
s.setStep(3);
s.decrement();
check('cambio passo applicato', s.getState().value === 2);
s.setStep(0);
check('il passo non scende sotto 1', s.getState().step === 1);
s.setStep('non un numero');
check('passo non numerico ignorato', s.getState().step === 1);

console.log('\nLimiti');
var lim = createCounter({ value: 9, min: 0, max: 10, step: 5 });
lim.increment();
check('non supera il massimo', lim.getState().value === 10);
check('canIncrement diventa false al massimo', lim.getState().canIncrement === false);
lim.decrement();
lim.decrement();
lim.decrement();
check('non scende sotto il minimo', lim.getState().value === 0);
check('canDecrement diventa false al minimo', lim.getState().canDecrement === false);

console.log('\nRobustezza sugli input');
var bad = createCounter({ value: 'ciao', step: null });
check('valore non numerico ricade su 0', bad.getState().value === 0);
var inverted = createCounter({ min: 10, max: 0 });
check('min e max invertiti vengono corretti',
  inverted.getState().min === 0 && inverted.getState().max === 10);
var frozen = createCounter({ value: 3 });
var snapshot = frozen.getState();
snapshot.value = 999;
check('lo stato restituito è una copia, non è modificabile',
  frozen.getState().value === 3);

console.log('\nNotifiche ai sottoscrittori');
var events = [];
var pub = createCounter();
var unsubscribe = pub.subscribe(function (state, action) {
  events.push(action.type + ':' + state.value + ':' + action.changed);
});
pub.increment();
pub.reset();
check('i sottoscrittori ricevono stato e azione',
  events.join(' | ') === 'increment:1:true | reset:0:true');
unsubscribe();
pub.increment();
check('unsubscribe interrompe le notifiche', events.length === 2);

var blocked = createCounter({ value: 0, min: 0, max: 5 });
var lastAction = null;
blocked.subscribe(function (state, action) { lastAction = action; });
blocked.decrement();
check('al limite l\'azione è segnalata come "nessun cambiamento"',
  lastAction.changed === false && lastAction.delta === 0);

var clamped = createCounter({ value: 8, min: 0, max: 10, step: 5 });
var deltaSeen = null;
clamped.subscribe(function (state, action) { deltaSeen = action.delta; });
clamped.increment();
check('il delta riportato è quello realmente applicato', deltaSeen === 2);

console.log('\n' + passed + ' test superati, ' + failed + ' falliti\n');
process.exit(failed === 0 ? 0 : 1);
