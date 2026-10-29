/* Cowball v47 UI: league-first club selection, refined player indicator, career summary.
   Loaded after the core and optional navigation helpers. Keeps the classic-script/GitHub Pages setup. */
(function () {
  'use strict';

  const LEAGUES_V47 = [
    { id: 'premier', name: 'Премьер-лига', country: 'АНГЛИЯ', flag: '🇬🇧', color: '#50a8ff', symbol: '⚡', subtitle: 'Темп, прессинг и быстрые атаки' },
    { id: 'laliga', name: 'Ла Лига', country: 'ИСПАНИЯ', flag: '🇪🇸', color: '#ff8759', symbol: '☀️', subtitle: 'Техника и контроль мяча' },
    { id: 'bundesliga', name: 'Бундеслига', country: 'ГЕРМАНИЯ', flag: '🇩🇪', color: '#f04455', symbol: '🛡️', subtitle: 'Интенсивность и вертикальный футбол' },
    { id: 'seriea', name: 'Серия A', country: 'ИТАЛИЯ', flag: '🇮🇹', color: '#68a8ff', symbol: '🌑', subtitle: 'Тактика и организованная оборона' },
    { id: 'ligue1', name: 'Лига 1', country: 'ФРАНЦИЯ', flag: '🇫🇷', color: '#ad8aff', symbol: '🚀', subtitle: 'Скорость и молодые таланты' }
  ];
  const escV47 = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const leagueInfoV47 = id => LEAGUES_V47.find(l => l.id === id) || null;

  // Restrict club results to the league selected in the new first screen.
  const eligibleTeamsV47Base = teamsEligibleForFlow;
  teamsEligibleForFlow = function (flow) {
    const all = eligibleTeamsV47Base.apply(this, arguments);
    if (flow && !flow.comp && teamCategory === 'club' && flow.leaguePick) {
      return all.filter(team => team.league === flow.leaguePick);
    }
    return all;
  };

  const renderTeamsV47Base = renderTeams;
  renderTeams = function () {
    const flow = teamFlow;
    if (!flow) return renderTeamsV47Base.apply(this, arguments);

    // Keep tournament-defined team pools unchanged. The league-first screen is for free selection only.
    if (flow.comp || teamCategory !== 'club') return renderTeamsV47Base.apply(this, arguments);

    if (flow.leaguePick) {
      renderTeamsV47Base.apply(this, arguments);
      const league = leagueInfoV47(flow.leaguePick);
      const grid = document.getElementById('teamGrid');
      if (grid && league) {
        const count = TEAMS.filter(team => team.league === league.id && !team.nation).length;
        grid.insertAdjacentHTML('afterbegin', `<div class="cb47LeagueHead"><button class="cb47LeagueBack" type="button" data-a="teamleagueback" aria-label="Вернуться к списку лиг">‹ Все лиги</button><div><small>${league.flag} ${league.country}</small><b>${league.name}</b></div><span>${count} клубов</span></div>`);
        const title = document.getElementById('teamsTitle');
        if (title) {
          const prefix = flow.step === 0
            ? (flow.mode === 'versus' ? 'Игрок 1: выбери команду' : 'Выбери свою команду')
            : (flow.mode === 'versus' ? 'Игрок 2: выбери команду' : 'Выбери соперника');
          title.textContent = `${prefix} · ${league.name}`;
        }
      }
      const go = document.getElementById('teamGo');
      if (go) go.disabled = false;
      const screen = document.getElementById('sc-teams');
      if (screen) screen.classList.add('cb47-team-list');
      return;
    }

    // League overview: no team may be committed until a league has been opened.
    renderTeamsV47Base.apply(this, arguments);
    const grid = document.getElementById('teamGrid');
    if (!grid) return;
    const twoPlayer = flow.mode === 'quick' || flow.mode === 'versus' || flow.mode === 'pens';
    const prompt = flow.step === 0
      ? (flow.mode === 'versus' ? 'Игрок 1: выбери лигу' : 'Выбери лигу для своей команды')
      : (flow.mode === 'versus' ? 'Игрок 2: выбери лигу' : 'Выбери лигу соперника');
    const cards = LEAGUES_V47.map((league, index) => {
      const clubs = TEAMS.filter(team => team.league === league.id && !team.nation);
      const avg = clubs.length ? clubs.reduce((sum, team) => sum + teamPower(team), 0) / clubs.length : 0;
      const samples = clubs.slice(0, 3).map(team => escV47(team.name)).join(' · ');
      return `<button class="cb47LeagueCard" type="button" role="listitem" data-a="teamleague" data-v="${league.id}" style="--cb47-league:${league.color};--cb47-i:${index}" aria-label="Открыть лигу ${escV47(league.name)}">
        <span class="cb47LeagueMeta"><span class="cb47LeagueSymbol">${league.symbol}</span><span>${league.flag} ${league.country}</span></span>
        <strong>${league.name}</strong><span class="cb47LeagueSubtitle">${league.subtitle}</span>
        <span class="cb47LeagueClubs">${clubs.length} клубов <i>·</i> средняя сила ${avg.toFixed(1)}/5</span>
        <span class="cb47LeagueExamples">${samples || 'Команды Cowball'}</span>
        <span class="cb47LeagueOpen">СМОТРЕТЬ КЛУБЫ <b>↗</b></span>
      </button>`;
    }).join('');
    grid.innerHTML = `<div class="cb47LeagueWrap"><div class="cb47LeagueIntro"><span>СОРЕВНОВАНИЯ / КЛУБЫ</span><b>${prompt}</b><small>Сначала выбери лигу — затем клуб из её списка.</small></div><div class="cb47LeagueGrid" role="list">${cards}</div></div>`;

    const title = document.getElementById('teamsTitle');
    if (title) title.textContent = prompt;
    const info = document.getElementById('teamInfo');
    if (info) info.innerHTML = '<b>Выбор по лигам</b><br>Открой лигу, чтобы увидеть её клубы и выбрать команду.';
    const preview = document.getElementById('matchupPreview');
    if (preview) preview.classList.add('hide');
    const go = document.getElementById('teamGo');
    if (go) {
      go.textContent = 'Сначала выбери лигу';
      go.disabled = true;
      go.classList.add('dis');
    }
    const screen = document.getElementById('sc-teams');
    if (screen) screen.classList.remove('cb47-team-list');
  };

  // Prevent stale team selections from bypassing the new league screen.
  const teamGoV47Base = teamGo;
  teamGo = function () {
    if (teamFlow && !teamFlow.comp && teamCategory === 'club' && !teamFlow.leaguePick) return;
    return teamGoV47Base.apply(this, arguments);
  };

  // New league navigation actions are added to the existing delegated action router.
  ACT.teamleague = function (data) {
    if (!teamFlow || teamFlow.comp) return;
    const league = leagueInfoV47(String(data && data.v || ''));
    if (!league) return;
    teamFlow.leaguePick = league.id;
    teamFlow.balancedOpp = null;
    const pool = TEAMS.filter(team => team.league === league.id && !team.nation && (teamFlow.step === 0 || team.id !== teamFlow.my));
    const saved = teamFlow.step === 0 ? pool.find(team => team.id === settings.myTeam) : null;
    teamFlow.cur = (saved || pool[0] || {}).id || null;
    renderTeams();
  };
  ACT.teamleagueback = function () {
    if (!teamFlow || teamFlow.comp) return;
    teamFlow.leaguePick = null;
    teamFlow.cur = null;
    teamFlow.balancedOpp = null;
    renderTeams();
  };

  const teamCatV47Base = ACT.teamcat;
  ACT.teamcat = function (data) {
    if (teamFlow && !teamFlow.comp && data && data.v === 'club') {
      teamCategory = 'club';
      teamFlow.leaguePick = null;
      teamFlow.cur = null;
      teamFlow.balancedOpp = null;
      renderTeams();
      return;
    }
    if (teamFlow) teamFlow.leaguePick = null;
    return teamCatV47Base.apply(this, arguments);
  };

  const teamBackV47Base = ACT.teamback;
  ACT.teamback = function () {
    if (teamFlow && !teamFlow.comp && teamCategory === 'club' && teamFlow.leaguePick) {
      teamFlow.leaguePick = null;
      teamFlow.cur = null;
      teamFlow.balancedOpp = null;
      renderTeams();
      return;
    }
    return teamBackV47Base.apply(this, arguments);
  };

  // Add a subtle second halo to the already existing active-player ring and preserve the core marker logic.
  const halosV47 = markers.map((marker, index) => {
    const color = index === 0 ? 0xb8ff3d : 0xffffff;
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.45, 1.72, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.035;
    halo.renderOrder = 3;
    halo.visible = false;
    scene.add(halo);
    marker.haloV47 = halo;
    return halo;
  });
  const syncSceneV47Base = syncScene;
  syncScene = function () {
    const result = syncSceneV47Base.apply(this, arguments);
    markers.forEach((marker, index) => {
      const p = players[index], cow = p && p.cow, halo = halosV47[index];
      const on = !!(marker.r.visible && cow && (state === 'ready' || state === 'play' || state === 'goal' || state === 'outro' || state === 'replay'));
      halo.visible = on;
      if (!on) return;
      halo.position.set(wx(cow.x), 0.036, wz(cow.y));
      const pulse = 1 + Math.sin(clock * 0.13 + index * 1.4) * 0.055;
      halo.scale.setScalar(pulse);
      halo.material.opacity = 0.16 + (Math.sin(clock * 0.13 + index * 1.4) + 1) * 0.055;
      marker.r.scale.setScalar(1 + Math.sin(clock * 0.13 + index * 1.4) * 0.025);
    });
    return result;
  };

  // Add real season information to the already persistent career overview without changing save data.
  const careerRenderV47Base = careerV29Render;
  careerV29Render = function (tab) {
    const result = careerRenderV47Base.apply(this, arguments);
    if ((tab || 'overview') === 'overview') {
      const root = document.getElementById('cbCareerV29');
      const career = settings && settings.career;
      if (root && career && !root.querySelector('.cb47CareerSummary')) {
        const value = key => Math.max(0, Math.floor(Number(career[key]) || 0));
        const stats = [
          ['МАТЧИ', value('seasonMatches')], ['ПОБЕДЫ', value('seasonWins')], ['НИЧЬИ', value('seasonDraws')],
          ['ЗАБИТО', value('seasonGoals')], ['ПРОПУЩЕНО', value('seasonConceded')], ['ОЧКИ', value('seasonPoints')]
        ];
        const summary = document.createElement('section');
        summary.className = 'cb47CareerSummary';
        summary.setAttribute('aria-label', 'Статистика текущего сезона');
        summary.innerHTML = `<div class="cb47CareerSummaryTitle">ТЕКУЩИЙ СЕЗОН <span>№ ${Math.max(1, value('season'))}</span></div><div class="cb47CareerStats">${stats.map(([label, amount]) => `<div><small>${label}</small><b>${amount}</b></div>`).join('')}</div>`;
        const intro = root.firstElementChild;
        if (intro) intro.insertAdjacentElement('afterend', summary); else root.insertAdjacentElement('afterbegin', summary);
      }
    }
    return result;
  };

  // The current card flip stays fully interactive; these styles only enrich its presentation.
  document.documentElement.classList.add('cb47-ui-ready');
})();
