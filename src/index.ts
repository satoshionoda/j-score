import fetch from "cross-fetch";

type Option = [string, number, number | [number, number]];
const fs = require("fs-extra");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
//
const options: Option[] = [
  ["j1", 2021, 492],
  ["j1", 2020, 477],
  ["j1", 2019, 460],
  ["j1", 2018, 444],
  ["j1", 2017, 428],
  ["j1", 2016, [411, 412]],
  ["j1", 2015, [397, 398]],
  ["j1", 2014, 372],
  ["j2", 2021, 493],
  ["j2", 2020, 478],
  ["j2", 2019, 467],
  ["j2", 2018, 445],
  ["j2", 2017, 429],
  ["j2", 2016, 413],
  ["j2", 2015, 400],
  ["j2", 2014, 373],
  ["j3", 2021, 494],
  ["j3", 2020, 479],
  ["j3", 2019, 468],
  ["j3", 2018, 446],
  ["j3", 2017, 430],
  ["j3", 2016, 414],
  ["j3", 2015, 399],
  ["j3", 2014, 380],
];

const getData = async ([category, year, id]: Option): Promise<string> => {
  try {
    const urlBase = "https://data.j-league.or.jp/SFMS01/search";
    const query = makeQuery([category, year, id]);
    const res = await fetch(`${urlBase}?${query}`);
    const html = await res.text();
    const dom = new JSDOM(html);
    const matches: MatchData[] = parseMatches(dom.window.document);
    const dir = `${process.cwd()}/dist/`;
    await fs.ensureDir(dir);
    await fs.writeJSON(`${dir}/${makeFileName(category, year)}`, matches);
    sleep(1000);
    return `${category} ${year}`;
  } catch (e) {
    console.log(e);
  }
};
const makeQuery = ([category, year, id]: Option): string => {
  const q1 = `competition_years=${year}`;
  const q2 = `competition_frame_ids=${findCategoryNumber(category)}`;
  const q3 = !Array.isArray(id)
    ? `competition_ids=${id}`
    : `competition_ids=${id[0]}&competition_ids=${id[1]}`;
  const q4 = "tv_relay_station_name=";
  return [q1, q2, q3, q4].join("&");
};
const makeFileName = (category: string, year: number): string => {
  return `matches-${category}-${year}.json`;
};

const findCategoryNumber = (category): string => {
  switch (category) {
    case "j1":
      return "1";
    case "j2":
      return "2";
    case "j3":
      return "3";
    default:
      throw new Error("no category found");
  }
};

const parseMatches = (doc: HTMLDocument): MatchData[] => {
  const result: MatchData[] = [];
  doc.querySelectorAll(".search-table tbody tr").forEach((elm, i) => {
    const seriesCol = elm.querySelector("td:nth-child(3)");
    const series: number = findSeries(seriesCol.textContent);
    const homeCol = elm.querySelector("td:nth-child(6)");
    const homeTeam = homeCol.textContent.trim();
    const awayCol = elm.querySelector("td:nth-child(8)");
    const awayTeam = awayCol.textContent.trim();
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

const hasCache = async ([category, year, id]: Option): Promise<boolean> => {
  const path = `${process.cwd()}/cache/${makeFileName(category, year)}`;
  const result = await fs.pathExists(path);
  return result;
};
const copyFromCache = async ([category, year, id]: Option): Promise<string> => {
  const src = `${process.cwd()}/cache/${makeFileName(category, year)}`;
  const dir = `${process.cwd()}/dist/`;
  await fs.ensureDir(dir);
  await fs.copyFile(src, `${dir}${makeFileName(category, year)}`);
  return `${category} ${year}`;
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
  for (const option of options) {
    const _hasCache: boolean = await hasCache(option);
    if (_hasCache) {
      const result = await copyFromCache(option);
      console.log("from cache", result);
    } else {
      const result = await getData(option);
      console.log("loaded", result);
    }
  }
})();
