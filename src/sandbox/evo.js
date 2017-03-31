import React from 'react';
import dist from './dist';
import R from 'ramda';
import xs from 'xstream';
import onionify from 'cycle-onionify';
import './style.css';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const alphabet = 'abcdefghijklmnopqrstuvwxyz ,'.split('');
const replicate = R.curry((alphabet, initialString) => {
    if (!initialString) {
        return '';
    }
    const changeIndex = getRandomInt(0, initialString.length - 1);
    const letterIndex = getRandomInt(0, alphabet.length - 1);
    return R.join('', R.update(changeIndex, alphabet[letterIndex], initialString));
});
const generateFirstString = R.curry((alphabet, target) => R.split('', target).reduce((acc, l) => acc + replicate(alphabet, l), ''));
const test = R.curry((example, data) => {
    return dist(example, data);
});

const makePussy = R.curry((target, name) => {
    const dna = generateFirstString(alphabet, target);
    return {
        name,
        generations: [{dna, diff: test(target, dna)}]
    };
});
const evolvePussy = R.curry((target, step, pussy) => {
    const last = R.takeLast(1, pussy.generations)[0];
    const dna = replicate(alphabet, last.dna);
    const nextGeneration = {dna, diff: test(target, dna)};
    return {
        ...pussy,
        generations: [nextGeneration]//R.append(nextGeneration, pussy.generations)
    };
});
const makePussyChild = ({name, generations}) => ({
    name,
    generations: R.takeLast(1, generations)
});

const pussyView = (name, generations) => (
    <div className={`pussy`} >
        <ul>
            <li>{name}</li>
            {generations.map(({dna, diff}, i) => (
                <li key={i} className={diff ? '' : 'winner'} >
                    <pre className={`pre`} >{i === 0 ? (<b>{dna}</b>) : dna}</pre>
                    <span>({diff})</span>
                </li>
            ))}
        </ul>
    </div>
);
const makeEvoView = Interact => ({target, pause, targetValue, population = [], step, winners, show, startCount, use_natural_selection}) => {
    return (
        <div>
            <h1>Evo</h1>
            <div>
                <div>
                    <input type="text" value={targetValue} onChange={Interact.cb('changeTarget')} />
                    <br/>
                    <br/>
                    <label>
                        Population size <input type="number" step={10} value={startCount}
                                               onChange={Interact.cb('start_count')} />
                    </label>
                    <br/>
                    <label>
                        <input type='checkbox' checked={use_natural_selection}
                               onChange={Interact.cb('use_natural_selection')} />
                        Use natural selection
                    </label>
                    <br/>
                    <button onClick={Interact.cb((pause || winners.length > 0) ? 'start' : 'pause')} >{(pause || winners.length > 0) ? 'start' : 'pause'}</button>
                    {step > 1 ? <button onClick={Interact.cb('stop')} >stop</button> : null}
                </div>
                <h2>Target: {target}</h2>
                <label>
                    <input type='checkbox' checked={show} onChange={Interact.cb('show_process')} />
                    Show process
                </label>
                {target ? <h3>Generation #{step}</h3> : null}
                <br/>
                <div className="grid" >
                    {population}
                </div>
            </div>
        </div>
    );
};
const App = ({Interact, onion}) => {
    const SPEED = 2;
    const last = arr => R.takeLast(1, arr)[0];
    const active$ = onion.state$.map(({winners, pause}) => !pause && winners.length < 1);
    const nextStep$ = active$
        .map((is) => {
            return is ? xs.periodic(SPEED) : xs.create();
        })
        .flatten();
    const startCount$ = Interact.get('start_count').map(e => e.target.value).startWith(10);
    const start$ = Interact.get('start');
    const pause$ = Interact.get('pause');
    const stop$ = Interact.get('stop');
    const showProcess$ = Interact.get('show_process').map(e => e.target.checked).startWith(false);
    const useNaturalSelection$ = Interact.get('use_natural_selection').map(e => e.target.checked).startWith(true);

    const targetString$ = Interact.get('changeTarget').map(e => e.target.value).startWith('milenka');

    const startReducer$ = xs.combine(startCount$, targetString$)
        .map(([startCount, target]) => xs
            .merge(start$.mapTo('play'), pause$.mapTo('pause'), stop$.mapTo('stop'))
            .map((action) => {
                return state => {
                    if (action === 'stop') {
                        const population = R.times(R.add(0), startCount).map(i => makePussy(target, i));
                        return ({...state, winners: [], population, step: 1, target, pause: true});
                    }
                    if (action === 'play') {
                        if (state.winners.length === 0 && state.step > 1) {
                            console.log('resume: state.step', state.step, state);
                            return ({...state, pause: false});
                        }
                        console.log('play: state.step', state.step, state);
                        return {
                            ...state,
                            winners: [],
                            population: R.times(R.add(0), startCount).map(i => makePussy(target, i)),
                            step: 1,
                            target,
                            pause: false
                        };
                    }
                    return ({...state, pause: true});
                };

            })
        )
        .flatten()
        .startWith(R.always({
            winners: [],
            population: [],
            step: -1,
            target: '',
            pause: true
        }));

    const updatePopulationReducer$ = xs.combine(useNaturalSelection$, onion.state$)
        .map(([useNaturalSelection, state]) => {
            return nextStep$.map(() => {
                const {target, population, step} = state;
                const winners = population
                    .sort((a, b) => last(a.generations).diff - last(b.generations).diff)
                    .filter(p => last(p.generations).diff === 0);

                const number = useNaturalSelection ? Math.round(population.length / 2) : 0;
                const parents = R.take(number, population);
                const children = R.map(makePussyChild, parents);
                const nextPopulation = R.pipe(
                    R.dropLast(parents.length),
                    R.concat(children.map(evolvePussy(target, step)))
                )(population);

                return state => ({
                    ...state,
                    winners,
                    step: step + 1,
                    population: winners.length ? population : nextPopulation
                })
            });
        })
        .flatten();

    const reducer$ = xs.merge(startReducer$, updatePopulationReducer$);

    const evoView = makeEvoView(Interact);
    return {
        onion: reducer$,
        DOM: xs.combine(onion.state$, targetString$, showProcess$, startCount$, useNaturalSelection$)
        // .debug('STATE')
            .map(([{target, population, step, winners = [], pause}, targetValue, show, startCount, use_natural_selection]) => ({
                targetValue,
                startCount,
                pause,
                show,
                target,
                step,
                winners,
                use_natural_selection,
                population: (show ? population : winners).map(({name, generations}) => pussyView(name, generations))
            }))
            .map(evoView)
    };
};

export default onionify(App);