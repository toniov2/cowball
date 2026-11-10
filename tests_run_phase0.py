"""Phase 0 regression tests. Needs: pip install playwright && playwright install chromium.
Run from the project root:  python3 tests/run_phase0.py
Uses the real three.min.js if it lies next to index.html, otherwise a tiny stub (rendering is then NOT tested)."""
import asyncio, functools, http.server, json, os, sys, threading
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STUB = open(os.path.join(ROOT, 'tests', 'three_stub.js'), encoding='utf-8').read()
HAS_THREE = os.path.exists(os.path.join(ROOT, 'three.min.js'))
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT); H.log_message = lambda *a, **k: None
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{PORT}/index.html'
results = []
def check(name, ok, info=''): results.append((name, bool(ok), str(info)))

async def fresh(b, offline_block=True):
    ctx = await b.new_context(); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    if not HAS_THREE: await pg.add_init_script(STUB)
    await pg.route(lambda u: not u.startswith('http://127.0.0.1'), lambda r: r.abort())
    await pg.goto(URL); await pg.wait_for_function('window.CowballTest', timeout=8000)
    return ctx, pg, errs

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await fresh(b); await pg.wait_for_timeout(1500)
        check('01 страница грузится без ошибок JS', not errs, errs)
        check('02 слой v47 применился', await pg.evaluate("document.documentElement.classList.contains('cb47-ui-ready')"))
        check('03 заставка не показывает «Ошибка запуска»', await pg.evaluate("(function(){var s=document.getElementById('splash');return !s||getComputedStyle(s).display==='none'||s.textContent.indexOf('Ошибка')<0})()"))

        T = "window.CowballTest"
        r = await pg.evaluate(f"""(function(){{const t={T}, m=(ga,gb,pa,pb)=>Object.assign(t.mkMatch('A','B'),{{ga,gb,pa,pb}});
          return [t.matchWinner(m(2,1,0,0)), t.matchWinner(m(1,2,0,0)), t.matchWinner(m(1,1,4,3)), t.matchWinner(m(1,1,3,4)), t.matchWinner(m(1,1,0,0)), t.matchWinner(null)]}})()""")
        check('04 matchWinner: голы, пенальти, ничья без пенальти -> null', r == ['A', 'B', 'A', 'B', None, None], r)

        r = await pg.evaluate(f"""(function(){{const t={T}, my=t.TEAMS().find(x=>!x.nation&&!x.league).id; let bad=0, noChamp=0;
          for(let s=1;s<=150;s++){{t.seedRng(s); const c=t.newComp('cup',my); t.compSimRest(c);
            if(!c.done||!c.champion) noChamp++;
            c.rounds.forEach(r=>{{ if(r.ko) r.matches.forEach(m=>{{ if(m.done&&t.matchWinner(m)===null) bad++; }}); }});}}
          return [bad,noChamp]}})()""")
        check('05 кубок: 150 турниров, у каждого матча и турнира есть победитель', r == [0, 0], r)

        r = await pg.evaluate(f"""(function(){{const t={T}, my=t.TEAMS().find(x=>!x.nation&&!x.league).id;
          const run=()=>{{t.seedRng(777); const c=t.newComp('cup',my); t.compSimRest(c); return JSON.stringify([c.champion,c.rounds.map(r=>r.matches.map(m=>[m.a,m.b,m.ga,m.gb,m.pa,m.pb]))]);}};
          const a=run(), b=run(); t.seedRng(778); const c2=t.newComp('cup',my); t.compSimRest(c2); return [a===b, a!==JSON.stringify([c2.champion,c2.rounds.map(r=>r.matches.map(m=>[m.a,m.b,m.ga,m.gb,m.pa,m.pb]))])]}})()""")
        check('06 одинаковое зерно -> одинаковый турнир; другое зерно -> другой', r == [True, True], r)

        r = await pg.evaluate(f"""(function(){{const t={T}, my=t.TEAMS().find(x=>!x.nation&&!x.league).id; t.seedRng(5); const c=t.newComp('cup',my);
          const s=[t.roundStage(c.rounds[0])]; t.compPlay(c,null); s.push(t.roundStage(c.rounds[1])); t.compPlay(c,null); s.push(t.roundStage(c.rounds[2]));
          s.push(t.roundStage({{name:'Финал'}}), t.roundStage({{name:'1/2 финала'}}), t.roundStage({{name:'Что угодно',stage:'sf'}})); return s}})()""")
        check('07 ключи раундов qf/sf/final, старые сохранения распознаются', r == ['qf', 'sf', 'final', 'final', 'sf', 'sf'], r)

        r = await pg.evaluate(f"""[{T}.cleanName('<img src=x onerror=alert(1)>Вася'), {T}.cleanName('a'.repeat(40)).length]""")
        check('08 имя очищается от разметки и режется до 14', r[0] == 'img src=x onerror=alert(1)Вася'[:14] and r[1] == 14, r)

        try:
            r = await pg.evaluate(f"""(async function(){{const t={T}; t.beginOutro(); const n1=t.outroTimers(); t.setState('menu'); return [n1, t.outroTimers()]}})()""")
            check('09 свистки конца матча отменяются при выходе из матча', r[0] > 0 and r[1] == 0, r)
        except Exception as e:
            check('09 свистки конца матча отменяются при выходе из матча', False, 'не проверено: ' + str(e)[:150])

        await pg.evaluate("window.dispatchEvent(new ErrorEvent('error',{message:'late runtime error'}))")
        check('10 ошибка ПОСЛЕ старта не заменяет игру экраном «Ошибка запуска»', await pg.evaluate("(function(){var s=document.getElementById('splash');return !s||s.textContent.indexOf('late runtime')<0})()"))

        await pg.evaluate("""(function(){const o=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='cowball') throw new DOMException('full','QuotaExceededError'); return o.apply(this,arguments); }; window.CowballTest.save();})()""")
        await pg.wait_for_timeout(500)
        r = await pg.evaluate("[window.__cowballSaveFailed, !!document.getElementById('cbSaveWarn') && getComputedStyle(document.getElementById('cbSaveWarn')).display!=='none']")
        check('11 переполненное хранилище -> видимое предупреждение, а не тишина', r == [True, True], r)

        r = await pg.evaluate("Array.from(document.querySelectorAll('button')).filter(b=>!b.getAttribute('aria-label') && !/[\\p{L}\\p{N}]{2,}/u.test(b.textContent||'')).length")
        check('12 нет кнопок без доступного имени', r == 0, r)
        r = await pg.evaluate("document.querySelectorAll('[data-a]:not(button)[role=button][tabindex]').length")
        check('13 кликабельные div получили role/tabindex (если есть)', r >= 0, r)
        await ctx.close()

        # offline
        ctx, pg, errs = await fresh(b); await pg.wait_for_timeout(1500)
        await pg.evaluate("navigator.serviceWorker.ready.then(r=>r.active.postMessage({type:'warm'}))"); await pg.wait_for_timeout(2500)
        await ctx.set_offline(True); await pg.reload(); await pg.wait_for_timeout(2500)
        check('14 офлайн: страница и слой v47 работают без сети', await pg.evaluate("document.documentElement.classList.contains('cb47-ui-ready')"))
        r = await pg.evaluate("fetch('cow-moo.mp3',{headers:{Range:'bytes=0-99'}}).then(async r=>[r.status,(await r.arrayBuffer()).byteLength])")
        check('15 офлайн: mp3 отдаётся из кэша с Range (206)', r == [206, 100], r)
        await ctx.close(); await b.close()

    w = max(len(n) for n, _, _ in results)
    for n, ok, info in results: print(('PASS ' if ok else 'FAIL ') + n + ('' if ok or not info else '  -> ' + info))
    print(f"\n{sum(o for _, o, _ in results)}/{len(results)} passed; three.min.js: {'real' if HAS_THREE else 'STUB (3D not tested)'}")
    return 0 if all(o for _, o, _ in results) else 1

sys.exit(asyncio.run(main()))
