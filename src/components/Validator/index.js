import xs from 'xstream';
import React from 'react';

const reactView = ({validators, config, onChange}) => {
    return (
        <div>
            {validators.map((v, i) => {
                return (
                    <div key={i}>
                        <label>
                            <input type='checkbox' value={i} checked={config[i]} onChange={onChange}/>
                            {v.label}
                        </label>
                    </div>);
            })}
        </div>
    );
};

const intent = (Interact, config$, validators$) => {
    return {
        change$: Interact.get('Change')
            .map(e => ({index: e.target.value, active: e.target.checked})),
        config$,
        validators$
    };
};

const model = (intent, Interact) => {
    const {config$, change$, validators$} = intent;
    const totalConfig$ = config$
        .map(config => {
            return change$
                .fold((acc, change) => {
                    const {index, active} = change;
                    return [
                        ...acc.slice(0, index),
                        active,
                        ...acc.slice(index + 1)
                    ];
                }, config);
        })
        .flatten();

    return xs.combine(totalConfig$, validators$)
        .map(([config, validators]) => {
            return {
                onChange: Interact.cb('Change'),
                config,
                validators
            };
        })
        .remember();
};

const view = (state$) => {
    return state$
        .map(reactView)
};

export default (sources) => {
    const { Interact, config$, validators$ } = sources;
    const state$ = model(intent(Interact, config$, validators$), Interact);
    const vtree$ = view(state$);
    const validateFn$ = state$
        .map(({config, validators}) => {
            return validators.filter((v, i) => config[i]);
        })
        .map((validators) => {
            return value => validators
                .map(v => v.fn(value))
                .filter(msg => !!msg);
        });
    return {
        validateFn$,

        view$: vtree$,
        msgsViewFn$: validateFn$.map(fn => {
            return ({text}) => {
                const msgs = fn(text);
                return (
                    <div>
                        {msgs.map((msg, i) => (<div key={i} style={{color:'red'}}>{msg}</div>))}
                    </div>);
            }
        })
    };
}