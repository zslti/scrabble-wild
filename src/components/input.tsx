import React from 'react'

interface Props {
    value: string;
    className?: string;
    placeholder?: string;
    icon?: string;
    type?: string;
    isSmall?: boolean;
    onChange: (value: string) => void;
}

function Input(props: Props){
    const [obfuscated, setObfuscated] = React.useState(true);

    return (
        <div style={{height: '2.1rem'}}>
            <input className={`overlay-input ${props.isSmall?'small':''}`} placeholder={props.placeholder} value={props.value} onChange={(e) => {props.onChange(e.target.value)}} type={props.type === 'password' && !obfuscated?'text':props.type}/>
            <i className={props.icon + ' input-icon ' + props.className}></i>
            {props.type === 'password' && !obfuscated && <i className='fa-solid fa-eye-slash input-icon-password' onClick={() => setObfuscated(!obfuscated)}></i>}
            {props.type === 'password' && obfuscated && <i className='fa-solid fa-eye input-icon-password' onClick={() => setObfuscated(!obfuscated)}></i>}
        </div>
    )
}

export default Input