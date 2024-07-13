import { initializeApp } from "firebase/app";
import { addDoc, getDoc, getDocs, getFirestore, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { collection } from "firebase/firestore";
import { getMachineID } from "./machineID";
import { TileData, getStartingTileMatrix, getTileID } from "../components/tile";
import { getTime } from "./time";
import { startingLetters } from "./scoring";
import { getRandomLetterFromString } from "./string";

const firebaseConfig = {
    // your firebase data
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

export interface PlayerData {
    role: string,
    isReady: boolean,
    isInactive: boolean,
    letters: string,
    points: number,
}

export interface LobbySettings {
    boardSize: number,
    roundTime: number,
    language: string,
    layout: string,
    multiplier?: number,
}

interface LobbyAlert {
    player: string,
    points: string,
    words: string[],
    time: number,
}

export interface Lobby {
    name: string,
    players: string[],
    lastInteraction: number,
    isPublic: boolean,
    password: string,
    host: string,
    isStarted: boolean,
    startedAt: number,
    currentRoundStartedAt: number,
    playerData: {[key: string]: PlayerData},
    settings: LobbySettings,
    tiles: string,
    editedTiles: string[],
    remainingLetters: string,
    round: number,
    alert: LobbyAlert | null,
    wasFirstWordPlaced: boolean,
}

export function createLobby(lobby: Lobby) {
    const ref = collection(firestore, "lobbies");
    addDoc(ref, lobby).then(async (docRef) => {
        const myLobby = localStorage.getItem("myLobby");
        if(myLobby != null) await deleteLobby(myLobby);            
        if(localStorage.getItem("currentLobby") != null) {
            const currentLobby = localStorage.getItem("currentLobby")?.split(" ");
            if(currentLobby != null) await leaveLobby(currentLobby[0], currentLobby[1]);
        }
        localStorage.setItem("myLobby", docRef.id);
        localStorage.setItem("currentLobby", `${docRef.id} ${lobby.host}`);
        localStorage.setItem("authLobby", `${docRef.id} ${await getTime()}`);
        if(window.location.href.includes("github.io")) window.location.href = "lobby/" + docRef.id;
        else window.location.href = "scrabblewild/lobby/" + docRef.id;
    }).catch();
}

export async function getLobbies() {
    const ref = collection(firestore, "lobbies");
    const querySnapshot = await getDocs(ref);
    let lobbies: Lobby[] = [];
    querySnapshot.forEach((doc) => {
        lobbies.push(doc.data() as Lobby);
    });
    return lobbies;
}

export async function getNonStartedLobbies() {
    const ref = collection(firestore, "lobbies");
    const querySnapshot = await getDocs(ref);
    let lobbies: Lobby[] = [];
    querySnapshot.forEach((doc) => {
        lobbies.push(doc.data() as Lobby);
    });
    let nonStartedLobbies: Lobby[] = [];
    for(let i = 0; i < lobbies.length; i++) {
        if(!lobbies[i].isStarted) nonStartedLobbies.push(lobbies[i]);
    }
    return nonStartedLobbies;
}

export async function getLobby(lobbyID: string) {
    const ref = collection(firestore, "lobbies");
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) return docSnap.data() as Lobby;
    return null;
}

export async function getLobbyID(lobby: Lobby) {
    const ref = collection(firestore, "lobbies");
    const querySnapshot = await getDocs(ref);
    let lobbies: Lobby[] = [];
    querySnapshot.forEach((doc) => {
        lobbies.push(doc.data() as Lobby);
    });
    for(let i = 0; i < lobbies.length; i++) {
        if(lobbies[i].name == lobby.name && lobbies[i].host == lobby.host) {
            return querySnapshot.docs[i].id;
        }
    }
    return "";
}

async function deleteLobby(lobbyID: string) {
    const ref = collection(firestore, "lobbies");
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) deleteDoc(doc(ref, lobbyID));
}

