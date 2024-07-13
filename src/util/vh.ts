function updateVh() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
export function addVhListener() {
    window.addEventListener('resize', updateVh);
}