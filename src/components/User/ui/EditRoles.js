import React from 'react';

export default ({roles, onRemove}) => (
    <div>
        {roles.map((r, i) => (
            <div key={i} >
                <span>{r}</span>
                <button value={r} onClick={onRemove} >Remove</button>
            </div>
        ))}
        <div></div>
    </div>
);