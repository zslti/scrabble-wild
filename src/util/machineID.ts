export function getMachineID() {
    let machineID = localStorage.getItem('machineID');
    if(!machineID) {
        machineID = crypto.randomUUID();
        localStorage.setItem('machineID', machineID);
    }
    return machineID;
}