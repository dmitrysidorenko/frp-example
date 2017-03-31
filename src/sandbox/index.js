import isolate from '@cycle/isolate';
import {div, button, span} from '@cycle/dom';
// import dropRepeats from 'xstream/extra/dropRepeats';
import xs from 'xstream';
import delay from 'xstream/extra/delay';
import R from 'ramda';
import onionify from 'cycle-onionify';

const Counter = ({DOM, id$, data}) => {
    const inc$ = DOM.select('.up').events('click');
    const dec$ = DOM.select('.down').events('click');
    const counterValue$ = id$
        .map(id => data.select({tags: ['Counter'], id: R.equals(id)}))
        .flatten()
        .debug('val')
        .map(R.path(['props', 'value']));

    const value$ = xs.merge(inc$.mapTo(1), dec$.mapTo(-1)).fold(R.add, 0);
    const value2$ = value$.map(R.add(1));
    return {
        DOM: counterValue$
            .map(v => div({style: {border: '1px solid gray', 'border-radius': '4px', margin: '5px'}}, [
                    div([
                        span(`${v}`),
                        button('.up', '+'),
                        button('.down', '-'),
                    ])
                ])
            ),
        value$,
        data: id$.debug('id')
            .map(
                id => xs
                    .merge(
                        value$//, value2$
                    )
                    .map(value => ({
                        tags: ['Counter'],
                        id,
                        props: {
                            value
                        }
                    }))
            )
            .flatten()
            .debug('[Counter] data')
    }
};

export const App = ({DOM, data}) => {
    const c1Val$ = data
        .select({
            tags: ['Counter'],
            id: R.equals('c-1')
        })
        .map(R.path(['props', 'value']))
        .debug('c-1');

    const c2Val$ = data
        .select({
            tags: ['Counter'],
            id: R.equals('c-2')
        })
        .map(R.path(['props', 'value']))
        .debug('c-2');

    const sumVal$ = data
        .select({
            tags: ['Sum'],
            id: R.equals('s-1')
        })
        .map(R.path(['props', 'value']))
        .debug('s-1');

    const c1 = isolate(Counter)({DOM, id$: xs.of('c-1').map(delay(1000)), data});
    const c2 = isolate(Counter)({DOM, id$: xs.of('c-2').map(delay(1000)), data});
    const value$ = xs
        .combine(
            c1Val$,
            c2Val$
        )
        .map(([a, b]) => a + b);
    return {
        DOM: xs
            .combine(
                sumVal$,
                c1.DOM,
                c2.DOM
            )
            .map(([total, counter1El, counter2El]) => div([
                counter1El,
                counter2El,
                div(`${total}`)
            ])),
        data: xs.merge(
            c1.data,
            c2.data,
            value$.map(total => ({
                tags: ['Sum'],
                id: 's-1',
                props: {
                    value: total
                }
            }))
        )
    };
};

export default isolate(
    onionify(
        (sources) => {
            const appSinks = App({
                ...sources,
                data: {
                    select: ({tags, id}) => {
                        // console.debug('select', tags);
                        return sources.onion.state$
                            .debug('data state')
                            .filter(R.pipe(R.intersection(tags)), R.length, R.equals(R.length(tags)))
                            .filter(R.pipe(R.prop('id'), id));
                    }
                }
            });
            return {
                ...appSinks,
                onion: appSinks.data.map(R.always)
            };
        }
    ),
    'app'
);