async function deleteInvalidLobbies() {
    let ref = collection(firestore, "lobbies");
    let availableLobbies: string[] = [];
    getDocs(ref).then((querySnapshot) => {
        querySnapshot.forEach(async (doc) => {
            const lobby = doc.data() as Lobby;
            if(await getTime() - lobby.lastInteraction > 3600000 || lobby.players.length == 0) {
                deleteLobby(doc.id);
            } else {
                availableLobbies.push(doc.id);
            }
        });
    });

    const ref2 = collection(firestore, "statuses");
    getDocs(ref2).then((querySnapshot) => {
        querySnapshot.forEach((document) => {
            if(!availableLobbies.includes(document.id)) {
                deleteDoc(doc(ref2, document.id));
            }
        });
    });

    const ref3 = collection(firestore, "kicks");
    getDocs(ref3).then((querySnapshot) => {
        querySnapshot.forEach((document) => {
            if(!availableLobbies.includes(document.id.split(":")[0])) {
                deleteDoc(doc(ref3, document.id));
            }
        });
    });
}      

deleteInvalidLobbies();
setInterval(deleteInvalidLobbies, 300000);

export async function joinLobby(lobbyID: string, nickname: string) {
    const ref = collection(firestore, "lobbies");
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) {
        if(localStorage.getItem("currentLobby") != null) {
            const currentLobby = localStorage.getItem("currentLobby")?.split(" ");
            if(currentLobby != null) await leaveLobby(currentLobby[0], currentLobby[1]);
        }
        const lobby = await getLobby(lobbyID);        
        lobby!.players.push(nickname);
        lobby!.lastInteraction = await getTime();
        lobby!.playerData[nickname] = {
            role: await getPlayerRole(),
            isReady: false, 
            isInactive: false,
            points: 0,
        } as PlayerData;
        localStorage.setItem("currentLobby", `${lobbyID} ${nickname}`);
        localStorage.setItem("authLobby", `${lobbyID} ${await getTime()}`);
        updateDoc(doc(ref, lobbyID), JSON.parse(JSON.stringify(lobby)));
    }
}

export async function leaveLobby(lobbyID: string, nickname: string) {
    const ref = collection(firestore, "lobbies");
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) {
        const lobby = docSnap.data() as Lobby;
        const index = lobby.players.indexOf(nickname);
        if(index > -1) lobby.players.splice(index, 1);
        updateDoc(doc(ref, lobbyID), JSON.parse(JSON.stringify(lobby)));
    }
}

interface Status {
    players: {[key: string]: {lastOnline: number}};
}

async function updatePlayerStatus() {
    const url = window.location.href;
    if(!url.includes("lobby") || localStorage.getItem("currentLobby") == null) return;
    const lobbyID = localStorage.getItem("currentLobby")?.split(" ")[0] as string;
    if(!url.endsWith(lobbyID) && !url.endsWith(lobbyID + '/')) return;
    const ref = collection(firestore, "statuses");
    const nickname = localStorage.getItem("currentLobby")?.split(" ")[1] as string;
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) {
        let status = docSnap.data() as Status;
        status.players[nickname] = {lastOnline: await getTime()};
        updateDoc(doc(ref, lobbyID), JSON.parse(JSON.stringify(status)));
    } else{
        setDoc(doc(firestore, "statuses", lobbyID), {players: {[nickname]: {lastOnline: await getTime()}}});
    }
    setPlayerInactive(lobbyID, nickname, false);
}

setInterval(updatePlayerStatus, 5000);

function kickInactivePlayers() {
    const url = window.location.href;
    if(!url.includes("lobby")) return;
    const ref = collection(firestore, "statuses");
    getDocs(ref).then((querySnapshot) => {
        querySnapshot.forEach(async (doc) => {
            const lobbyID = doc.id;
            const status = doc.data() as Status;
            if(await isLobbyStarted(lobbyID)) return;
            for(let player in status.players) {
                if(await getTime() - status.players[player].lastOnline > 30000) {
                    // leaveLobby(lobbyID, player);
                    // kickPlayer(lobbyID, player, "You have been kicked due to inactivity.");
                    setPlayerInactive(lobbyID, player, true);
                } else {
                    setPlayerInactive(lobbyID, player, false);
                }
            }
        });
    });
}

