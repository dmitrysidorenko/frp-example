import React from 'react';

export default ({login, password, onLoginChange, onPasswordChange, onSubmit}) => (
    <div>
        <div>
            <input placeholder='login' onChange={onLoginChange} value={login} />
        </div>
        <div>
            <input placeholder='password' onChange={onPasswordChange} type='password' value={password} />
        </div>
        <button onClick={onSubmit} >Sign In</button>
    </div>
);