import fetch from "cross-fetch";
import { makeRankingData, RankInfo } from "./process-data";

const fs = require("fs-extra");
const jsdom = require("jsdom");
const path = require("path");
const { JSDOM } = jsdom;
type Option = [string, number];
//
const options: Option[] = [];
for (let i = 1993; i <= 2021; i++) {
  options.push(["j1", i]);
  i >= 1999 ? options.push(["j2", i]) : "";
  i >= 2014 ? options.push(["j3", i]) : "";
}

const makeData = async () => {
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
};

const getData = async ([category, year]: Option): Promise<string> => {
  try {
    const urlBase = "https://data.j-league.or.jp/SFMS01/search";
    const query = makeQuery([category, year]);
    const res = await fetch(`${urlBase}?${query}`);
    const html = await res.text();
    const dom = new JSDOM(html);
    const matches: MatchData[] = parseMatches(dom.window.document);
    const dir = path.join(process.cwd(), "dist");
    await fs.ensureDir(dir);
    await fs.writeJSON(`${dir}/${makeFileName(category, year)}`, matches);
    sleep(1000);
    return `${category} ${year}`;
  } catch (e) {
    console.log(e);
  }
};
const makeQuery = ([category, year]: Option): string => {
  const q1 = `competition_years=${year}`;
  const q2 = `competition_frame_ids=${findCategoryNumber(category)}`;
  const q3 = "tv_relay_station_name=";
  return [q1, q2, q3].join("&");
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

const hasCache = async ([category, year]: Option): Promise<boolean> => {
  const cachePath = path.join(
    process.cwd(),
    "cache",
    makeFileName(category, year)
  );
  const result = await fs.pathExists(cachePath);
  return result;
};
const copyFromCache = async ([category, year]: Option): Promise<string> => {
  const src = path.join(process.cwd(), "cache", makeFileName(category, year));
  const dir = path.join(process.cwd(), "dist");
  await fs.ensureDir(dir);
  await fs.copyFile(src, path.join(dir, makeFileName(category, year)));
  return `${category} ${year}`;
};

const makeAllYearData = async () => {
  const result: RankInfo[][][] = [];
  const categories = ["j1", "j2", "j3"];
  for (let i = 1993; i < 2021; i++) {
    const yearData: RankInfo[][] = [];
    categories.forEach((category) => {
      const year = i;
      const jsonPath = path.join(
        process.cwd(),
        "dist",
        `matches-${category}-${year}.json`
      );
      if (fs.existsSync(jsonPath)) {
        const rawData = JSON.parse(fs.readFileSync(jsonPath).toString());
        const ranking = makeRankingData(rawData, year);
        yearData.push(ranking);
      }
    });
    result.push(yearData);
  }
  await fs.writeJSON(path.join(process.cwd(), "dist", "rankings.json"), result);
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

(async () => {
  await makeData();
  await makeAllYearData();
})();
