import Cycle from '@cycle/xstream-run';
import { makeHTTPDriver } from '@cycle/http';
import Interact from './drivers/interact-driver';
import { makeRouterDriver } from 'cyclic-router';
import switchPath from 'switch-path';
import { createHashHistory as createHistory } from 'history';
import Sandbox from './sandbox';
import makeDOMDriver from './drivers/react-dom-driver';
import { recycler, recyclable } from './recycle';
import Evo from './sandbox/evo';

// function app(sources) {
//     const base = Spreadsheet({...sources, count$: xs.of(10), value$: xs.create(), rowsCount: 4, cellsCount: 4});
//     return {
//         DOM: base.DOM,
//         // HTTP: base.HTTP,
//         // router: base.router,
//         // Action: base.Action.debug('Action')
//     };
// }
// const app = Sandbox;
const app = Evo;

const makeDrivers = () => ({
    DOM: makeDOMDriver(document.querySelector('#root')),
    // HTTP: recyclable(makeHTTPDriver()),
    // router: makeRouterDriver(createHistory(), switchPath),
    Action: input$ => input$,
    Interact
});

Cycle.run(app, makeDrivers());