kickInactivePlayers();
setInterval(kickInactivePlayers, 30000);

export interface Kick {
    reason: string;
    time: number;
}

export async function kickPlayer(lobbyID: string, name: string, reason: string) {
    leaveLobby(lobbyID, name);
    const ref = collection(firestore, "kicks");
    setDoc(doc(ref, `${lobbyID}:${name}`), {reason: reason, time: await getTime()});
}

export async function checkPlayerKicked(lobbyID: string, name: string) {
    const ref = collection(firestore, "kicks");
    const docSnap = await getDoc(doc(ref, `${lobbyID}:${name}`));
    if(docSnap.exists()) {
        const kick = docSnap.data() as Kick;
        deleteDoc(doc(ref, `${lobbyID}:${name}`));
        if(await getTime() - kick.time > 30000) return;
        localStorage.removeItem("currentLobby");
        localStorage.removeItem("authLobby");
        localStorage.setItem("kick", kick.reason);
        document.location.href = "/scrabblewild";
    }
}

async function isLobbyStarted(lobbyID: string) {
    const ref = collection(firestore, "lobbies");
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) {
        const lobby = docSnap.data() as Lobby;
        return lobby.isStarted;
    }
    return false;
}

export async function getPlayerRole() {
    const machineID = getMachineID();
    const ref = collection(firestore, "playerRoles");
    const docSnap = await getDoc(doc(ref, machineID));
    if(docSnap.exists()) return docSnap.data().role;
    return "";
}

async function setPlayerInactive(lobbyID: string, name: string, isInactive: boolean) {
    const ref = collection(firestore, "lobbies");
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) {
        const lobby = docSnap.data() as Lobby;
        if(lobby.playerData[name].isInactive != isInactive) {
            lobby.playerData[name].isInactive = isInactive;
            await setDoc(doc(ref, lobbyID), lobby);
        }
    }
}

export function toggleReady(lobbyID: string, name: string) {
    const ref = collection(firestore, "lobbies");
    getDoc(doc(ref, lobbyID)).then((docSnap) => {
        if(docSnap.exists()) {
            const lobby = docSnap.data() as Lobby;
            lobby.playerData[name].isReady = !lobby.playerData[name].isReady;
            updateDoc(doc(ref, lobbyID), JSON.parse(JSON.stringify(lobby)));
        }
    });
}

export async function startLobby(lobbyID: string) {
    const ref = collection(firestore, "lobbies");
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) {
        let lobby = docSnap.data() as Lobby;
        lobby.isStarted = true;
        lobby.startedAt = lobby.currentRoundStartedAt = lobby.lastInteraction = await getTime();
        lobby.tiles = JSON.stringify(getStartingTileMatrix(lobby.settings.boardSize, lobby.settings.layout, lobby.settings.multiplier ?? 1));
        lobby.remainingLetters = startingLetters[lobby.settings.language as keyof typeof startingLetters];
        lobby.players.forEach((player) => {
            lobby.playerData[player].letters = "";
            for(let i = 0; i < 7; i++) {
                const letter = getRandomLetterFromString(lobby.remainingLetters);
                lobby.playerData[player].letters += letter;
                lobby.remainingLetters = lobby.remainingLetters.replace(letter, "");
            }
        });
        updateDoc(doc(ref, lobbyID), JSON.parse(JSON.stringify(lobby)));
    }
}

export function setLobby(lobbyID: string, lobbyData: Lobby) {
    const ref = collection(firestore, "lobbies");
    setDoc(doc(ref, lobbyID), lobbyData);
}

let lastLobbyFinishTime = 0;

