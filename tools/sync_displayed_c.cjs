#!/usr/bin/env node
/* Regenerate the DISPLAYED C implementations in assets/corpus-source-data.js
   from the COMPILED files in memorise_graph_c/, so the two cannot drift.

   Why this tool exists
   --------------------
   Eleven complete Graph ADTs exist twice in this repository: once as
   compilable .c files, and once as template-literal constants that the
   browser shows the learner (the app is a static site and cannot read .c
   files at runtime, so the duplication is unavoidable). Nothing kept the two
   copies in step. On the audited baseline they were token-identical 11/11 but
   never byte-identical, because each copy carries a different leading comment:
   the .c file documents how to compile it, while the displayed copy documents
   the lesson's source provenance. When the .c files were corrected to enforce
   their public preconditions outside assert() - so that -DNDEBUG no longer
   removes every input check - the displayed copies silently kept the old
   bodies and the token match fell to 0/11, which fails AUD-14's requirement
   that the exposed code match what is actually compiled and tested.

   What it does
   ------------
   For each symbol it keeps the DISPLAYED copy's own leading block comment
   (the provenance text a learner reads, which is deliberately different) and
   replaces everything after it with the body of the mapped .c file. The
   mapping was taken from the audited baseline comparison, where each
   displayed implementation matched exactly one standalone file.

   Verify the result with the audited comparison, which this tool does not
   modify and does not depend on:
     DSA_REPO_ROOT=<tree> node reproduce/curriculum/compare_displayed_c.cjs
   Expect displayed_unique_implementations=11, unique_counterparts=11,
   unmatched=[].  Run this tool with --check to report drift without writing. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const repo=process.env.DSA_REPO_ROOT||path.join(__dirname,'..');
const checkOnly=process.argv.includes('--check');

/* symbol -> standalone file, from the audited baseline token match */
const MAP={
  SRC_GADJLIST_MEM:      'COMP2521_memorise_graph_adjacency_list.c',
  SRC_GEDGEARRAY_MEM:    'COMP2521_memorise_graph_edge_array.c',
  SRC_GADJLIST_DU_MEM:   'COMP2521_memorise_unweighted_directed_adjacency_list.c',
  SRC_GADJLIST_UW_MEM:   'COMP2521_memorise_weighted_undirected_adjacency_list.c',
  SRC_GADJLIST_DW_MEM:   'COMP2521_memorise_weighted_directed_adjacency_list.c',
  SRC_GEDGEARRAY_DU_MEM: 'COMP2521_memorise_unweighted_directed_edge_array.c',
  SRC_GEDGEARRAY_UW_MEM: 'COMP2521_memorise_weighted_undirected_edge_array.c',
  SRC_GEDGEARRAY_DW_MEM: 'COMP2521_memorise_weighted_directed_edge_array.c',
  SRC_GMATRIX_DU_MEM:    'COMP2521_memorise_unweighted_directed_adjacency_matrix.c',
  SRC_GMATRIX_UW_MEM:    'COMP2521_memorise_weighted_undirected_adjacency_matrix.c',
  SRC_GMATRIX_DW_MEM:    'COMP2521_memorise_weighted_directed_adjacency_matrix.c'
};

/* The .c files contain backslashes inside C string literals ("...\n"). Inside
   a JS template literal those must be escaped, or the literal would yield a
   real newline instead of the two characters the C source needs. */
function forTemplateLiteral(text){
  return text.replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$\{/g,'\\${');
}
/* Split off a leading /* ... *\/ block comment, returning [header, body]. */
function splitLeadingComment(text){
  const t=text.replace(/^﻿/,'');
  if(!t.trimStart().startsWith('/*'))return ['',t];
  const start=t.indexOf('/*');
  const end=t.indexOf('*/',start+2);
  if(end<0)return ['',t];
  return [t.slice(0,end+2),t.slice(end+2).replace(/^\r?\n/,'')];
}

const file=path.join(repo,'assets','corpus-source-data.js');
let src=fs.readFileSync(file,'utf8');
const changes=[],problems=[];
for(const [symbol,cfile] of Object.entries(MAP)){
  const cpath=path.join(repo,'memorise_graph_c',cfile);
  if(!fs.existsSync(cpath)){problems.push({symbol,error:'missing '+cfile});continue;}
  const re=new RegExp('(const\\s+'+symbol+'\\s*=\\s*`)([\\s\\S]*?)(`\\s*;)');
  const m=re.exec(src);
  if(!m){problems.push({symbol,error:'constant not found in corpus-source-data.js'});continue;}
  const [displayedHeader]=splitLeadingComment(m[2]);
  if(!displayedHeader){problems.push({symbol,error:'displayed copy has no leading provenance comment'});continue;}
  const [,cBody]=splitLeadingComment(fs.readFileSync(cpath,'utf8'));
  const next=displayedHeader+'\n'+forTemplateLiteral(cBody.replace(/\s+$/,''));
  if(next===m[2])continue;
  changes.push({symbol,file:cfile,oldLength:m[2].length,newLength:next.length});
  src=src.slice(0,m.index)+m[1]+next+m[3]+src.slice(m.index+m[0].length);
}
const out={file:path.relative(repo,file),symbols:Object.keys(MAP).length,
  changeCount:changes.length,changes,problems};
console.log(JSON.stringify(out,null,1));
if(problems.length){console.error('# unresolved problems; nothing written');process.exit(2);}
if(checkOnly){process.exitCode=changes.length?1:0;}
else if(changes.length){fs.writeFileSync(file,src);console.log('# corpus-source-data.js updated');}
else console.log('# already in sync');
