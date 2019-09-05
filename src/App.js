import React from 'react';
import { shuffle } from 'lodash';
import './App.css';

const divs = [
    'gray',
    'rebeccapurple',
    'maroon',
    'turquoise',
    'limegreen',
    'black',
    'orange',
    'purple',
    'indigo',
    'green',
    'yellow',
    'red',
];

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

    const [coordDelta, setCoordDelta] = React.useState([0, 0]);

    const startCoord = React.useRef([0, 0]);

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

    const dragTargetColor = React.useRef(null);

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

        /**
         * Since this layout effect runs before the first time this component paints,
         * we won't have any "old" positions (this runs before the effect above).
         * Use this check to skip this logic on the first render.
         */
        // if (Object.keys(positions.current).length > 0) {
        //     Object.keys(itemRefs.current).forEach(color => {
        //         const node = itemRefs.current[color].current;
        //         if (color === dragTargetColor.current) {
        //             return;
        //         }

        //         const deltaX = positions.current[color].left - newPositions[color].left;
        //         const deltaY = positions.current[color].top - newPositions[color].top;

        //         /**
        //          * Batch our DOM node changes for the next browser paint.
        //          */
        //         requestAnimationFrame(() => {
        //             // Before the DOM paints, invert it to its old position
        //             node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        //             // Ensure it inverts it immediately
        //             node.style.transition = 'transform 0s';

        //             /**
        //              * In order to get the animation to play, we'll need to wait for
        //              * the 'invert' animation frame to finish, so that its inverted
        //              * position has propagated to the DOM.
        //              *
        //              * Then, we just remove the transform, reverting it to its natural
        //              * state, and apply a transition so it does so smoothly.
        //              */
        //             requestAnimationFrame(() => {
        //                 node.style.transform = '';
        //                 node.style.transition = 'transform 500ms';
        //             });
        //         });
        //     });
        // }

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

    // function onMouseDown(e) {
    //     dragTargetColor.current = e.target;
    //     window.addEventListener('mousemove', onDragging);
    //     window.addEventListener('mouseup', onDragEnd);
    // }

    // function onDragging(e) {
    //     // console.log(e.clientX);
    //     // console.log(e.clientY);
    // }

    // function onDragEnd() {
    //     dragTargetColor.current = null;
    //     window.removeEventListener('mousemove', onDragging);
    //     window.removeEventListener('mouseup', onDragEnd);
    // }

    function onDragStart(color, e) {
        console.log('drag start');
        dragTargetColor.current = color;
        startCoord.current = [e.clientX, e.clientY];
        setCoordDelta([0, 0]);

        // Remove default translucent image when dragging.
        e.dataTransfer.setDragImage(new Image(), 0, 0);
    }

    function onDrag(e) {
        if (dragTargetColor.current && e.clientX !== 0 && e.clientY !== 0) {
            const [startX, startY] = startCoord.current;
            setCoordDelta([e.clientX - startX, e.clientY - startY]);
        }
    }

    function onDragEnd(e) {
        console.log('drag end');
        dragTargetColor.current = null;
        startCoord.current = [0, 0];
        setCoordDelta([0, 0]);
    }

    function onDragEnter(dropzoneColor, e) {
        setItems(prevItems => {
            const dragTargetIndex = prevItems.findIndex(color => color === dragTargetColor.current);
            const dropColorIndex = prevItems.findIndex(color => color === dropzoneColor);
            const items = [...prevItems];
            items[dragTargetIndex] = dropzoneColor;
            items[dropColorIndex] = dragTargetColor.current;
            return items;
        });

        startCoord.current = [e.clientX, e.clientY];
        setCoordDelta([0, 0]);
    }

    const list = items.map(color => {
        const ref = React.createRef(null);
        itemRefs.current[color] = ref;
        return (
            <div
                draggable
                onDragStart={onDragStart.bind(null, color)}
                onDrag={onDrag}
                onDragEnd={onDragEnd}
                key={color}
                ref={ref}
                className="item"
                style={{
                    backgroundColor: color,
                    transform:
                        dragTargetColor.current === color
                            ? `translate(${coordDelta[0]}px, ${coordDelta[1]}px)`
                            : 'none',
                }}
            >
                <div
                    className="dropzone"
                    onDragEnter={
                        dragTargetColor.current === color ? null : onDragEnter.bind(null, color)
                    }
                ></div>
            </div>
        );
    });

    function reorder() {
        setItems(shuffle(items));
    }

    return (
        <div>
            <div className="main">{list}</div>
            <div className="reorder">
                <button onClick={reorder}>Reorder</button>
            </div>
        </div>
    );
}

export default App;
