import React from 'react'
import { getTime } from '../util/time';

interface Props {
    countingTo: number,
    onTimerEnd?: () => void,
    className?: string,
}

let now = 0;

function SimpleCountdown(props: Props) {
    const [countdown, setCountdown] = React.useState(props.countingTo);
    const [display, setDisplay] = React.useState(0);
    const [isFlashing, setIsFlashing] = React.useState(false);

    React.useEffect(() => {
        setCountdown(props.countingTo);
    }, []);

    React.useEffect(() => {
        const interval = setInterval(async () => {
            now = await getTime();
            const newDisplay = Math.floor((now - countdown)/-1000);
            setDisplay(Math.max(0, newDisplay));
            if(newDisplay <= 0 && newDisplay % 5 == 0) props.onTimerEnd?.();
            setIsFlashing(newDisplay < 10);
            setCountdown(countdown => countdown - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div key={props.countingTo} className={(props.className ?? '') + (isFlashing ? " flashing" : "")}>
            {display}
        </div>
    );
}

export default SimpleCountdown;