import React from 'react'
import AnimatedAppear from './animatedAppear';

interface Props {
    text: string,
    className?: string,
    icon?: string,
    isInactive?: boolean,
    isLoadingOnClick?: boolean,
    onClick?: (() => void) | (() => Promise<boolean>),
}

function Button(props: Props) {
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if(isLoading) {
            setTimeout(() => {
                setIsLoading(false);
            }, 2000);
        }
    }, [isLoading]);

    return (
        <div className={"button-outline " + (props.isInactive?"inactive ":"") + props.className}>
            <span className={props.className} style={{width: 0}}>
                <div className={"box-outline-gradient " + props.className}>
                    <button onClick={async () => {
                            let shouldLoad = true; 
                            if(props.onClick != null) {shouldLoad = await props.onClick() ?? true} 
                            setIsLoading((props.isLoadingOnClick ?? false) && shouldLoad);
                        }} className={props.className}>
                        <i className={isLoading?"fa-solid fa-circle-notch":props.icon}></i>
                        {props.text}
                    </button>
                </div>
            </span>
        </div>
    )
}

export default Button

interface GameButtonProps {
    text: string,
    text2?: string,
    className?: string,
    icon?: string,
    isInactive?: boolean,
    isHoverableWhileInactive?: boolean,
    onClick?: (() => void),
}

export function GameButton(props: GameButtonProps) {
    return (
        <div className="game-button-container">
            <div onClick={props.onClick} className={'game-button ' + (props.isInactive?'inactive ':'') + (props.isHoverableWhileInactive?'hoverable ':'') + props.className}>
                {props.icon && <i className={props.icon}></i>}
                {props.text}
                <br/>
                <AnimatedAppear 
                    height='1rem' 
                    transitionTime='.3s' 
                    isVisible={props.text2 != null} 
                    childComponent={<div style={{fontSize: '.8rem', pointerEvents: 'none'}}>{props.text2}</div>}
                />
            </div>
        </div>
    )
}