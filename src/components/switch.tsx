import React from 'react'

interface Item{
    name: string;
    value: any;
}

interface Props {
    className?: string;
    items: Item[];
    currentValue: any;
    onChange: (value: any) => void;
}

function Switch(props: Props) {
    return (
        <div className={'switch ' + props.className}>
            {props.items.map((item, index) => {
                return (
                    <React.Fragment key={index}>
                        <input 
                            name="switch" 
                            className={'switch' + index} 
                            id={item.name} 
                            type="radio" 
                            checked={item.value == props.currentValue} 
                            onChange={(e) => {props.onChange(item.value)}}
                        />
                        <label htmlFor={item.name} className="switch__label">{item.name}</label>
                    </React.Fragment>
                )
            }
            )}
            <div className="switch__indicator"/>
        </div>
    )
}

export default Switch