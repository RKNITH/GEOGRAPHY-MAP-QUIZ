import { localeString } from './localeUtils.js';
import { regions } from '../data/regions.js';

// const continents = ["africa", "asia", "america", "australia", "europe"];
let highscores = document.querySelector("#highscores");
let noHighscoreCounter = 0;

//Count the overall number of regions to play. If the noHighscoreCounter = overallNumberOfRegions --> no highscores in localstorage!
let overallNumberOfRegions = 0;
for (let i = 0; i < regions.length; i++) {
  for (let j = 0; j < regions[i].length; j++) {
    overallNumberOfRegions++;
  }
}

document.querySelector("#heading").innerText = localeString("highscore");

for (let i = 0; i < regions.length; i++) {
  for (let j = 0; j < regions[i].length; j++) {
    // console.log(regions[i][j]);
    const retrievedHighscoreFromLocalStorageJSON = localStorage.getItem(regions[i][j]);
    // console.log(retrievedHighscoreFromLocalStorageJSON);
    //Entry in localstorage found
    if (retrievedHighscoreFromLocalStorageJSON !== null) {
      let retrievedHighscoreFromLocalStorage = JSON.parse(retrievedHighscoreFromLocalStorageJSON);
      let tableHtml = `
    <table class="highscore-${regions[i][j]} table-container">
      <thead>
        <tr>
          <th colspan="3">${localeString(regions[i][j])}</th>
        </tr>
        <tr>
          <th><h1>${localeString("position")}</h1></th>
          <th><h1>${localeString("correctAnswers")}</h1></th>
          <th><h1>${localeString("timeNeeded")}</h1></th>
        </tr>
      </thead>
      <tbody>
  `;

      for (let i = 0; i < retrievedHighscoreFromLocalStorage.length; i++) {
        const timePlayed = retrievedHighscoreFromLocalStorage[i].timePlayed;
        const successRate = retrievedHighscoreFromLocalStorage[i].successRate;
        tableHtml += `<tr>`;
        tableHtml += `<td>${i + 1}</td>`;
        tableHtml += `<td>${Math.round(successRate * 100)}%</td>`;
        tableHtml += `<td>${timePlayed < 60 ? `${timePlayed}${localeString("secondsAbbr")}` : `${Math.floor(timePlayed / 60)}${localeString("minutesAbbr")} ${timePlayed % 60}${localeString("secondsAbbr")}`}</td>`;
        tableHtml += `</tr>`;
      }
      tableHtml += `
      </tbody>
    </table>
  `;
      highscores.insertAdjacentHTML("beforeend", tableHtml);
    } else noHighscoreCounter++
  }
}
if (noHighscoreCounter === overallNumberOfRegions) {
  highscores.innerText = localeString("highscoreNoGame");
}