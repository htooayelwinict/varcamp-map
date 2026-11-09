import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative, basename } from 'node:path';
import { build as buildVite, type Plugin } from 'vite';
import * as ts from 'typescript';
import { WORLD_CATALOG } from '../src/world/catalog';
import type { TiledLayer, TiledMap, WamFile } from './maps/types';
import { isSponsorTileset, readSponsorTileset } from './maps/builder';
import {assertCurrentMapRoster} from './maps/current-package';
import {assertCurrentNativeMap} from './maps/current-native';
import {readZodiacWokaPublication,readReadableZodiacWokaPublication} from './wokas/publication';
import {readPixelZodiacWokaPublication} from './wokas/publication-v3';
import {loadTileCatalog} from './art/catalog';

const digest = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');

/** Hash inputs before bundling: hashing final HTML would cycle through its JS imports. */
export function uiReleaseIdentity(root = process.cwd()): string {
  const paths: string[] = [];
  const collect = (directory: string, accept: (path: string) => boolean): void => {
    if (!existsSync(resolve(root, directory))) return;
    for (const entry of readdirSync(resolve(root, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) collect(path, accept);
      else if (entry.isFile() && accept(path)) paths.push(path);
    }
  };
  collect('src', () => true);
  collect('world', path => path.endsWith('.json'));
  collect('tools', path => /\.(?:[cm]?js|ts|json)$/.test(path));
  for (const file of readdirSync(root)) {
    if (/\.config\.(?:[cm]?js|ts)$/.test(file) || ['package.json', 'package-lock.json', 'tsconfig.json'].includes(file)) paths.push(file);
  }
  const hash = createHash('sha256').update('varcamp-ui-inputs-v1\0');
  for (const path of paths.sort()) {
    const bytes = readFileSync(resolve(root, path));
    hash.update(JSON.stringify([path, bytes.length])).update('\0').update(bytes);
  }
  return hash.digest('hex');
}

/** Fixed same-origin ocean resource; no remote URLs or implicit public-directory copying. */
export function emitNativeOceanAudio(layer:TiledLayer,mapPath:string,emit:(path:string,bytes:Buffer)=>unknown):void{
 const entries=layer.properties?.filter(p=>p.name==='playAudio')??[];if(!entries.length)return;
 const property=(name:string)=>{const found=layer.properties!.filter(p=>p.name===name);if(found.length!==1)throw Error('Ocean audio property missing/ambiguous: '+name);return found[0].value;};
 if(entries.length!==1||!['maps/shipyard-beach.tmj','maps/fa-ship.tmj','maps/constellation-shore.tmj'].includes(mapPath)||property('playAudio')!=='../assets/audio/ocean-loop.mp3'||property('audioLoop')!==true||property('audioVolume')!==0.2||typeof property('audioCopyright')!=='string'||!String(property('audioCopyright')).includes('CC0'))throw Error('Ocean audio requires the fixed local quiet looping resource');
 const bytes=readFileSync('assets/audio/ocean-loop.mp3'),proof=JSON.parse(readFileSync('art/source/ocean-audio.json','utf8'));if(proof.encodedMp3?.sha256!==digest(bytes)||proof.encodedMp3?.bytes!==bytes.length)throw Error('Ocean audio source bytes changed');const file=`assets/audio/ocean-loop.${digest(bytes)}.mp3`;emit(file,bytes);entries[0].value='../'+file;
}

export interface NativeMapPackageSource {id:string;map:TiledMap;sourceWam:WamFile;}
/** Generic native map/assets/credits emission. This is not the current-world
 * release entry: worldRelease performs its unconditional complete preflight.
 * Source objects and source files remain unchanged. */
export function emitNativeMapAssets(sourceMaps:readonly NativeMapPackageSource[],runtimeFileName:string,wokaFiles:readonly{fileName:string;source:Buffer}[],publish:(asset:{type:'asset';fileName:string;source:string|Buffer})=>unknown):void {
  const emitted = new Map<string, string | Buffer>();
  const emit = (fileName: string, source: string | Buffer) => {
    const existing = emitted.get(fileName);
    if (existing !== undefined) return existing;
    publish({ type: 'asset', fileName, source });
    emitted.set(fileName, source);
    return source;
  };
  const emitPng = (path: string, bytes: Buffer): string => {
    if (!path.endsWith('.png')) throw new Error(`Unsupported release image: ${path}`);
    const fileName = path.slice(0, -4) + `.${digest(bytes)}.png`;
    emit(fileName, bytes);
    return fileName;
  };
  for(const file of wokaFiles)emit(file.fileName,file.source);
  for (const {id,map:inputMap,sourceWam:inputWam} of sourceMaps) {
    const map=structuredClone(inputMap),sourceWam=structuredClone(inputWam);
    const mapPath = `maps/${id}.tmj`;
    const script = map.properties?.find(p => p.name === 'script');
    if (!script) throw new Error(`Missing runtime property: ${id}`);
    script.value = `../${runtimeFileName}`;
    for (const tileset of map.tilesets) {
      if (isSponsorTileset(tileset)) {
        const sponsor = readSponsorTileset(tileset);
        tileset.image = relative(dirname(mapPath), emitPng(sponsor.path, sponsor.bytes));
        continue;
      }
      if (!tileset.image) throw new Error(`Missing embedded image: ${id}`);
      const source = resolve(dirname(mapPath), tileset.image);
      const path = relative(process.cwd(), source);
      if (!path.startsWith('assets/tilesets/')) throw new Error(`Unexpected image outside source atlases: ${path}`);
      tileset.image = relative(dirname(mapPath), emitPng(path, readFileSync(source)));
    }
    const checkLayers = (layers: TiledLayer[]): void => {
      for (const layer of layers) {
        if (layer.type === 'group') checkLayers(layer.layers);
        emitNativeOceanAudio(layer,mapPath,emit);
        if (layer.type === 'imagelayer') throw new Error(`Image layer unsupported by pinned WorkAdventure; use sponsor tile layers: ${layer.name}`);
      }
    };
    checkLayers(map.layers);
    const mapBytes = JSON.stringify(map);
    emit(mapPath, mapBytes);
    const wam = sourceWam;
    // Version the final runtime-rewritten bytes so browser caches cannot reuse an older tilemap.
    wam.mapUrl = `${id}.tmj?v=${digest(mapBytes)}`;
    emit(`maps/${id}.wam`, JSON.stringify(wam));
  }
  const sources = JSON.parse(readFileSync('art/sources.json', 'utf8')) as Record<string, { attribution: string; url: string; license: string; licenseFile: string; changes: string }>;
  const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const creditLink = (path: string) => {
    const bytes = emitted.get(`credits/${path}`);
    if (bytes === undefined) throw new Error(`Missing credit dependency: ${path}`);
    return escape(`${path}?v=${digest(bytes)}`);
  };
  const titles: Record<string,string> = {'natural-coast':'Natural backshore and dune tiles',workadventure:'WorkAdventure starter tilesets','lpc-office':'LPC Revised: The Office','lpc-space':'LPC goes to space',original:'Original VarCamp art', 'lpc-ship':'LPC Ship', 'lpc-dock':'Reid Dock tileset', 'lpc-containers':'LPC Containers', 'lpc-water':'LPC Base Water','ocean-audio':'Ocean wave loop','zodiac-emblems':'VarCamp identity and zodiac emblems','plaza-original-garden':'Original VarCamp garden and grass','plaza-original-buildings':'Original VarCamp speaker pavilions','plaza-original-drones':'Original VarCamp drone sprites and motion','interior-reference':'Original VarCamp interior artwork','varcamp-organiser':'VarCamp 2026 organiser-supplied props','zodiac-exteriors':'Distinct zodiac pavilion exteriors','hall-exteriors':'Solar and Lunar pavilion exteriors'};
  Object.assign(titles, {'lpc-exploration':'LPC cottages, farm and cavern art','exploration-ghost':'Woodland ghost animation','lpc-garden-trees':'LPC garden trees','lpc-garden-plants':'LPC garden flowers and plants','lpc-garden-terrain':'LPC garden gravel paths','leo-citadel':'Leo stone lion citadel','cancer-citadel':'Cancer coastal crab citadel','horned-citadels':'Aries and Capricorn architecture','outer-security':'Outer-ring aerial patrols'});
  const gardenSources = ['lpc-garden-trees','lpc-garden-plants','lpc-garden-terrain'];
  const fullCredits: Record<string,string> = {'lpc-office':'Credits.txt', 'lpc-ship':'CREDITS-ship.txt', 'lpc-containers':'CREDITS-container.txt', 'lpc-water':'AUTHORS','lpc-garden-trees':'CREDITS-trees.txt','lpc-garden-plants':'CREDITS-plants.txt','lpc-garden-terrain':'CREDITS-terrain.txt'};
  titles['varcamp-event-identity']='VarCamp organizer-supplied pink event identity';
  const sections = Object.entries(sources).map(([id, s]) => {
    const directory=id==='ocean-audio'?'assets/audio':id==='exploration-ghost'?'assets/tilesets/lpc-exploration':gardenSources.includes(id)?'assets/tilesets/lpc-garden':`assets/tilesets/${id}`;
    for (const file of readdirSync(directory)) if (!/\.(png|mp3)$/.test(file)) emit(`credits/${id}/${file}`, readFileSync(`${directory}/${file}`));
    return `<section><h2>${escape(titles[id])}</h2><p>${escape(s.attribution)}</p><p><a href="${escape(s.url)}">Source</a> · <a href="${creditLink(`${id}/${basename(s.licenseFile)}`)}">${escape(s.license)}</a> · <a href="${creditLink(`${id}/ATTRIBUTION.md`)}">Attribution record</a></p><p>${escape(s.changes)}</p>${fullCredits[id] ? `<p><a href="${creditLink(`${id}/${fullCredits[id]}`)}">Full upstream artist credits</a></p>` : ''}</section>`;
  }).join('\n');
  emit('credits/LICENSE.starter', readFileSync('docs/dependencies/LICENSE.starter'));
  emit('credits/sources.json', readFileSync('art/sources.json'));
  emit('credits/sponsors.json', readFileSync('art/sponsors.json'));
  emit('credits/index.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>VarCamp world credits</title><style>body{max-width:55rem;margin:2rem auto;padding:0 1rem;font:18px/1.6 system-ui;color:#17243a}a{color:#164dc4}</style><h1>VarCamp world credits</h1><p>This release is a WorkAdventure map package. Its source sheets remain separate and byte-identical; the release does not repack, combine or rescale them. Map composition selects source tiles. Each work retains its own terms.</p>${sections}<h2>Demo sponsor marks</h2><p>The original fictional DEMO marks are CC0. Replacement artwork retains its recorded owner and terms. <a href="${creditLink('sponsors.json')}">Sponsor provenance and replacement instructions</a>.</p><h2>Code and editable sources</h2><p>Starter code: TheCodingMachine, MIT. <a href="${creditLink('LICENSE.starter')}">Retained notice</a>. Editable maps, semantic layouts and original artwork masters remain in the Git handover. The art is not collectively MIT.</p></html>`);
}

/** A pinned controller body must contain all executable controller code. Shared
 * human/map chunks cannot become unpinned transitive bot dependencies. */
export function assertSelfContainedController(code: string): void {
  const source=ts.createSourceFile('lyra.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  if ((source as ts.SourceFile & {parseDiagnostics:readonly unknown[]}).parseDiagnostics.length) throw Error('Invalid dedicated controller JavaScript');
  const bindings=new Map<string,ts.Node>();let defaultValue:ts.Node|undefined,diagnosticValue:ts.Node|undefined,defaults=0,diagnostics=0;
  for(const statement of source.statements){
    if(ts.isVariableStatement(statement))for(const declaration of statement.declarationList.declarations)if(ts.isIdentifier(declaration.name)&&declaration.initializer)bindings.set(declaration.name.text,declaration.initializer);
    if(ts.isFunctionDeclaration(statement)&&statement.name)bindings.set(statement.name.text,statement);
    if(ts.isExportAssignment(statement)&&!statement.isExportEquals){defaultValue=statement.expression;defaults++;}
    if(ts.isExportDeclaration(statement)){
      if(statement.moduleSpecifier||!statement.exportClause||!ts.isNamedExports(statement.exportClause))throw Error('Dedicated controller has external exports');
      for(const element of statement.exportClause.elements){if(element.name.text==='default'){defaultValue=element.propertyName??element.name;defaults++;}else if(element.name.text==='writeDiagnostic'){diagnosticValue=element.propertyName??element.name;diagnostics++;}else throw Error('Dedicated controller export API changed');}
    }
    if(ts.canHaveModifiers(statement)&&ts.getModifiers(statement)?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)&&!ts.isExportAssignment(statement)&&!ts.isExportDeclaration(statement)){if(ts.isFunctionDeclaration(statement)&&statement.name?.text==='writeDiagnostic'){diagnosticValue=statement;diagnostics++;}else throw Error('Dedicated controller export API changed');}
  }
  const visit=(node:ts.Node):void=>{if(ts.isImportDeclaration(node)||ts.isImportEqualsDeclaration(node)||ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword)throw Error('Dedicated controller retains an import');ts.forEachChild(node,visit);};visit(source);
  const resolveBinding=(value:ts.Node|undefined):ts.Node|undefined=>{const seen=new Set<string>();while(value&&ts.isIdentifier(value)){if(seen.has(value.text))throw Error('Cyclic controller default');seen.add(value.text);value=bindings.get(value.text);}return value;};
  const diagnostic=resolveBinding(diagnosticValue);if(diagnostics!==1||!diagnostic||!(ts.isFunctionDeclaration(diagnostic)||ts.isFunctionExpression(diagnostic)||ts.isArrowFunction(diagnostic)))throw Error('Dedicated controller writeDiagnostic API must be callable');
  const value=resolveBinding(defaultValue);
  if(defaults!==1||!value||!ts.isObjectLiteralExpression(value)||value.properties.length!==1)throw Error('Dedicated controller default.run object required');
  const property=value.properties[0];if(!property.name||property.name.getText(source)!=='run')throw Error('Dedicated controller default.run required');
  const callable=ts.isMethodDeclaration(property)?property:ts.isPropertyAssignment(property)?resolveBinding(property.initializer):ts.isShorthandPropertyAssignment(property)?resolveBinding(property.name):undefined;
  if(!callable||!(ts.isFunctionDeclaration(callable)||ts.isFunctionExpression(callable)||ts.isArrowFunction(callable)||ts.isMethodDeclaration(callable)))throw Error('Dedicated controller default.run must be callable');
}
export async function buildDedicatedController(root=process.cwd()):Promise<{fileName:string;source:string|Buffer}[]> {
  const result=await buildVite({root,configFile:false,envFile:false,publicDir:false,logLevel:'silent',build:{write:false,emptyOutDir:false,copyPublicDir:false,sourcemap:true,minify:'esbuild',rollupOptions:{preserveEntrySignatures:'strict',input:{lyra:resolve(root,'src/bots/lyra.ts')},output:{format:'es',inlineDynamicImports:true,entryFileNames:'bots/lyra.js'}}}});
  if(Array.isArray(result)||!('output'in result))throw Error('Dedicated controller build must have one output');
  const chunks=result.output.filter(o=>o.type==='chunk'),assets=result.output.filter(o=>o.type==='asset');
  if(chunks.length!==1||assets.length!==1)throw Error('Dedicated controller requires one self-contained module/map');
  const chunk=chunks[0],map=assets[0];
  if(!chunk.isEntry||chunk.name!=='lyra'||chunk.fileName!=='bots/lyra.js'||chunk.imports.length||chunk.dynamicImports.length||JSON.stringify(chunk.exports)!==JSON.stringify(['default','writeDiagnostic'])||map.fileName!=='bots/lyra.js.map')throw Error('Dedicated controller import/default/artifact contract changed');
  assertSelfContainedController(chunk.code);
  const parsed=JSON.parse(typeof map.source==='string'?map.source:Buffer.from(map.source).toString('utf8'));if(parsed.version!==3||!Array.isArray(parsed.sources)||!Array.isArray(parsed.sourcesContent))throw Error('Dedicated controller source map invalid');
  return [{fileName:chunk.fileName,source:chunk.code},{fileName:map.fileName,source:typeof map.source==='string'?map.source:Buffer.from(map.source)}];
}

/** Faithful release: preserve separate licensed sheets, pixels and embedded credits. */
export function worldRelease(): Plugin {
  return {
    name: 'varcamp-world-release',
    config(config) {
      return { define: { 'import.meta.env.VARCAMP_UI_RELEASE': JSON.stringify(uiReleaseIdentity(resolve(config.root ?? '.'))) } };
    },
    generateBundle(_options, bundle) {
      assertCurrentMapRoster(readdirSync('maps'));
      const sourceMaps=Object.keys(WORLD_CATALOG).map(id=>{
        const map:TiledMap=JSON.parse(readFileSync(`maps/${id}.tmj`,'utf8'));
        const sourceWam=JSON.parse(readFileSync(`maps/${id}.wam`,'utf8'));
        const layout=JSON.parse(readFileSync(`world/layouts/${id}.json`,'utf8'));
        assertCurrentNativeMap(id,map,layout,sourceWam,loadTileCatalog());
        return{id,map,sourceWam};
      });
      const runtime = Object.values(bundle).find(entry => entry.type === 'chunk' && entry.isEntry && entry.name === 'src-main');
      if (!runtime) throw new Error('Missing bundled world runtime');
      const wokaFiles=[...readZodiacWokaPublication(),...readReadableZodiacWokaPublication(),...readPixelZodiacWokaPublication()];
      // Keep every existing identity/native/Woka preflight synchronous and before
      // compilation or emission. Only this independent single-entry build is async.
      return buildDedicatedController().then(controllerFiles=>{
        for(const asset of controllerFiles)this.emitFile({type:'asset',...asset});
        emitNativeMapAssets(sourceMaps,runtime.fileName,wokaFiles,asset=>this.emitFile(asset));
      });
    },
  };
}
