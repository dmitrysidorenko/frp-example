import xs from 'xstream';
import debounce from 'xstream/extra/debounce';
import dropRepeats from 'xstream/extra/dropRepeats';
import React from 'react';
import R from 'ramda';

const TermView = props => {
    const {onChange, onSearch} = props;
    return (
        <div>
            <input type="search" onChange={onChange} />
            <button onClick={onSearch}>Find</button>
        </div>
    );
};

const FiltersView = props => {
    const {filters = {}, selectedFilters = {}, onChange} = props;
    return (
        <ul>
            {R.keys(filters)
                .map((id, i) => {
                    return (
                        <li key={id} >
                            <label>
                                <input type="checkbox"
                                       name={id}
                                       value={id}
                                       checked={!!selectedFilters[id]}
                                       onChange={onChange} />
                                {filters[id].label}
                            </label>
                        </li>
                    );
                })}
        </ul>
    );
};

const getValue = R.path(['target', 'value']);

const model = (term$, termChange$, onFind$, filters$, startSelectedFilters$, filterChange$) => {
    const finalTerm$ = xs.merge(term$, termChange$)
        .startWith('');
    const findBy$ = finalTerm$
        .compose(debounce(300))
        .compose(dropRepeats())
        .map(term => onFind$.mapTo(term))
        .flatten();
    const selectedFilters$ = startSelectedFilters$
        .map(startSelectedFilters => filterChange$
            .fold((acc, change) => {
                return R.assoc(change.id, change.checked, acc);
            }, startSelectedFilters))
        .flatten();

    return xs
        .combine(finalTerm$, findBy$.startWith(null), filters$, selectedFilters$)
        .map(([term, findBy, filters, selectedFilters]) => ({term, findBy, filters, selectedFilters}))
        .remember();
};

export default (sources) => {
    const {Interact, term$, filters$, selectedFilters$: startSelectedFilters$} = sources;
    const termChange$ = Interact
        .get('term')
        .map(getValue);
    const filterChange$ = Interact
        .get('change-filter')
        .map(e => ({
            id: getValue(e), checked: e.target.checked
        }));
    const find$ = Interact.get('find');
    const selectedFilters$ = startSelectedFilters$
        .map(startSelectedFilters => filterChange$
            .fold((acc, change) => {
                return R.assoc(change.id, change.checked, acc);
            }, startSelectedFilters))
        .flatten();

    const state$ = model(term$, termChange$, find$, filters$, startSelectedFilters$, filterChange$);
    return {
        filters$: state$.map(R.prop('filters')),
        selectedFilters$: state$.map(R.prop('selectedFilters')),
        term$: state$.map(R.prop('term')),
        searchTermView$: state$.map(({term, findBy}) => {
            return <TermView
                term={term}
                onChange={Interact.cb('term')}
                onSearch={Interact.cb('find')}
                findBy={findBy} />
        }),
        filtersView$: state$.map(({filters, selectedFilters}) => (
            <FiltersView
                filters={filters}
                selectedFilters={selectedFilters}
                onChange={Interact.cb('change-filter')} />))
    };
};