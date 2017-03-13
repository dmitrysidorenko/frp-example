import ReactDOM from 'react-dom';

export default function makeReactDomDriver(domElement) {
    function domReactDriver(vtree$) {
        vtree$.subscribe({
                next: vtree => {
                ReactDOM.render(vtree, domElement);
    },
        error: e => console.error('Error:', e),
            complete: () => console.log('Completed')
    });

        return {};
    }

    return domReactDriver;
}
