export let timeDifference: number | null = null;

async function getTimeDifference(){
    if(timeDifference !== null) return timeDifference;
    try{
        const response = await fetch('http://worldtimeapi.org/api/ip');
        const data = await response.json();
        timeDifference = data.unixtime - Math.floor(Date.now() / 1000);
    }
    catch(e){
        getTimeDifference();
        return 0;
    }
    return timeDifference;
}

export async function getTime() {
    if(timeDifference === null) timeDifference = await getTimeDifference();
    const time = timeDifference * 1000;
    return time + Date.now();
}

export function getTimeSync(){
    const time = (timeDifference ?? 0) * 1000;
    return time + Date.now();
}