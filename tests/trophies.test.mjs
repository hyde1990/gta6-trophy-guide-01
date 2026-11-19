import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateTrophies } from '../app/js/data.js';

// The official 55, exactly as PlayStation publishes them (name, description, grade).
// This fixture is the test's oracle: the app data must match it character for character.
const OFFICIAL = [
  ['Vice Got a Price!', "Congratulations! You're a Leonida Legend.", 'platinum'],
  ['Just Like Paradise', 'Complete Gone Fishing.', 'bronze'],
  ['Paradise Lost', 'Complete Chapter 1.', 'bronze'],
  ['T**s Ass Drug Money', 'Complete Chapter 2.', 'bronze'],
  ['Vice City, Baby!', 'Complete Chapter 3.', 'bronze'],
  ['Top Of The World, Ma', 'Complete Chapter 4.', 'bronze'],
  ['You Gotta Know When to Get Off', 'Complete the final mission.', 'gold'],
  ['Trust', 'Complete Breakfast Run.', 'bronze'],
  ['Break the Bank', 'Complete The Cartel Heist.', 'bronze'],
  ['Family Matters', "Complete Child's Play.", 'bronze'],
  ['DWNFALL', 'Complete Headliners.', 'bronze'],
  ['Hi-Jacked', 'Complete VCIA Takedown.', 'bronze'],
  ['Snow Storm', 'Complete Operation Savage Glory.', 'bronze'],
  ['A Long Road', 'Attain 100% Completion.', 'gold'],
  ['Cunning Stunts', 'Complete 250 Stunts.', 'silver'],
  ['Master of None', 'Try each type of activity once.', 'bronze'],
  ['The Shootist', 'Earn a gold medal in all Shooting Range challenges.', 'silver'],
  ['Top Fun', 'Win a Top Fun Drone Race at every location.', 'bronze'],
  ['Earn Cash, Not Kudos', 'Win 20 different races.', 'bronze'],
  ['Baited My Tackle', 'Beat Cal in a fishing challenge.', 'bronze'],
  ['Stick Fiddler', 'Complete an arcade game.', 'bronze'],
  ['Road to Rehabilitation', 'Complete the final mission for Andy.', 'bronze'],
  ['This Was No Boat Accident', 'Complete the final mission for Kenton.', 'bronze'],
  ['The Lone Rider', 'Complete the final mission for Billy.', 'bronze'],
  ['Strangers & Freaks', 'Complete 8 mission strands for strangers across the state of Leonida.', 'silver'],
  ['Supply & Demand', 'Complete the final mission for Randy.', 'bronze'],
  ['Spin On This!', 'Complete the final mission for Tyrone.', 'bronze'],
  ['Positive Mental Attitude', 'Meditate at every spot across Leonida.', 'bronze'],
  ['Fair Game', 'Hunt a unique animal for Bret.', 'bronze'],
  ["Don't Touch My Deck", 'Complete 3 Collectible Card sets.', 'silver'],
  ['You WAiNKer!', 'WAiNK It at 100 locations.', 'silver'],
  ['One Last Thing', 'Complete 50 Challenges.', 'bronze'],
  ['Hot Together', 'Lose a 4 star Wanted Level with your partner and escape the heat.', 'bronze'],
  ['Retail Therapy', 'Rob 3 shops back-to-back with your partner without losing your Wanted Level.', 'bronze'],
  ['Whip It Good', 'Discover 100 vehicles.', 'bronze'],
  ['Gunslinger', 'Take down 5 enemies in a single use of Combat Focus.', 'bronze'],
  ['Catch Me If You Can', 'Make an unscheduled departure at VCIA.', 'bronze'],
  ['Challenging Tank', 'Kinda hot in these Rhinos.', 'bronze'],
  ['Sneakthief', 'Rob a jewelry store without being detected.', 'bronze'],
  ['Maximum Withdrawal', 'Rob 5 Bank Vaults and escape.', 'silver'],
  ['A Classic Blitz Play', 'Rob an Armored Truck and escape.', 'bronze'],
  ['The Goodtime State', 'Explore all of Leonida.', 'bronze'],
  ['Pest Control', 'Rob an Illegal Operation belonging to each gang.', 'bronze'],
  ['In The Beginning…', 'Enjoy a cocktail with a view on Ocean Beach.', 'bronze'],
  ['Capital Offense', 'Smash your way out of a vehicle showroom in classic style.', 'bronze'],
  ['Let’s Go Bowling', "Follow-through at the Kolt & Associates' bowling alley.", 'bronze'],
  ['Personal Best', 'A partnership with mass appeal.', 'bronze'],
  ['Actions Speak Louder', 'Choices made (for better or worse).', 'bronze'],
  ['Bad Luck, I Guess', "Second time's the charm.", 'bronze'],
  ['The Truth Is Out There', 'What the hell just happened?', 'bronze'],
  ['Ten Pin', "Bowl 'em over with a melee drive-by.", 'bronze'],
  ['Dime on the Dollar', 'Earn $250,000 laundering Marked Bills through your contacts.', 'bronze'],
  ['Treat Yo Self', 'Spend $100,000 across all shops.', 'bronze'],
  ['Little Boxes', 'Purchase all garage properties.', 'bronze'],
  ['On the Spot', 'Register 10 vehicles to the Scooter Bros app.', 'bronze'],
];

