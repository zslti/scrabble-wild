export let focusedElement: HTMLElement | null = null;

const excludedClasses = ['countdown']

function setFocusedElement(element: HTMLElement) {
    let isExcluded = false;
    excludedClasses.forEach((excludedClass) => {
        if(element.classList.contains(excludedClass)) {
            isExcluded = true;
            return;
        }
    });
    if(isExcluded) return;
    focusedElement = element;
    document.dispatchEvent(new CustomEvent('focusedElementChanged', { detail: element }));
}

document.addEventListener('focusin', (event) => {
    setFocusedElement(event.target as HTMLElement);
});

document.addEventListener('click', (event) => {
    setFocusedElement(event.target as HTMLElement);
});
