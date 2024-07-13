import { gsap, Expo } from 'gsap';
import isEqual from 'lodash.isequal';
import React from 'react'
import { getTime } from '../util/time';

interface Props {
    countingTo: number,
    digits?: number,
    onTimerEnd?: () => void,
    className?: string,
}

let timerEndTime = 0;

function Countdown(props: Props) {
    const [countdown, setCountdown] = React.useState(props.countingTo);

    const digits = props.digits ?? 4;

    gsap.defaults({ease: Expo.easeOut});

    var timerEl = document.querySelector('.timer');

    function initTimer(t: string) {
        timerEl = document.querySelector('.timer');
        let minutesGroupEl = timerEl?.querySelector('.minutes-group');
        let secondsGroupEl = timerEl?.querySelector('.seconds-group');

        let minutesGroup = {
            firstNum: minutesGroupEl?.querySelector('.first'),
            secondNum: minutesGroupEl?.querySelector('.second')
        },

        secondsGroup = {
            firstNum: secondsGroupEl?.querySelector('.first'),
            secondNum: secondsGroupEl?.querySelector('.second')
        };

        var time = {
            min: t.split(':')[0],
            sec: t.split(':')[1]
        };

        async function updateTimer() {
            var timestr;
            var date = new Date();

            date.setHours(0);

            let countdownSeconds = await getSecondsToCountdown();
            
            if(countdownSeconds <= 0) {
                updateTimerDisplay(['0','0','0','0']);
                return;
            }

            date.setMinutes(Math.floor(countdownSeconds / 60));
            date.setSeconds(countdownSeconds % 60);

            var newDate = new Date(date.valueOf() - 1000);
            var temp = newDate.toTimeString().split(" ");
            var tempsplit = temp[0].split(':');

            time.min = tempsplit[1];
            time.sec = tempsplit[2];

            timestr = time.min + time.sec;
            let timeNumbers: any[] = [];
            if(timestr.split != null) timeNumbers = timestr.split('');
            updateTimerDisplay(timeNumbers);

            if(timestr != '0000') setTimeout(updateTimer, 1000);
        }

        async function updateTimerDisplay(arr: any[]) {
            // initTimer("01:59");
            if(isEqual(arr, ['0','0','0','0'])) {
                timerEl?.parentElement?.parentElement?.classList.add('hidden');
                const now = await getTime();
                if(await getSecondsToCountdown() == 0 && now - timerEndTime > 10000) {
                    timerEndTime = now;
                    props.onTimerEnd?.();
                }
            }
            else timerEl?.parentElement?.parentElement?.classList.remove('hidden');
            animateNum(minutesGroup.firstNum, arr[0]);
            animateNum(minutesGroup.secondNum, arr[1]);
            animateNum(secondsGroup.firstNum, arr[2]);
            animateNum(secondsGroup.secondNum, arr[3]);
        }

        function animateNum(group: any, arrayValue: any) {
            if(group == null) return;
            gsap.killTweensOf(group.querySelector('.number-grp-wrp'));
            gsap.to(group.querySelector('.number-grp-wrp'), 1, {
                y: - group.querySelector('.num-' + arrayValue)?.offsetTop
            });
        }
        setTimeout(updateTimer, 1000);
    }
 
    const countdownElement = document.querySelector('.countdown');
    setInterval(() => {
        setCountdown(props.countingTo);
        if(countdownElement != null) {
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: 20,
            });
            countdownElement.dispatchEvent(event);
        }
    }, 1000);

    async function getSecondsToCountdown() {
        const now = await getTime();
        const difference = props.countingTo - now;
        return Math.floor(difference / 1000);
    }

    return (
        <div className={"countdown " + props.className} onClick={(e) => {initTimer("01:59")}} style={{width: `${140*digits}px`}}>
            <div style={{display: "none"}}>{countdown}</div>
            <div className="timer" style={{width: `${140*digits}px`}}>
                <div className="timer--clock">
                    <div className="minutes-group clock-display-grp">
                        <div className="first number-grp" style={{display: `${digits>=4?'auto':'none'}`}}>
                            <div className="number-grp-wrp">
                            <div className="num num-0"><p>0</p></div>
                            <div className="num num-1"><p>1</p></div>
                            <div className="num num-2"><p>2</p></div>
                            <div className="num num-3"><p>3</p></div>
                            <div className="num num-4"><p>4</p></div>
                            <div className="num num-5"><p>5</p></div>
                            <div className="num num-6"><p>6</p></div>
                            <div className="num num-7"><p>7</p></div>
                            <div className="num num-8"><p>8</p></div>
                            <div className="num num-9"><p>9</p></div>
                            </div>
                        </div>
                        <div className="second number-grp" style={{display: `${digits>=3?'auto':'none'}`}}>
                            <div className="number-grp-wrp">
                            <div className="num num-0"><p>0</p></div>
                            <div className="num num-1"><p>1</p></div>
                            <div className="num num-2"><p>2</p></div>
                            <div className="num num-3"><p>3</p></div>
                            <div className="num num-4"><p>4</p></div>
                            <div className="num num-5"><p>5</p></div>
                            <div className="num num-6"><p>6</p></div>
                            <div className="num num-7"><p>7</p></div>
                            <div className="num num-8"><p>8</p></div>
                            <div className="num num-9"><p>9</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="clock-separator" style={{display: `${digits>=3?'auto':'none'}`}}><p>:</p></div>
                    <div className="seconds-group clock-display-grp">
                        <div className="first number-grp" style={{marginLeft: "50px", display: `${digits>=2?'auto':'none'}`}}>
                            <div className="number-grp-wrp">
                            <div className="num num-0"><p>0</p></div>
                            <div className="num num-1"><p>1</p></div>
                            <div className="num num-2"><p>2</p></div>
                            <div className="num num-3"><p>3</p></div>
                            <div className="num num-4"><p>4</p></div>
                            <div className="num num-5"><p>5</p></div>
                            <div className="num num-6"><p>6</p></div>
                            <div className="num num-7"><p>7</p></div>
                            <div className="num num-8"><p>8</p></div>
                            <div className="num num-9"><p>9</p></div>
                            </div>
                        </div>
                        <div className="second number-grp" style={{display: `${digits>=1?'auto':'none'}`}}>
                            <div className="number-grp-wrp">
                            <div className="num num-0"><p>0</p></div>
                            <div className="num num-1"><p>1</p></div>
                            <div className="num num-2"><p>2</p></div>
                            <div className="num num-3"><p>3</p></div>
                            <div className="num num-4"><p>4</p></div>
                            <div className="num num-5"><p>5</p></div>
                            <div className="num num-6"><p>6</p></div>
                            <div className="num num-7"><p>7</p></div>
                            <div className="num num-8"><p>8</p></div>
                            <div className="num num-9"><p>9</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="fade-top"></div>
                    <div className="fade-bottom"></div>
                </div>
            </div>
        </div>
    )
}

export default Countdown