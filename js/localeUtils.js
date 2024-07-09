const languages = [
  'ar',
  'bg',
  'cs',
  'da',
  'de',
  'el',
  'en',
  'eo',
  'es',
  'et',
  'eu',
  'fi',
  'fr',
  'hu',
  'it',
  'ja',
  'ko',
  'lt',
  'nl',
  'no',
  'pl',
  'pt',
  'ro',
  'ru',
  'sk',
  'sv',
  'th',
  'uk',
  'zh'] //Available languages on website. To be updated when a new language is added in Transifex
const preferredBrowserLanguage = getPreferredBrowserLanguage();

//Check the preferred browser languages and see, if we have a translation for it
//Go through all preferred languages defined in the browser and take the first match. If no match - English will be loaded.
function getPreferredBrowserLanguage() {
  // console.log(navigator.languages);
  for (let i = 0; i < navigator.languages.length; i++) {
    const navigatorLanguage = navigator.languages[i].slice(0, 2); //Just keep the first 2 letters (e.g. en-US --> en)
    // console.log(navigatorLanguage);
    if (languages.indexOf(navigatorLanguage) !== -1) return navigatorLanguage;
  }
  return "en"; //if none of the preferred browser languages is available on our site go with default (English)
}

//Translate text
const languageFilePreferredLanguage = await loadLanguageFile(preferredBrowserLanguage); //Load language file of preferred browser language
const languageFileEN = await loadLanguageFile("en"); //Load fallback language (English)

async function loadLanguageFile(locale) {
  const linkToLanguageFile = "./locales/" + locale + ".json";
  const response = await fetch(linkToLanguageFile);
  const languageFile = await response.json();
  return languageFile;
}

//This function gets the translated string and all variables and returns the string with filled in vars.
//Taken from https://github.com/stefalda/react-localization/blob/master/src/LocalizedStrings.js and simplified. Thanks Stefano!
export function localeString(localeString, valuesForPlaceholders) {
  // console.log(locale);
  const translatedStringNoVarsFilledIn = languageFilePreferredLanguage[localeString] || languageFileEN[localeString];//load translation. If empty string --> fall back to English

  const placeholderRegex = /(\{[\d|\w]+\})/;
  const res = (translatedStringNoVarsFilledIn || '')
    .split(placeholderRegex) //Split string into text parts at {}, e.g. ['You have selected ', '{number}', ' out of ', '{total}', ' values']
    .filter(textPart => !!textPart) //Filter out empty strings in array of text parts
    .map((textPart) => {
      if (textPart.match(placeholderRegex)) { //Find words with { at beginning and } at the end
        const matchedKey = textPart.slice(1, -1);//Remove { and }
        const valueForPlaceholder = valuesForPlaceholders[matchedKey];
        if (valueForPlaceholder !== undefined) {
          return valueForPlaceholder;
        } else {
          // If value isn't found, then it must have been undefined/null
          return undefined;
        }
      }
      return textPart;
    });
  return res.join('');
}

//Translate countries
import { countryNames } from '../locales/countryNames.js';

export function localeCountry(countryToLookUpAlpha3) {
  countryToLookUpAlpha3 = countryToLookUpAlpha3.toLowerCase();//Change country code to lower case, e.g. TUN --> tun
  // console.log(countryToLookUpAlpha3);
  const countryToLookUpIndex = countryNames.findIndex(i => i.alpha3.toLocaleLowerCase() === countryToLookUpAlpha3);//Locate index of country in countryNames array
  // console.log(countryToLookUpIndex);
  // console.log(preferredBrowserLanguage);
  const countryName = countryNames[countryToLookUpIndex][preferredBrowserLanguage];//load country name in preferred language
  const countryNameFallback = countryNames[countryToLookUpIndex]["en"];//load English country name in case of countryName=undefined
  // console.log(countryName || countryNameFallback);
  return countryName || countryNameFallback; //return country name - if not available in preferred language then in EN
}