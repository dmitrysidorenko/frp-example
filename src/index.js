import {default as xs} from 'xstream';
import Cycle from '@cycle/xstream-run';
import {makeHTTPDriver} from '@cycle/http';
import makeHTTPMockDriver from './drivers/mock-http-driver';
import makeDomReactDriver from './drivers/react-dom-driver';
import Interact from './drivers/interact-driver';
import Spreadsheet from './spreadsheet';
import {makeRouterDriver} from 'cyclic-router';
import {makeHashHistoryDriver} from '@cycle/history';
import switchPath from 'switch-path';

function app(sources) {
    const base = Spreadsheet({...sources, count$: xs.of(10), value$: xs.create(), rowsCount: 4, cellsCount: 4});
    return {
        DOM: base.DOM,
        // HTTP: base.HTTP,
        // router: base.router,
        // Action: base.Action.debug('Action')
    };
}

Cycle.run(app, {
    Interact,
    DOM: makeDomReactDriver(document.getElementById('root')),
    HTTP_: makeHTTPDriver(),
    router: makeRouterDriver(makeHashHistoryDriver(), switchPath),
    HTTP: makeHTTPMockDriver({
        'sign-in': xs.of(JSON.stringify({
            firstName: 'John',
            lastName: 'Doe',
            email: 'jd@mail.com',
            roles: ['pb', 'co', 'admin'],
            id: '1'
        })),
        'load-playlists': xs.of(JSON.stringify([
            {name: 'Pl 1', id: 1},
            {name: 'Pl 2', id: 2}
        ])),
        'sign-out': xs.of(JSON.stringify({})),
        'remove-user-role': xs.of(JSON.stringify({
            firstName: 'John',
            lastName: 'Doe',
            email: 'jd@mail.com',
            roles: ['pb', 'co'],
            id: '1'
        }))
    }),
    Action: input$ => input$
});
