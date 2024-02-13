export let mousePosition = {x:0, y:0};

window.addEventListener('mousemove', (event) => {
  mousePosition = { x: event.clientX, y: event.clientY };
});