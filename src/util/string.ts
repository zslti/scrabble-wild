export function getRandomLetterFromString(str: string) {
    const index = Math.floor(Math.random() * str.length);
    return str[index];
}

export function getCharArrayFromString(str: string) {
    let arr: string[] = [];
    for(let i = 0; i < str.length; i++) {
        arr.push(str[i]);
    }
    return arr;
}

export function isValidJSON(str: string) {
    try{
        JSON.parse(str);
    } catch(e) {
        return false;
    }
    return true;
}

export function toFirstLetterUppercase(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function firstChars(str: string, n: number, trailing: string = '...') {
    if(str.length <= n) return str;
    return str.slice(0, n) + trailing;
}