import xs from 'xstream';

const makeInteract = (interactions = {}) => {
    return {
        isolate: () => {
            return makeInteract();
        },
        get: (key) => {
            if (!interactions[key]) {
                interactions[key] = {
                    stream: xs.create(),
                    cb: null
                };
            }
            return interactions[key].stream;
        },
        cb: (key) => {
            if (!interactions[key]) {
                interactions[key] = {
                    stream: xs.create(),
                    cb: null
                };
            }
            interactions[key].cb = val => {
                interactions[key].stream.shamefullySendNext(val);
            };
            return interactions[key].cb;
        }
    };
};

export default () => {
    return makeInteract();
}