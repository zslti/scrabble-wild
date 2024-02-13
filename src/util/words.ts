import { json } from "stream/consumers";
import { letterScores } from "./scoring";

export async function getWordDefinition(word: string, language: keyof typeof words){
    // const url = `https://dictionary-by-api-ninjas.p.rapidapi.com/v1/dictionary?word=${word}`;
    // const options = {
    //     method: 'GET',
    //     headers: {
    //         'X-RapidAPI-Key': '332dfaf5aamsh67110e972cc4e82p176ee8jsnc8b2962d1862',
    //         'X-RapidAPI-Host': 'dictionary-by-api-ninjas.p.rapidapi.com'
    //     }
    // }; //megy csak fos

    if(language != 'en'){
        word = await translateText(word, language, 'en') ?? '';
    }

    const url = `https://dictionary-data-api.p.rapidapi.com/definition/${word}`;
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '332dfaf5aamsh67110e972cc4e82p176ee8jsnc8b2962d1862',
            'X-RapidAPI-Host': 'dictionary-data-api.p.rapidapi.com'
        }
    };
    
    try {
        const response = await fetch(url, options);
        const result = await response.text();
        const json = JSON.parse(result);
        let definition = new Map<string, string>();
        json.meaning.forEach((element: any) => {
            definition.set(element.tag, element.values[0]);
        });
        return {'definition': definition, 'word': word};
    } catch (error) {
        return null;
    }
}

async function translateText(text: string, from: string, to: string){
    const url = 'https://deep-translate1.p.rapidapi.com/language/translate/v2';
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': '332dfaf5aamsh67110e972cc4e82p176ee8jsnc8b2962d1862',
            'X-RapidAPI-Host': 'deep-translate1.p.rapidapi.com'
        },
        body: JSON.stringify({
            q: text,
            source: from,
            target: to,
        })
    };

    try {
        const response = await fetch(url, options);
        const result = await response.text();
        const json = JSON.parse(result);
        const word: string = json.data.translations.translatedText;
        return word.toLowerCase();
    } catch (error) {
        return null;
    }
}

export const words = {
    'en': new Map(Object.entries(require('./words/en.json'))) as Map<string, boolean>,
    'hu': new Map(Object.entries(require('./words/hu.json'))) as Map<string, boolean>,
};

let cachedWords: Map<keyof typeof words, Map<string, boolean>[]> = new Map();
cachedWords.set('en', []);
cachedWords.set('hu', []);

export function isValidWord(word: string, language: keyof typeof words){
    const cachedWordList = cachedWords.get(language) ?? [];
    if(cachedWordList.some(wordList => (wordList.has(word) && wordList.get(word) == true))){
        return true;
    } else if(cachedWordList.some(wordList => (wordList.has(word) && wordList.get(word) == false))){
        return false;
    }
    const isValid = words[language].get(fillInBlankLetters(word, language)) !== undefined;
    cachedWords.get(language)?.push(new Map([[word, isValid]]));
    return isValid;
}

export function fillInBlankLetters(word: string, language: keyof typeof words){
    const wordList = words[language];
    for(let i = 0; i < word.length; i++){
        if(word[i] == '*'){
            const validLetters = Object.keys(letterScores[language]);
            validLetters.forEach(letter => {
                const newWord = word.replace('*', letter);
                if(wordList.has(newWord)){
                    word = newWord;
                }
            });
        }
    }
    return word;
}

export function removeLetters(str: string, remove: string){
    let newStr = str;
    remove.split('').forEach(letter => {
        newStr = newStr.replace(letter, '');
    });
    return newStr;
}