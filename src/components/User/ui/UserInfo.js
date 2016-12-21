import React from 'react';

export default ({user, onSignOut}) => (
    <div>
        <div>{user.firstName} {user.lastName}</div>
        <button onClick={onSignOut} >Sign out</button>
    </div>
);