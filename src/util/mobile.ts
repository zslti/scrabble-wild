export function isMobile() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];
    
    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}

export function isMobilePortrait() {
    return window.innerWidth < window.innerHeight && isMobile();
}

export function isMobileLandscape() {
    return window.innerWidth > window.innerHeight && isMobile();
}