import xs from 'xstream';
import React from 'react';
import R from 'ramda';
import User from '../User';
import Playlists from '../Playlists';

const ViewPlaceholder = ({children}) => (
    <div style={{
        border:'1px dotted #ddd',
        background: '#ececec',
        borderRadius: 3,
        padding: 10,
        marginBottom: 10
    }} >{children}</div>);

const makePlaylistsView = (view$, isPublisher$) => xs.combine(view$, isPublisher$)
    .map(([view, isPublisher]) => (R.ifElse(R.equals(true), R.always(view), R.always(null))(isPublisher)));

const BaseComponent = (sources) => {
    const {Interact} = sources;
    const userModule = User({...sources, signIn$: xs.empty()});

    const user$ = userModule.user$;
    const userId$ = user$.filter(R.is(Object)).map(R.prop('id')).remember();

    const playlistsModule = Playlists({
        Interact: Interact.isolate(),
        userId$,
        HTTP: sources.HTTP
    });

    const roles$ = userModule.roles$;
    const isPublisher$ = roles$.map(R.contains('pb')).startWith(false);
    const isAdmin$ = roles$.map(R.contains('admin')).startWith(false);
    // views
    const adminView$ = isAdmin$.map(
        R.ifElse(
            R.equals(true),
            R.always(<div style={{background: '#ddd', padding: 10}} >Admin Panel View</div>),
            R.always(null)
        )
    );
    const playlistsView$ = makePlaylistsView(playlistsModule.view$, isPublisher$);
    // ajax
    const httpSink$ = xs.merge(userModule.HTTP, playlistsModule.HTTP);
    return {
        DOM: xs
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
        HTTP: httpSink$.debug('HTTP')
    };
};

export default BaseComponent;
