import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mapMovie, mapTv, mapSearch, mapGenres, posterUrl, hoursFor, formatRuntime, seriesStatus, pickCountry, slugFor } from "../src/lib/tmdb-core.ts";

const fx = (n: string) => JSON.parse(readFileSync(new URL(`./fixtures/${n}.json`, import.meta.url), "utf8"));

test("tmdb: movies map to catalogue rows", () => {
  const m = mapMovie(fx("tmdb-movie"), (c) => ["MY", "SG"].includes(c));
  assert.equal(m.slug, "tiger-stripes-2023");
  assert.equal(m.kind, "film");
  assert.equal(m.country, "MY");
  assert.equal(m.director, "Amanda Nell Eu");
  assert.equal(m.genres, "Drama,Horror,Fantasy");
  assert.equal(m.motif, "👻");
  assert.equal(m.runtime, 95);
  assert.equal(m.original_title, null, "same as title");
  assert.equal(m.imdb_id, "tt14895576");
  assert.equal(m.cast_names, "Zafreen Zairizal, Deena Ezral, Piqa");
});

test("tmdb: series map with episodes, seasons and status", () => {
  const t = mapTv(fx("tmdb-tv"));
  assert.equal(t.kind, "series");
  assert.equal(t.original_title, "오징어 게임");
  assert.equal(t.runtime, 60, "falls back to the last episode's runtime");
  assert.equal(t.episodes, 22);
  assert.equal(t.seasons, 3);
  assert.equal(t.status, "ended");
  assert.equal(t.director, "Hwang Dong-hyuk");
  assert.deepEqual(t.genres.split(","), ["Action", "Mystery", "Drama"]);
  assert.equal(seriesStatus("Returning Series", "Scripted"), "ongoing");
  assert.equal(seriesStatus("Ended", "Miniseries"), "limited");
});

test("tmdb: search keeps films and series only", () => {
  const hits = mapSearch(fx("tmdb-search").results);
  assert.equal(hits.length, 2);
  assert.equal(hits[0].original_title, "기생충");
  assert.equal(hits[1].kind, "series");
  assert.equal(hits[1].year, 2021);
});

test("tmdb: helpers", () => {
  assert.deepEqual(mapGenres(["TV Movie"]), ["Drama"], "never empty");
  assert.deepEqual(mapGenres(["Sci-Fi & Fantasy", "Science Fiction"]), ["Sci-Fi", "Fantasy"]);
  assert.equal(posterUrl("/abc.jpg", "w185"), "https://image.tmdb.org/t/p/w185/abc.jpg");
  assert.equal(posterUrl("../../evil"), null, "only plain TMDB paths");
  assert.equal(posterUrl(null), null);
  assert.equal(pickCountry(["XX", "TW", "MY"], (c) => c === "MY"), "MY");
  assert.equal(pickCountry([], () => true), "US");
  assert.equal(slugFor("Amélie!", 2001), "amelie-2001");
  assert.deepEqual(hoursFor({ kind: "film", runtime: 90 }), { hours: 1.5, estimated: false });
  assert.deepEqual(hoursFor({ kind: "film" }), { hours: 2, estimated: true });
  assert.deepEqual(hoursFor({ kind: "series", runtime: 60, episodes: 22, seasons: 2 }), { hours: 11, estimated: false });
  assert.equal(formatRuntime(95), "1h 35m");
  assert.equal(formatRuntime(120), "2h");
  assert.equal(formatRuntime(45), "45m");
});
