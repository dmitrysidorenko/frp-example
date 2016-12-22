import {default as xs} from 'xstream';
import React from 'react';
import Cycle from '@cycle/xstream-run';
import {makeHTTPDriver} from '@cycle/http';
import makeHTTPMockDriver from './drivers/mock-http-driver';
import makeDomReactDriver from './drivers/react-dom-driver';
import Interact from './drivers/interact-driver';
import Base from './components/Base/index';
import {makeRouterDriver} from 'cyclic-router';
import {createHashHistory as createHistory} from 'history';
import switchPath from 'switch-path';

function app(sources) {
    const base = Base(sources);
    return {
        DOM: base.DOM,
        HTTP: base.HTTP,
        router: base.router
    };
}

Cycle.run(app, {
    Interact,
    DOM: makeDomReactDriver(document.getElementById('root')),
    HTTP_: makeHTTPDriver(),
    router: makeRouterDriver(createHistory(), switchPath),
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
    })
});
