import xs from 'xstream';
import React from 'react';
import R from 'ramda';
import User from '../User';
import Playlists from '../Playlists';

const getRoles = R.ifElse(R.is(Object), R.prop('roles'), R.always([]));

const BaseComponent = (sources) => {
  const { Interact } = sources;
  const user = User({ ...sources, signIn$: xs.empty() });
  const user$ = user.user$;
  const roles$ = user$.map(getRoles).debug('roles');
  const isPublisher$ = roles$.map(R.contains('pb')).startWith(false);
  const isAdmin$ = roles$.map(R.contains('admin')).startWith(false);
  const userId$ = user$.filter(R.is(Object)).map(R.prop('id')).remember();
  const adminView$ = isAdmin$.map(R.ifElse(R.equals(true), R.always(<h2>
    Admin Panel [soon]</h2>), R.always(null)));

  const playlists = Playlists({
    Interact: Interact.isolate(),
    userId$,
    HTTP: sources.HTTP
  });
  const playlistsView$ = xs
    .combine(playlists.view$, isPublisher$)
    .map(([view, isPublisher]) => (R.ifElse(R.equals(true), R.always(view), R.always(null))(isPublisher)));
  const httpSink$ = xs.merge(user.HTTP, playlists.HTTP);
  return {
    DOM: xs
      .combine(
        adminView$.debug('adminview'),
        user.userView$,
        playlistsView$
      )
      .map(([
        adminView$,
        UserView,
        playlistsView
      ]) => (
        <div>
          <section>
            {UserView}
            {adminView$}
          </section>
          <section>
            {playlistsView}
          </section>
        </div>
      )),
    HTTP: httpSink$.debug('HTTP')
  };
};

export default BaseComponent;
