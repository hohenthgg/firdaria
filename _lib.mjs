import { chromium } from 'playwright-core';
export const MAPA='https://www.aspectarian.com/chart?date=2000-07-24T23%3A00&lat=-22.2270778&long=-45.93937160000001&name=teste&t=America%2FSao_Paulo';
export async function abrir(){
  const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const pg=await b.newPage({viewport:{width:1400,height:1100}});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8099/index.html',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(900);
  await pg.evaluate(()=>irPara('dados'));
  await pg.fill('#imp-url',MAPA);
  await pg.click('#imp-run'); await pg.waitForTimeout(15000);
  const ok=await pg.evaluate(()=>typeof NATAL!=='undefined'&&!!NATAL);
  if(!ok)throw new Error('mapa não carregou');
  return {b,pg,errs};
}
