import React from 'react'
import AnimatedAppear from './animatedAppear'
import { focusedElement } from '../util/focusedElement'

interface Props {
    className?: string,
    icon?: string,
    value: any,
    onChange: (value: any) => void,
    options: any[],
    excludeCurrentSelection?: boolean,
}

function Dropdown(props: Props) {
    const [open, setOpen] = React.useState(false)

    function handleFocusChange() {
        !focusedElement?.classList.value.includes('dropdown') && setOpen(false);
    }
    
    React.useEffect(() => {
       document.removeEventListener('focusedElementChanged', handleFocusChange)
       document.addEventListener('focusedElementChanged', handleFocusChange)
    })

    return (
        <>
            <div className="dropdown-height-helper" id="language-dropdown-helper">
                {props.options.map((option, index) => {
                    if(props.excludeCurrentSelection && option === props.value) return null
                    return <div key={index} className="dropdown-item" onClick={(e) => {props.onChange(option); setOpen(false)}}>{option}</div>
                })}
            </div>
            <div className={"dropdown " + props.className}>
                <div className="dropdown-header" onClick={() => {setOpen(!open);}}><i className={props.icon}></i>{props.value}</div>
                <AnimatedAppear isVisible={open} height={`${document.getElementById("language-dropdown-helper")?.clientHeight}px`} childComponent={
                    props.options.map((option, index) => {
                        if(props.excludeCurrentSelection && option === props.value) return null
                        return <div key={index} className="dropdown-item" onClick={(e) => {props.onChange(option); setOpen(false)}}>{option}</div>
                    })
                }/>
            </div>
        </>
    )
}

export default Dropdown