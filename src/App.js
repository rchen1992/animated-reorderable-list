import React from 'react';
import { shuffle } from 'lodash';
import './App.css';

const divs = ['gray', 'rebeccapurple', 'maroon', 'turquoise', 'limegreen'];

/**
 * Returns an object where the key is the color and the value is the
 * bounding box of that color's DOM node (the result of `getBoundingClientRect`).
 */
function getNodeBoundingBoxes(itemRefs) {
    return Object.keys(itemRefs).reduce((result, color) => {
        const node = itemRefs[color].current;
        const boundingBox = node.getBoundingClientRect();
        result[color] = boundingBox;

        return result;
    }, {});
}

function App() {
    const [items, setItems] = React.useState(divs);

    /**
     * Ref holding the previous bounding boxes of each item.
     * Example: { gray: DOMRect, rebeccapurple: DOMRect }
     */
    const positions = React.useRef({});

    /**
     * Ref holding the mapping between color and DOM node.
     * Example: { gray: dom node, rebeccapurple: dom node }
     */
    const itemRefs = React.useRef({});

    /**
     * On mount, get the current positions (bounding boxes) of each div.
     */
    React.useEffect(() => {
        updatePositions();
    }, []);

    /**
     * `useLayoutEffect` (unlike `useEffect`) runs before browser paint,
     * so here we can do the FLIP.
     */
    React.useLayoutEffect(() => {
        const newPositions = getNodeBoundingBoxes(itemRefs.current);

        console.log('old positions', positions.current);
        console.log('new positions', newPositions);

        /**
         * Since this layout effect runs before the first time this component paints,
         * we won't have any "old" positions (this runs before the effect above).
         * Use this check to skip this logic on the first render.
         */
        if (Object.keys(positions.current).length > 0) {
            Object.keys(itemRefs.current).forEach(color => {
                const deltaX = positions.current[color].left - newPositions[color].left;
                const deltaY = positions.current[color].top - newPositions[color].top;

                /**
                 * Batch our DOM node changes for the next browser paint.
                 */
                requestAnimationFrame(() => {
                    const node = itemRefs.current[color].current;

                    // Before the DOM paints, invert it to its old position
                    node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                    // Ensure it inverts it immediately
                    node.style.transition = 'transform 0s';

                    /**
                     * In order to get the animation to play, we'll need to wait for
                     * the 'invert' animation frame to finish, so that its inverted
                     * position has propagated to the DOM.
                     *
                     * Then, we just remove the transform, reverting it to its natural
                     * state, and apply a transition so it does so smoothly.
                     */
                    requestAnimationFrame(() => {
                        node.style.transform = '';
                        node.style.transition = 'transform 500ms';
                    });
                });
            });
        }

        /**
         * After every render, we have to save our current
         * positions into the previous positions, so that the next
         * render can use the updated positions.
         */
        updatePositions();
    });

    function updatePositions() {
        const newPositions = getNodeBoundingBoxes(itemRefs.current);
        positions.current = newPositions;
    }

    const list = items.map(color => {
        const ref = React.createRef(null);
        itemRefs.current[color] = ref;
        return (
            <div key={color} ref={ref} className="item" style={{ backgroundColor: color }}></div>
        );
    });

    function reorder() {
        setItems(shuffle(items));
    }

    return (
        <div className="main">
            {list} <button onClick={reorder}>Reorder</button>
        </div>
    );
}

export default App;