const official = OFFICIAL.map(([name, description, grade]) => ({ name, description, grade }));

function loadData() {
  return JSON.parse(readFileSync(new URL('../app/data/trophies.json', import.meta.url), 'utf8'));
}

test('data file holds exactly the 55 official trophies', () => {
  const doc = loadData();
  assert.equal(Array.isArray(doc.trophies), true);
  assert.equal(doc.trophies.length, 55);
  const grades = doc.trophies.reduce((acc, t) => {
    acc[t.grade] = (acc[t.grade] || 0) + 1;
    return acc;
  }, {});
  assert.deepEqual(grades, { platinum: 1, gold: 2, silver: 6, bronze: 46 });
});

test('every official name, description and grade matches exactly', () => {
  const doc = loadData();
  for (const want of official) {
    const got = doc.trophies.find((t) => t.name === want.name);
    assert.ok(got, `missing trophy: ${want.name}`);
    assert.equal(got.description, want.description, `description drift: ${want.name}`);
    assert.equal(got.grade, want.grade, `grade drift: ${want.name}`);
  }
  const names = doc.trophies.map((t) => t.name);
  assert.equal(new Set(names).size, 55, 'trophy names must be unique');
});

test('validateTrophies reports no errors for the shipped data', () => {
  const doc = loadData();
  assert.deepEqual(validateTrophies(doc, official), []);
});

test('every guide is original, substantial, and different from its description', () => {
  const doc = loadData();
  for (const t of doc.trophies) {
    assert.equal(typeof t.guide, 'string', `${t.name}: guide must be text`);
    assert.ok(t.guide.trim().length >= 120, `${t.name}: guide too short (${t.guide.trim().length})`);
    assert.notEqual(t.guide.trim(), t.description.trim(), `${t.name}: guide repeats the description`);
  }
});

test('every trophy cites at least one source with a name and an https URL', () => {
  const doc = loadData();
  for (const t of doc.trophies) {
    assert.ok(Array.isArray(t.sources) && t.sources.length >= 1, `${t.name}: needs a source`);
    for (const s of t.sources) {
      assert.ok(typeof s.name === 'string' && s.name.length > 3, `${t.name}: source needs a name`);
      assert.ok(typeof s.url === 'string' && s.url.startsWith('https://'), `${t.name}: source needs an https URL`);
    }
  }
});

test('kinds, roadmap stage, story and missable flags are consistent', () => {
  const doc = loadData();
  for (const t of doc.trophies) {
    assert.ok(Array.isArray(t.kinds) && t.kinds.length >= 1, `${t.name}: needs a kind`);
    assert.ok(Number.isInteger(t.roadmap_stage) && t.roadmap_stage >= 1 && t.roadmap_stage <= 5,
      `${t.name}: roadmap_stage must be 1-5`);
    assert.equal(typeof t.story, 'boolean', `${t.name}: story must be a boolean`);
    assert.equal(typeof t.missable, 'boolean', `${t.name}: missable must be a boolean`);
    if (t.missable) {
      assert.ok(typeof t.missable_note === 'string' && t.missable_note.trim().length > 20,
        `${t.name}: a missable trophy needs a note`);
    }
    if (t.target !== undefined) {
      assert.ok(Number.isFinite(t.target) && t.target > 0, `${t.name}: target must be a positive number`);
    }
  }
  const missables = doc.trophies.filter((t) => t.missable);
  assert.equal(missables.length, 1, 'exactly one missable trophy is expected');
  assert.equal(missables[0].name, 'Positive Mental Attitude');
  const storyCount = doc.trophies.filter((t) => t.story).length;
  assert.ok(storyCount >= 10 && storyCount <= 20, `story trophies: ${storyCount}`);
  const stages = doc.trophies.reduce((acc, t) => {
    acc[t.roadmap_stage] = (acc[t.roadmap_stage] || 0) + 1;
    return acc;
  }, {});
  for (let s = 1; s <= 5; s++) assert.ok(stages[s] >= 3, `roadmap stage ${s} is too thin`);
});

test('validateTrophies catches a tampered name and a missing source', () => {
  const doc = loadData();
  const bad = JSON.parse(JSON.stringify(doc));
  bad.trophies[0].name = 'Wrong Name';
  assert.ok(validateTrophies(bad, official).length > 0);
  const bad2 = JSON.parse(JSON.stringify(doc));
  bad2.trophies[3].sources = [];
  assert.ok(validateTrophies(bad2, official).length > 0);
  const bad3 = JSON.parse(JSON.stringify(doc));
  bad3.trophies[3].guide = bad3.trophies[3].description;
  assert.ok(validateTrophies(bad3, official).length > 0);
});
