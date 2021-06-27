import { __TEST__, MatchData } from "./process-data";

describe("getMatchPoint", () => {
  const getMatchPoint = __TEST__.getMatchPoint;
  test("it should work when home team wind", () => {
    const match: MatchData = {
      series: 1,
      homeTeam: "A",
      awayTeam: "B",
      homeScore: 13,
      awayScore: 1,
      date: "",
    };
    const resultA = getMatchPoint(match, "A");
    expect(resultA).toBe(3);
    const resultB = getMatchPoint(match, "B");
    expect(resultB).toBe(0);
  });
  test("it should work when away team wins", () => {
    const match: MatchData = {
      series: 1,
      homeTeam: "A",
      awayTeam: "B",
      homeScore: 1,
      awayScore: 2,
      date: "",
    };
    const resultA = getMatchPoint(match, "A");
    expect(resultA).toBe(0);
    const resultB = getMatchPoint(match, "B");
    expect(resultB).toBe(3);
  });
  test("it should work when draw", () => {
    const match: MatchData = {
      series: 1,
      homeTeam: "A",
      awayTeam: "B",
      homeScore: 3,
      awayScore: 3,
      date: "",
    };
    const resultA = getMatchPoint(match, "A");
    expect(resultA).toBe(1);
    const resultB = getMatchPoint(match, "B");
    expect(resultB).toBe(1);
  });
});
