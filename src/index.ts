import fetch from "cross-fetch";

const fs = require("fs-extra");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
//
const url: [string, number, number | [number, number]][] = [
  ["j1", 2021, 492],
  ["j1", 2020, 477],
  ["j1", 2019, 460],
  ["j1", 2018, 444],
  ["j1", 2017, 428],
  ["j1", 2016, [411, 412]],
  ["j1", 2015, [397, 398]],
  ["j1", 2014, 372],
  ["j1", 2013, 347],
  ["j1", 2012, 322],
];

const getData = async (
  category: string,
  year: number,
  id: number | [number, number]
): Promise<string> => {
  try {
    const res = await fetch(
      !Array.isArray(id)
        ? `https://data.j-league.or.jp/SFMS01/search?competition_years=${year}&competition_frame_ids=1&competition_ids=${id}&tv_relay_station_name=`
        : `https://data.j-league.or.jp/SFMS01/search?competition_years=${year}&competition_frame_ids=1&competition_ids=${id[0]}&competition_ids=${id[1]}&tv_relay_station_name=`
    );
    const html = await res.text();
    const dom = new JSDOM(html);
    const matches: MatchData[] = parseMatches(dom.window.document);
    const dir = `${process.cwd()}/dist/`;
    await fs.ensureDir(dir);
    await fs.writeJSON(`${dir}/matches-${category}-${year}.json`, matches);
    sleep(1000);
    return `${category} ${year}`;
  } catch (e) {
    console.log(e);
  }
};

const parseMatches = (doc: HTMLDocument): MatchData[] => {
  const result: MatchData[] = [];
  doc.querySelectorAll(".search-table tbody tr").forEach((elm, i) => {
    const seriesCol = elm.querySelector("td:nth-child(3)");
    const series: number = findSeries(seriesCol.textContent);
    const homeCol = elm.querySelector("td:nth-child(6) a");
    const homeTeam = homeCol.textContent;
    const awayCol = elm.querySelector("td:nth-child(8) a");
    const awayTeam = awayCol.textContent;
    const scoreCol = elm.querySelector("td:nth-child(7)");
    const score: [number, number] = separateScore(scoreCol.textContent);
    const [homeScore, awayScore] = score ? score : [null, null];
    const yearCol = elm.querySelector("td:nth-child(1)");
    const dateCol = elm.querySelector("td:nth-child(4)");
    const date = `${yearCol.textContent}-${parseDate(dateCol.textContent)}`;

    result.push({
      series,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      date,
    });
  });
  return result.sort((a, b) => a.series - b.series);
};

const parseDate = (str: string): string => {
  const found = /(\d+)\/(\d+)/.exec(str);
  return found ? `${found[1]}-${found[2]}` : "";
};

const separateScore = (str: string): [number, number] => {
  const found = /(.*)-(.*)/.exec(str);
  return found ? [parseInt(found[1]), parseInt(found[2])] : null;
};

const findSeries = (str: string): number => {
  const half = toHalfWidth(str);
  const found = /第(.*)節/.exec(half);
  return found ? parseInt(found[1]) : null;
};

const toHalfWidth = (input: string): string => {
  return input.replace(/[！-～]/g, function (input) {
    return String.fromCharCode(input.charCodeAt(0) - 0xfee0);
  });
};

const sleep = (ms: number): Promise<null> => {
  return new Promise<null>((resolve) => setTimeout(resolve, ms));
};

export const __TEST__ = { findSeries, separateScore, parseDate };

export type MatchData = {
  series: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
};

// main loop
(async () => {
  for (const [category, year, id] of url) {
    const result = await getData(category, year, id);
    console.log("loaded", result);
  }
})();