export async function finishRound(lobbyID: string, tileChanges: Map<string, TileData>, username: string, points: number, words: string[] = []) {
    const now = await getTime();
    if(now - lastLobbyFinishTime < 1000) return;
    lastLobbyFinishTime = now;
    const ref = collection(firestore, "lobbies");
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) {
        let lobby = docSnap.data() as Lobby;
        lobby.round++;
        lobby.lastInteraction = lobby.currentRoundStartedAt = now;
        lobby.wasFirstWordPlaced = lobby.wasFirstWordPlaced || points > 0;
        if(lobby.round > 0) {
            let tileData = JSON.parse(lobby.tiles) as TileData[][];
            let currentLetters = lobby.playerData[username].letters;
            tileChanges.forEach((tile) => {
                tileData[tile.row][tile.column] = tile;
                const letter = getRandomLetterFromString(lobby.remainingLetters);
                currentLetters = currentLetters.replace(tile.letter ?? " ", letter);
                lobby.remainingLetters = lobby.remainingLetters.replace(letter, "");
            });
            lobby.tiles = JSON.stringify(tileData);
            lobby.playerData[username].letters = currentLetters;
            const newPoints = (lobby.playerData[username].points ?? 0) + points;
            if(newPoints != null) {
                lobby.playerData[username].points = newPoints;
                lobby.alert = {
                    player: username,
                    points: points.toString(),
                    words: words,
                    time: now,
                };
            }
        }
        updateDoc(doc(ref, lobbyID), JSON.parse(JSON.stringify(lobby)));
    }
}

export async function setEditedTiles(lobbyID: string, tileChanges: Map<string, TileData>) {
    const ref = collection(firestore, "lobbies");
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) {
        let lobby = docSnap.data() as Lobby;
        let editedTiles = [] as string[];
        tileChanges.forEach((tile) => {
            editedTiles.push(getTileID(tile.row, tile.column));
        });
        lobby.editedTiles = editedTiles;
        updateDoc(doc(ref, lobbyID), JSON.parse(JSON.stringify(lobby)));
    }
}

// this can be used for changing letters - unite with the function below
// export async function shuffleLetters(lobbyID: string, username: string) {
//     const ref = collection(firestore, "lobbies");
//     const docSnap = await getDoc(doc(ref, lobbyID));
//     if(docSnap.exists()) {
//         let lobby = docSnap.data() as Lobby;
//         let currentLetters = lobby.playerData[username].letters;
//         let newLetters = "";
//         for(let i = 0; i < currentLetters.length; i++) {
//             const letter = getRandomLetterFromString(lobby.remainingLetters);
//             newLetters += letter;
//             lobby.remainingLetters = lobby.remainingLetters.replace(letter, "");
//         }
//         lobby.playerData[username].letters = newLetters;
//         updateDoc(doc(ref, lobbyID), JSON.parse(JSON.stringify(lobby)));
//     }
// }

export enum ShuffleType {
    shuffle,
    exchange,
}

export async function shuffleLetters(lobbyID: string, username: string, type: ShuffleType = ShuffleType.shuffle) {
    const ref = collection(firestore, "lobbies");
    const docSnap = await getDoc(doc(ref, lobbyID));
    if(docSnap.exists()) {
        let lobby = docSnap.data() as Lobby;
        let currentLetters = lobby.playerData[username].letters;
        let newLetters = "";
        const l = currentLetters.length;
        if(type == ShuffleType.shuffle) {
            for(let i = 0; i < l; i++) {
                const letter = getRandomLetterFromString(currentLetters);
                newLetters += letter;
                currentLetters = currentLetters.replace(letter, "");
            }
        } else {
            for(let i = 0; i < l; i++) {
                const letter = getRandomLetterFromString(lobby.remainingLetters);
                newLetters += letter;
                lobby.remainingLetters = lobby.remainingLetters.replace(letter, "");
            }
        }
        lobby.playerData[username].letters = newLetters;
        updateDoc(doc(ref, lobbyID), JSON.parse(JSON.stringify(lobby)));
    }
    if(type == ShuffleType.exchange) finishRound(lobbyID, new Map(), username, 0);
}