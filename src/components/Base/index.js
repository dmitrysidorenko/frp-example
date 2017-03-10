import xs from 'xstream';
import React from 'react';
import R from 'ramda';
import User from '../User';
import Playlists from '../Playlists';

const ViewPlaceholder = ({children}) => (
    <div style={{
        border: '1px dotted #ddd',
        background: '#ececec',
        borderRadius: 3,
        padding: 10,
        marginBottom: 10
    }} >{children}</div>);

const makePlaylistsView = (view$, isPublisher$) => xs.combine(view$, isPublisher$)
    .map(([view, isPublisher]) => (R.ifElse(R.equals(true), R.always(view), R.always(null))(isPublisher)));


const HomeComponent = sources => {
    return {
        DOM: xs.of(<div>
            <h1>
                <a href="#/" >Home</a></h1>
            <div>
                <a href="#/auth/sign-in" >to Sign In</a>
            </div>
        </div>)
    }
};

const BaseComponent = (sources) => {
    const {Interact, router} = sources;
    const userModule = User({...sources, signIn$: xs.empty()});
    const signIn$ = userModule.Action.filter(R.pipe(R.prop('type'), R.equals('SIGN_IN')));

    const user$ = userModule.user$;
    const userId$ = user$.filter(R.is(Object)).map(R.prop('id')).remember();

    const playlistsModule = Playlists({
        Interact: Interact.isolate(),
        userId$,
        HTTP: sources.HTTP
    });

    const roles$ = userModule.roles$;
    const hasPbRole = R.contains('pb');
    const hasAdminRole = R.contains('admin');
    const isPublisher$ = roles$.map(hasPbRole).startWith(false);
    const isAdmin$ = roles$.map(hasAdminRole).startWith(false);
    // views
    const adminView$ = isAdmin$.map(
        R.ifElse(
            R.equals(true),
            R.always(
                <div style={{background: '#ddd', padding: 10}} >
                    Admin Panel View
                </div>),
            R.always(null)
        )
    );
    const playlistsView$ = makePlaylistsView(playlistsModule.view$, isPublisher$);
    // ajax
    const httpSink$ = xs.merge(userModule.HTTP, playlistsModule.HTTP);

    const match$ = router.define({
        '/': HomeComponent,
        '/auth': (sources) => ({
            DOM: sources.router
                .define({
                    '/sign-in': userModule.userView$
                })
                .debug('auth')
                .map(({value}) => value).flatten()
        })
    });
    const page$ = match$.map(({path, value}) => {
        return value({
            ...sources,
            router: sources.router.path(path)
        });
    });

    return {
        DOM: xs
            .combine(
                page$.map(R.prop('DOM')).flatten().filter(v=>!!v),
                userModule.userView$,
                adminView$,
                playlistsView$
            )
            .map((views) => (<ul>
                {views.filter(R.is(Object)).map((v, i) => (<ViewPlaceholder key={i} >{v}</ViewPlaceholder>))}
            </ul>)),
        router: signIn$.mapTo('/').debug('router'),
        DOM_: xs
            .combine(
                userModule.userView$,
                userModule.editRolesView$,
                adminView$,
                playlistsView$
            )
            .map(([
                userView,
                editRolesView,
                adminView,
                playlistsView
            ]) => (
                <div>
                    <ViewPlaceholder>
                        {userView}
                    </ViewPlaceholder>
                    <ViewPlaceholder>
                        {editRolesView}
                    </ViewPlaceholder>
                    <ViewPlaceholder>
                        {playlistsView}
                    </ViewPlaceholder>
                    <ViewPlaceholder>
                        {adminView}
                    </ViewPlaceholder>
                </div>
            )),
        HTTP: httpSink$.debug('HTTP'),
        Action: userModule.Action
    };
};

export default BaseComponent;
