import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import React from 'react';
import R from 'ramda';

const convertResponse = JSON.parse;
const playlistView = pl => (<div>{pl.name}</div>);
const view = playlists => {
  return (
    <div>
      <h1>Playlists</h1>
      <ul>
        {playlists.map((pl, i) => (<li key={i}>{playlistView(pl)}</li>))}
      </ul>
    </div>
  );
};

const Playlists = (sources) => {
  const {userId$, HTTP} = sources;
  const requestForPlaylists$ = userId$.map(id => ({
    category: 'load-playlists',
    url: `/users/${id}/playlists`
  }));
  const responsePlaylists$ = HTTP.select('load-playlists').flatten();
  const playlists$ = responsePlaylists$
    .map(convertResponse)
    .startWith([]);

  return {
    view$: playlists$.map(view),
    HTTP: requestForPlaylists$
  };
};

export default Playlists;
