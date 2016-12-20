import xs from 'xstream';

export default mocks => {
    return r$ => {
        const res$ = xs.create();
        r$.subscribe({
            next: req => {
                const response$ = mocks[req.category] || xs.never();
                res$.shamefullySendNext({response$, category: req.category});
            },
            error: err => console.log('Error', err),
            complete: () => console.log('Completed')
        });
        return {
            select: str => {
                return res$.filter(res => res.category === str).map(res => res.response$);
            }
        }
    }
}