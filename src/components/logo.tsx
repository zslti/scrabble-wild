import React from 'react'

interface Props {
    animated?: boolean;
    className?: string;
}

function Logo(props: Props) {
    React.useEffect(() => {
        if(props.animated) {
            setTimeout(() => {
                const logo2 = document.querySelector('.Logo2');
                logo2?.classList.add('active')
            }, 200)
        }
    }, [props.animated])

    return (
        <div className={props.className}>
            <span className='Logo'>Scrabble</span>
            <div className="Logo2-container">
                <span className={'Logo2 ' + (props.animated?'animated':'')}>WILD</span>
            </div>
        </div>
    )
}

export default Logo