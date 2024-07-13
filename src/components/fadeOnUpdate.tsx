import React from 'react'

interface Props {
    childComponent: React.ReactNode;
    id: any;
    keyValue: any;
    className?: string;
}

let oldComponents = new Map<any, React.ReactNode>();
let oldKeys = new Map<any, any>();

function FadeOnUpdate(props: Props) {
    const [isVisible, setIsVisible] = React.useState(true);
    const [component, setComponent] = React.useState(oldComponents.get(props.id) ?? props.childComponent);

    React.useEffect(() => {
        if(oldKeys.get(props.id) == props.keyValue || props.keyValue == '') return;

        setIsVisible(false);
        const timeoutId = setTimeout(() => {
            oldComponents.set(props.id, component);
            oldKeys.set(props.id, props.keyValue);
            setComponent(props.childComponent);
            setTimeout(() => setIsVisible(true), 250);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [props.childComponent]);

    return (
        <div className={'fade-on-update ' + (isVisible?'visible ':'') + (props.className)}>
            {component}
        </div>
    )
}

export default FadeOnUpdate;