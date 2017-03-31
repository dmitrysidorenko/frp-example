import Cycle from '@cycle/xstream-run';
import Interact from './drivers/interact-driver';
import makeDOMDriver from './drivers/react-dom-driver';
import Evo from './sandbox/evo';

const makeDrivers = () => ({
    DOM: makeDOMDriver(document.querySelector('#root')),
    Action: input$ => input$,
    Interact
});

Cycle.run(Evo, makeDrivers());
