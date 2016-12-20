import xs from 'xstream';
import React from 'react';
import R from 'ramda';
import User from '../User';
import Validator from '../Validator';
import Search from '../Search';

const BaseComponent = (sources) => {
    const {Interact} = sources;
    const user = User({...sources, signIn$: xs.empty()});
    const text$ = Interact.get('text').map(R.path(['target', 'value'])).startWith('');
    const validator = Validator({
        Interact: Interact.isolate(),
        config$: xs.of([true, true]),
        validators$: xs.of([
            {label: 'Required', fn: v => !v ? 'Reuired field' : ''},
            {label: 'Number', fn: v => /^\d+$/.test(v) ? '' : 'Should be a number'}
        ])
    });
    const filters$ = xs.of({
        'Category1': {
            label: 'First category'
        },
        'Category2': {
            label: 'Second category'
        },
        'Category3': {
            label: 'Third category'
        }
    });
    const selectedFilters$ = xs.of({'Category2': true});
    const search = Search({
        Interact,
        term$: xs.empty(),
        filters$,
        selectedFilters$
    });
    const {view$, msgsViewFn$} = validator;
    const searchView$ = xs.combine(
        search.searchTermView$,
        search.filtersView$,
        search.term$
    ).map(([
        searchTermView,
        filtersView
    ]) => (
        <div style={{border:'3px dotted #ddd', padding: 10, display: 'inline-flex', flexDirection: 'column'}}>
            {searchTermView}
            {filtersView}
        </div>
    ));

    return {
        DOM: xs
            .combine(
                user.userView$,
                user.signInView$,
                view$,
                msgsViewFn$,
                text$,
                searchView$,
                search.term$
            )
            .map(([
                UserView,
                signInView,
                view,
                Error,
                text,
                searchView,
                searchTerm
            ]) => (
                <div>
                    User
                    <hr/>
                    {searchView}
                    <div>Search term: {searchTerm}</div>
                    <div>
                        <input value={text} onChange={Interact.cb('text')} />
                    </div>
                    {view}
                    <Error text={text} />
                    <hr/>
                    <div>
                        <UserView />
                    </div>
                    {signInView}
                </div>
            )),
        HTTP: user.HTTP
    };
};

export default BaseComponent;
