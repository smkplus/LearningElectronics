/* ========================================================================
   RESISTOR COLOR-CODE DECODER
   ======================================================================== */
const RESISTOR_COLORS = [
  {name:'black',  hex:'#2b2b2b', digit:0, mult:1},
  {name:'brown',  hex:'#7b4a25', digit:1, mult:10,         tol:1},
  {name:'red',    hex:'#d6423b', digit:2, mult:100,        tol:2},
  {name:'orange', hex:'#e8801e', digit:3, mult:1000},
  {name:'yellow', hex:'#e8d21e', digit:4, mult:10000},
  {name:'green',  hex:'#3ea86a', digit:5, mult:100000,     tol:0.5},
  {name:'blue',   hex:'#3b6fd6', digit:6, mult:1000000,    tol:0.25},
  {name:'violet', hex:'#8b3bd6', digit:7, mult:10000000,   tol:0.1},
  {name:'gray',   hex:'#8c8c8c', digit:8, mult:100000000},
  {name:'white',  hex:'#f2f2f2', digit:9, mult:1000000000},
  {name:'gold',   hex:'#d4af37',          mult:0.1,        tol:5},
  {name:'silver', hex:'#c7cbd1',          mult:0.01,       tol:10},
];
const colorByName = n => RESISTOR_COLORS.find(c => c.name === n);
