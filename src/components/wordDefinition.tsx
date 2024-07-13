import React from 'react'
import ReactDOM from 'react-dom';
import { getWordDefinition, words } from '../util/words';
import AnimatedAppear from './animatedAppear';
import { toFirstLetterUppercase } from '../util/string';

interface Props {
    word: string,
    language: keyof typeof words,
    position: {x: number, y: number},
    className?: string,
}

export function createWordDefinitionOverlay(props: Props) {
    const overlay = React.createElement(WordDefinition, {...props});
    ReactDOM.render(overlay, document.getElementById('definiton-overlay-placeholder'));
    setTimeout(() => {
      const overlay = document.querySelector('.definition-overlay');
      overlay?.classList.add('active')
    }, 10);
}

export function removeWordDefinitionOverlay() {
    const overlay = document.querySelector('.definition-overlay');
    overlay?.classList.remove('active')
    setTimeout(() => {
        ReactDOM.unmountComponentAtNode(document.getElementById('definiton-overlay-placeholder')!);
    }, 400);
}

function WordDefinition(props: Props) {
    const [definition, setDefinition] = React.useState<Map<string, string>>(new Map());
    const [word, setWord] = React.useState(props.word);
    const [isExpanded, setIsExpanded] = React.useState(false);

    async function updateWordDefinition() {
        if(definition.size == 0) {
            const def = await getWordDefinition(props.word, props.language);
            if(def) {
                setDefinition(def.definition);
                setWord(def.word);
            } else setDefinition(new Map([['error', 'The definition for this word is not available']]));
        }
    }

    React.useEffect(() => {
        updateWordDefinition();
    }, [])

    return (
        <div className={"definition-overlay " + props.className} onClick={(e) => {
            const target = e.target as HTMLElement;
            if(target.classList.contains('definition-overlay')) {
                removeWordDefinitionOverlay();
                target.classList.remove('active');
            }
        }}>
            <div className="definition-overlay-panel" style={{left: `calc(${props.position.x}px + 1rem)`, top: `calc(${props.position.y}px + 1rem)`}}>
                <div id='definition-height-helper' style={{position: 'absolute', opacity: '0', pointerEvents: 'none'}}>{
                    Array.from(definition).map((def, index) => {  
                        if(def[0] == 'error') return <div 
                            className="definition-overlay-definition" 
                            style={{
                                color: "#a5a5a566", 
                                position: "absolute", 
                                left: "50%", 
                                transform: "translateX(-50%)", 
                                whiteSpace: "nowrap", 
                                paddingRight: "1.5rem", 
                                marginTop: "1rem"
                            }}>{def[1]}</div>
                        return <div className="definition-overlay-definition"><span style={{color: "#9500ff"}}>{def[0]}</span>: {def[1]}</div>
                    })
                }</div>
                <div className="overlay-title" style={{pointerEvents: "none"}}>{toFirstLetterUppercase(word)}</div>
                <div className="overlay-subtext" style={{pointerEvents: "none"}}>Definition</div>
                <AnimatedAppear 
                    isVisible={definition.size == 0} 
                    height='2rem' 
                    childComponent={<div 
                        className='center-items' 
                        style={{height: "2rem"}}>
                        <i className={`fa-solid fa-circle-notch no-margin white ${definition.size != 0?'hidden':''}`}></i>
                    </div>}/>
                <AnimatedAppear 
                    isVisible={definition.size != 0} 
                    height={isExpanded?`max(6rem, ${(document.getElementById("definition-height-helper")?.clientHeight ?? 0) + 20}px)`:'3rem'} 
                    childComponent={<div style={{position: 'relative', zIndex: '100000 !important'}}>{
                        Array.from(definition).map((def, index) => {  
                            if(!isExpanded && index != 0) return <></>;
                            if(def[0] == 'error') return <div 
                                className="definition-overlay-definition" 
                                style={{
                                    color: "#a5a5a566", 
                                    position: "absolute", 
                                    left: "50%", 
                                    transform: "translateX(-50%)", 
                                    whiteSpace: "nowrap",
                                    paddingRight: "1.5rem", 
                                    marginTop: "1rem"
                                }}>{def[1]}</div>
                            return <div className="definition-overlay-definition"><span style={{color: "#9500ff"}}>{def[0]}</span>: {def[1]}</div>
                        })
                    }</div>}
                />
                <div className="definition-button-container">
                    <div 
                        className={`definition-expand-button ${(isExpanded || definition.size <= 1)?'hidden':''}`} 
                        onClick={(e) => setIsExpanded(true)}>
                        Show more
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WordDefinition