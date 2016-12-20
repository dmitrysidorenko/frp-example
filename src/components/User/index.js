import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import React from 'react';
import R from 'ramda';
import SignIn from './ui/SignIn';

const SIGN_IN_REQUEST_KEY = 'sign-in';
const SIGN_IN_URL = 'http://www.mocky.io/v2/5857f745120000f90ec8aeb6';

const getValue = R.path(['target', 'value']);

const makeUser = (json) => {
    const parsed = JSON.parse(json);
    const {firstName, lastName, email} = parsed;
    return {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email
    };
};

const intent = (Interact) => {
    return {
        changeLogin$: Interact.get('login'),
        changePassword$: Interact.get('password'),
        onSignIn$: Interact.get('OnSignInSubmit')
    };
};

const model = ({changeLogin$, changePassword$, signInResponse$}) => {
    const user$ = signInResponse$.map(makeUser);
    return xs
        .combine(
            changeLogin$.map(getValue).startWith(''),
            changePassword$.map(getValue).startWith(''),
            user$.startWith(null)
        )
        .map(([login, password, user]) => ({credentials: {login, password}, user}))
        .remember();
};

const User = (sources) => {
    const {HTTP, signIn$, Interact} = sources;
    const signInResponse$ = HTTP
        .select(SIGN_IN_REQUEST_KEY)
        .flatten();
    const onSignIn$ = Interact.get('OnSignInSubmit')
        .map(e => {
            e.preventDefault();
            return {};
        });
    const changeLogin$ = Interact.get('login');
    const changePassword$ = Interact.get('password');
    const state$ = model({
        changeLogin$,
        changePassword$,
        signInResponse$
    });
    const user$ = state$.map(R.prop('user')).compose(dropRepeats()).remember();

    const signInView$ = state$
        .map(R.prop('credentials'))
        .map(props => ({
            ...props,
            onLoginChange: Interact.cb('login'),
            onPasswordChange: Interact.cb('password'),
            onSubmit: Interact.cb('OnSignInSubmit')}))
        .map(SignIn);

    const userView$ = user$
        .map(user => {
            if (user) {
                return props => (<div>Name: {user.name}</div>);
            } else {
                return props => (
                    <div>
                        Not Authorized<br />
                        <button>Sign In</button>
                    </div>);
            }
        });

    const signInRequest$ = xs.merge(signIn$, onSignIn$)
        .map(({login, password}) => {
            return {
                category: SIGN_IN_REQUEST_KEY,
                data: {login, password},
                url: SIGN_IN_URL,
                method: 'GET'
            };
        });
    return {
        user$,
        roles$: user$.map(R.prop('roles')),
        userView$: userView$,
        signInView$: signInView$,
        HTTP: signInRequest$
    };
};

export default User;
