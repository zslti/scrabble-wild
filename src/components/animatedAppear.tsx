import React from 'react'

interface Props {
    isVisible: boolean;
    childComponent: React.ReactNode;
    height?: string;
    className?: string;
    isScrollable?: boolean;
    transitionTime?: string;
}

function AnimatedAppear(props: Props) {
    return (
        <div className={'animated-appear ' + (props.isVisible?'visible ':'') + props.className} style={{height: (props.isVisible?props.height:0), overflowY: props.isScrollable?'scroll':'hidden', transition: `all ${props.transitionTime}`}}>
            {props.childComponent}
        </div>
    )
}

export default AnimatedAppear