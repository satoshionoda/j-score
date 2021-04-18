import { __TEST__ } from "./index";

describe("findSeries", () => {
  const findSeries = __TEST__.findSeries;
  test("it should work", () => {
    const result = findSeries("第２節第１日");
    expect(result).toBe(2);
  });
  test("it should return null when not found", () => {
    const result = findSeries("第第１日");
    expect(result).toBe(null);
  });
});

describe("separateScore", () => {
  const separateScore = __TEST__.separateScore;
  test("it should work", () => {
    const result = separateScore("13-1");
    expect(result[0]).toBe(13);
    expect(result[1]).toBe(1);
  });
  test("it should return null when not found", () => {
    const result = separateScore("未定");
    expect(result).toBe(null);
  });
});

describe("parseDate", () => {
  const parseDate = __TEST__.parseDate;
  test("it should work", () => {
    const result1 = parseDate("02/27(土)");
    expect(result1).toBe("02-27");

    const result2 = parseDate("05/04(火・祝)");
    expect(result2).toBe("05-04");
  });
  test("it should return empty string when not found", () => {
    const result = parseDate("");
    expect(result).toBe("");
  });
});
