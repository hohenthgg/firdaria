import { abrir } from './_lib.mjs';
const {b,pg,errs}=await abrir();
const R=await pg.evaluate(()=>{
  const T=significadoresDePessoas();
  const out={seita:NATAL.sect, figuras:{}};
  Object.entries(T).forEach(([f,v])=>{
    out.figuras[f]=v.candidatos.map(c=>c.nome+' ['+c.vias.join('+')+' · '+c.origens.join(' / ')+'] '+c.peso);
  });
  out.lua=pessoaDoContato('moon',{casas:[4],pls:['moon','sun']});
  out.luaNeutro=pessoaDoContato('moon',{casas:[],pls:['moon']});
  out.saturno=pessoaDoContato('saturn',{casas:[],pls:['saturn']});
  return out;
});
console.log('seita:',R.seita);
Object.entries(R.figuras).forEach(([f,l])=>{console.log('\n'+f.toUpperCase());l.forEach(x=>console.log('   '+x));});
console.log('\nLua (contato toca a 4ª e o Sol):\n   '+R.lua.frase);
console.log('\nLua (sem contexto):\n   '+R.luaNeutro.frase);
console.log('\nSaturno (sem contexto):\n   '+R.saturno.frase);
console.log('\nERROS:',errs.length?errs:'(nenhum)');
await b.close();
