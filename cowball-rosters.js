/* Cowball v47 shirt-number corrections for local roster data, with club/national-team overrides. */
(function (global) {
  'use strict';
  const known = new Map([
    ['Cristiano Ronaldo', 7], ['Lionel Messi', 10], ['Kylian Mbappé', 10],
    ['Erling Haaland', 9], ['Mohamed Salah', 11], ['Harry Kane', 9],
    ['Vinícius Júnior', 7], ['Bukayo Saka', 7], ['Son Heung-min', 7],
    ['Robert Lewandowski', 9], ['Rodri', 16], ['Lamine Yamal', 19],
    ['Neymar', 10], ['Kevin De Bruyne', 17], ['Antoine Griezmann', 7],
    ['Luka Modrić', 10], ['Jude Bellingham', 5], ['Bruno Fernandes', 8],
    ['Bernardo Silva', 10], ['Phil Foden', 47], ['Cole Palmer', 20],
    ['Virgil van Dijk', 4], ['Alisson Becker', 1], ['Thibaut Courtois', 1],
    ['Manuel Neuer', 1]
  ]);
  const byTeam = new Map([
    ['pl_liv|Mohamed Salah', 11], ['EGY|Mohamed Salah', 10],
    ['ll_bar|Lamine Yamal', 10], ['ESP|Lamine Yamal', 19],
    ['sa_nap|Kevin De Bruyne', 11], ['BEL|Kevin De Bruyne', 7],
    ['ll_rma|Jude Bellingham', 5], ['ENG|Jude Bellingham', 10],
    ['pl_mci|Phil Foden', 47], ['ENG|Phil Foden', 20],
    ['fx_0|Cole Palmer', 10], ['ENG|Cole Palmer', 24],
    ['sa_mil|Luka Modrić', 14], ['CRO|Luka Modrić', 10],
    ['pl_mci|Bernardo Silva', 20], ['POR|Bernardo Silva', 10],
    ['pl_mci|Gianluigi Donnarumma', 25], ['ITA|Gianluigi Donnarumma', 1]
  ]);
  function numberFor(name, fallback, teamId, teamCode) {
    const key = String(name || '').trim();
    const clubKey = String(teamId || '') + '|' + key;
    const nationKey = String(teamCode || '') + '|' + key;
    if (byTeam.has(clubKey)) return byTeam.get(clubKey);
    if (byTeam.has(nationKey)) return byTeam.get(nationKey);
    return known.has(key) ? known.get(key) : fallback;
  }
  global.CowballRostersV47 = Object.freeze({ numberFor });
})(window);
