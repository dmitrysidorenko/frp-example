import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import React from 'react';
import R from 'ramda';
import SignIn from './ui/SignIn';
import EditRoles from './ui/EditRoles';
import UserInfo from './ui/UserInfo';

// constants
export const SIGN_IN_REQUEST_CATEGORY = 'sign-in';
export const SIGN_OUT_REQUEST_CATEGORY = 'sign-out';
export const REMOVE_ROLE_REQUEST_CATEGORY = 'remove-user-role';
const SIGN_IN_URL = '/auth/sign-in';
const SIGN_OUT_URL = '/auth/sign-out';
const SIGN_IN_EVENT = 'SIGN_IN_EVENT';
const SIGN_OUT_EVENT = 'SIGN_OUT_EVENT';
const LOGIN_CHANGED_EVENT = 'CHANGE_LOGIN_EVENT';
const PASSWORD_CHANGED_EVENT = 'CHANGE_PASSWORD_EVENT';
const REMOVE_ROLE_EVENT = 'REMOVE_ROLE_EVENT';
// helpers
const getTargetValue = R.path(['target', 'value']);
const convertUserFromServerResponse = JSON.parse;
const extractUserFromState = R.prop('user');
const extractRolesFromUser = R.prop('roles');
// state
const makeState = ({changeLogin$, changePassword$, signInResponse$, signOutResponse$, removeUserRoleResponse$}) => {
    const user$ = xs.merge(signOutResponse$.mapTo(null), xs.merge(signInResponse$, removeUserRoleResponse$).map(convertUserFromServerResponse));
    const signInFormData$ = xs.combine(
        changeLogin$.map(getTargetValue).startWith(''),
        changePassword$.map(getTargetValue).startWith(''),
    ).map(([login, password]) => ({login, password}));
    return xs
        .combine(
            signInFormData$,
            user$.startWith(null)
        )
        .map(([signInFormData, user]) => ({
            signInFormData,
            user
        }))
        .remember();
};
// views
const makeSignInView = (state$, Interact) => state$
    .map(R.prop('signInFormData'))
    .map(signInFormData => ({
        login: signInFormData.login,
        password: signInFormData.password,
        onLoginChange: Interact.cb(LOGIN_CHANGED_EVENT),
        onPasswordChange: Interact.cb(PASSWORD_CHANGED_EVENT),
        onSubmit: Interact.cb(SIGN_IN_EVENT)
    }))
    .map(SignIn)
    .remember();
const makeUserInfoView = (user$, Interact) => user$
    .filter(R.is(Object))
    .map(user => ({user, onSignOut: Interact.cb(SIGN_OUT_EVENT)}))
    .map(UserInfo)
    .startWith(null)
    .remember();
const makeUserView = (user$, userInfoView$, signInView$) => xs
    .combine(user$, userInfoView$, signInView$)
    .map(([user, userInfoView, signInView]) => R.ifElse(
        R.is(Object),
        R.always(userInfoView),
        R.always(signInView)
    )(user))
    .remember();
const makeEditRolesView = (Interact, roles$) => roles$
    .map(roles => ({roles, onRemove: Interact.cb(REMOVE_ROLE_EVENT)}))
    .map(EditRoles);
// ajax
const makeSignInRequest = signIn$ => signIn$.map(({login, password}) => ({
    category: SIGN_IN_REQUEST_CATEGORY,
    data: {login, password},
    url: SIGN_IN_URL,
    method: 'GET'
}));
const makeSignOutRequest = signOut$ => signOut$.mapTo({
    category: SIGN_OUT_REQUEST_CATEGORY,
    method: 'POST',
    url: SIGN_OUT_URL
});
const makeRemoveRoleRequest = R.map(({userId, roleId}) => ({
        category: REMOVE_ROLE_REQUEST_CATEGORY,
        url: `/users/${userId}/roles/${roleId}`,
        method: 'DELETE'
    }));
const getSignInResponse = HTTP => HTTP.select(SIGN_IN_REQUEST_CATEGORY).flatten();
const getSignOutResponse = HTTP => HTTP.select(SIGN_OUT_REQUEST_CATEGORY).flatten();
const getRemoveUserRoleResponse = HTTP => HTTP.select(REMOVE_ROLE_REQUEST_CATEGORY).flatten();
/**
 * Module provides User features
 * @param sources
 * @returns {{
 *  user$: (MemoryStream<Object|null>),
 *  roles$: (MemoryStream<string[]>),
 *  userView$: Stream<ReactElement>,
 *  signInView$: Stream<ReactElement>,
 *  editRolesView$: Stream<ReactElement>,
 *  HTTP: Stream<Object>
 * }}
 */
const User = sources => {
    // input
    const {HTTP, signIn$:signInInput$, Interact} = sources;
    // ajax responses
    const signInResponse$ = getSignInResponse(HTTP);
    const signOutResponse$ = getSignOutResponse(HTTP);
    const removeUserRoleResponse$ = getRemoveUserRoleResponse(HTTP);
    // user actions
    const signIn$ = Interact.get(SIGN_IN_EVENT);
    const signOut$ = Interact.get(SIGN_OUT_EVENT);
    const changeLogin$ = Interact.get(LOGIN_CHANGED_EVENT);
    const changePassword$ = Interact.get(PASSWORD_CHANGED_EVENT);
    const removeRole$ = Interact.get(REMOVE_ROLE_EVENT).map(getTargetValue);
    // state
    const state$ = makeState({
        changeLogin$,
        changePassword$,
        signInResponse$,
        signOutResponse$,
        removeUserRoleResponse$
    });
    const user$ = state$.map(extractUserFromState).compose(dropRepeats()).remember();
    const userId$ = user$.filter(R.is(Object)).map(R.prop('id')).remember();
    const roles$ = user$.map(R.ifElse(R.is(Object), extractRolesFromUser, R.always([]))).remember();
    // views
    const signInView$ = makeSignInView(state$, Interact);
    const userInfoView$ = makeUserInfoView(user$, Interact);
    const userView$ = makeUserView(user$, userInfoView$, signInView$);
    const editRolesView$ = makeEditRolesView(Interact, roles$);
    // ajax requests
    const signInRequest$ = makeSignInRequest(xs.merge(signInInput$, signIn$));
    const signOutRequest$ = makeSignOutRequest(signOut$);
    const removeRoleRequest$ = makeRemoveRoleRequest(userId$.map(userId => removeRole$.map(roleId => ({
        userId,
        roleId
    }))).flatten());
    const httpSink$ = xs.merge(signInRequest$, signOutRequest$, removeRoleRequest$);
    // output
    return {
        user$,
        roles$,
        userView$,
        signInView$,
        editRolesView$,
        HTTP: httpSink$,
        Action: signInResponse$.map(r => ({type: 'SIGN_IN', payload: convertUserFromServerResponse(r)}))
    };
};

export default User;
