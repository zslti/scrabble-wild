interface Props{
    className?: string;
}

function Loader(props: Props) {
    return (
        <div className={`lds-facebook ${props.className}`}>
            <div className="container">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
    )
}

export default Loader