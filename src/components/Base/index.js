import xs from 'xstream';
import React from 'react';
import R from 'ramda';
import User from '../User';
import Playlists from '../Playlists';

const ViewPlaceholder = ({ children }) => (
  <div style={{
        border:'1px dotted #ddd',
        background: '#ececec',
        borderRadius: 3,
        padding: 10,
        marginBottom: 10
    }}>{children}</div>);

const makePlaylistsView = (view$, isPublisher$) => xs.combine(view$, isPublisher$)
  .map(([view, isPublisher]) => (R.ifElse(R.equals(true), R.always(view), R.always(null))(isPublisher)));


const HomeComponent = sources => {
  return {
    DOM: xs.of(<div>
      <h1>
        <a href="#/">Home</a></h1>
      <div>
        <a href="#/auth/sign-in">to Sign In</a>
      </div>
    </div>)
  }
};

const SignInComponent = sources => {
  return {
    DOM: xs.of(<div>
      <h1>
        <a href="#/auth/sign-in">Sign In</a></h1>
      <div>
        <a href="#/">to home</a>
      </div>
    </div>)
  };
};

const BaseComponent = (sources) => {
  const { Interact, router } = sources;
  const userModule = User({ ...sources, signIn$: xs.empty() });

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
      R.always(<div style={{background: '#ddd', padding: 10}}>
        Admin Panel View</div>),
      R.always(null)
    )
  );
  const playlistsView$ = makePlaylistsView(playlistsModule.view$, isPublisher$);
  // ajax
  const httpSink$ = xs.merge(userModule.HTTP, playlistsModule.HTTP);

  const match$ = router.define({
    '/': HomeComponent,
    '/auth/sign-in': () => ({ DOM: userModule.userView$ })
  });
  const page$ = match$.map(({ path, value }) => {
    return value({
      ...sources,
      router: sources.router.path(path)
    });
  });

  const isAuth$ = router
    .define({
      '/auth/sign-in': () => {}
    })
    .take(1)
    .map(({location}) => {
      return location.pathname === '/auth/sign-in';
    }).remember().debug('isAuth');

  return {
    DOM: page$.map(R.prop('DOM')).flatten().filter(v=>!!v),
    router: isAuth$.map(is => {
      //debugger
      if (!is) {
        //return xs.empty();
        return user$.map(user => {
          if (!user) {
            return '/auth/sign-in';
          }
          return '/';
        });
      }
      return xs.empty();
    }).flatten().debug('router'),
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
    HTTP: httpSink$.debug('HTTP')
  };
};

export default BaseComponent;
