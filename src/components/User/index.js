import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import React from 'react';
import R from 'ramda';
import SignIn from './ui/SignIn';

const SIGN_IN_REQUEST_CATEGORY = 'sign-in';
const SIGN_OUT_REQUEST_CATEGORY = 'sign-out';
const SIGN_IN_URL = 'http://www.mocky.io/v2/5857f745120000f90ec8aeb6';

const getValue = R.path(['target', 'value']);

const makeUser = JSON.parse;

const model = ({ changeLogin$, changePassword$, signInResponse$, signOutResponse$ }) => {
  const user$ = xs.merge(signOutResponse$.mapTo(null), signInResponse$.map(makeUser));
  return xs
    .combine(
      changeLogin$.map(getValue).startWith(''),
      changePassword$.map(getValue).startWith(''),
      user$.startWith(null)
    )
    .map(([login, password, user]) => ({
      credentials: { login, password },
      user
    }))
    .remember();
};

const User = (sources) => {
  const { HTTP, signIn$:signInInput$, Interact } = sources;
  const signInResponse$ = HTTP
    .select(SIGN_IN_REQUEST_CATEGORY)
    .flatten();
  const signOutResponse$ = HTTP
    .select(SIGN_OUT_REQUEST_CATEGORY)
    .flatten();
  const signIn$ = Interact.get('SignIn');
  const signOut$ = Interact.get('SignOut');
  const changeLogin$ = Interact.get('login');
  const changePassword$ = Interact.get('password');
  const state$ = model({
    changeLogin$,
    changePassword$,
    signInResponse$,
    signOutResponse$
  });
  const user$ = state$.map(R.prop('user')).compose(dropRepeats()).remember();

  const signInView$ = state$
    .map(R.prop('credentials'))
    .map(props => ({
      ...props,
      onLoginChange: Interact.cb('login'),
      onPasswordChange: Interact.cb('password'),
      onSubmit: Interact.cb('SignIn')
    }))
    .map(SignIn);

  const userView$ = xs.combine(user$, signInView$)
    .map(([user, signInView]) => {
      if (user) {
        return (<div>
          <div>{user.firstName} {user.lastName}</div>
          <button onClick={Interact.cb('SignOut')}>Sign out</button>
        </div>);
      } else {
        return (signInView);
      }
    });

  const signInRequest$ = xs.merge(signInInput$, signIn$)
    .map(({ login, password }) => {
      return {
        category: SIGN_IN_REQUEST_CATEGORY,
        data: { login, password },
        url: SIGN_IN_URL,
        method: 'GET'
      };
    });
  const signOutRequest$ = signOut$.mapTo({
    category: 'sign-out',
    method: 'POST',
    url: '/auth/sign-out'
  });
  return {
    user$,
    roles$: user$.map(R.prop('roles')),
    userView$: userView$,
    signInView$: signInView$,
    HTTP: xs.merge(signInRequest$, signOutRequest$)
  };
};

export default User;
