const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Paste the raw data here (tab-separated lines).
const raw = `Store ID\tStore Name\tRegion\tAM\tMM\tTrainer\tAudit Percentage\tHealth
"S191"\tSparsh Hospital 2 Raj Rajeshwari Nagar\tSouth\tNandish  M\tAdil\tMallika\t74.00%\tFair
"S004"\tTWC-Sadashiv Nagar\tSouth\tJagruti\tSowmya \tMahadev\t87.00%\tGood
"S058"\tWanowrie\tWest\tRutuja\tSubhash & Ritesh\tPriyanka\t69.00%\tNeeds Improvement
"S101"\tSector 63\tNorth\tVishu\tManthan \tKailash\t89.00%\tGood
"S083"\tKondapur\tWest\tAnil  Rawat\tJyothi\tSunil\t81.00%\tGood
"S011"\tTWC-Cunningham Road\tSouth\tJagruti\tIndhuja\tSheldon\t89.00%\tGood
"S159"\tTWC-The Sqaure - Raj Etternia Kudlu\tSouth\tKiran\tLaxman\tSheldon\t74.00%\tFair
"S095"\tTWC-JP Nagar 7th Phase\tSouth\tUmakanth\tPrakash \tMallika\t82.00%\tGood
"S076"\tEmerald Borivali\tWest\tVruchika\tHusna \tViraj\t73.00%\tFair
"S028"\tSaket\tNorth\tHimanshu\tVikas \tBhawna\t82.00%\tGood
"S075"\tRunwal Greens Mulund\tWest\tShailesh\tPriyanka \tViraj\t79.00%\tFair
"S040"\tAmbience Mall, Vasant Kunj\tNorth\tHimanshu\tSheelu\tKailash\t46.00%\tNeeds Improvement
"S053"\tTWC-Varthur\tSouth\tAjay  H\tDina\tSheldon\t87.00%\tGood
"S149"\tTWC-HSR 5th Main\tSouth\tUmakanth\tDayanand \tMallika\t70.00%\tFair
"S032"\tTWC-Brookfield\tSouth\tAjay  H\tPallavi\tSheldon\t60.00%\tNeeds Improvement
"S099"\tSushant Lok\tNorth\tAtul\tAnuj Yadav \tBhawna\t82.00%\tGood
"S185"\tBasaveshwar Nagar\tSouth\tNandish  M\tLohith\tMallika\t51.00%\tNeeds Improvement
"S189"\tBrookfield - Nxt Whitefield\tSouth\tAjay  H\tMadan\tSheldon\t74.00%\tFair
"S055"\tKalkaji\tNorth\tVishu\tChampa \tBhawna\t86.00%\tGood
"S184"\tPrestige Techno star\tSouth\tAjay  H\tBasavaraj\tSheldon\t10.00%\tNeeds Improvement
"S042"\tSector 35\tNorth\tAtul\tJaspreet \tKailash\t94.00%\tExcellent
"S014"\tTWC-Church street\tSouth\tJagruti\tLalitha\tMahadev\t84.00%\tGood
"S039"\tSector 07\tNorth\tAtul\tDeepanshi\tKailash\t90.00%\tExcellent
"S133"\tTWC-Fiza by Nexus Mall\tSouth\tUmakanth\tNikhil\tSheldon\t52.00%\tNeeds Improvement
"S139"\tTWC-Balmatta\tSouth\tUmakanth\tNitish\tSheldon\t49.00%\tNeeds Improvement
"S096"\tMahavir Nagar\tWest\tVruchika\tGaurav \tViraj\t86.00%\tGood
"S002"\tTWC-CMH Indira Nagar\tSouth\tAjay  H\tPuneet \tMahadev\t79.00%\tFair
"S170"\tPokhran Road\tWest\tSanjay\tHrishikesh \tViraj\t54.00%\tNeeds Improvement
"S022"\tTWC-Eco World Bay\tSouth\tUmakanth\tManikanta\tSheldon\t82.00%\tGood
"S034"\tTWC-Karthik Nagar - Marathahalli\tSouth\tAjay  H\tLaxminarayan \tSheldon\t69.00%\tNeeds Improvement
"S110"\tTWC-Phoenix Mall of Asia\tSouth\tNandish  M\tShad\tMahadev\t75.00%\tFair
"S167"\tAdvant Noida\tNorth\tVishu\tMr.Kamal\tBhawna\t62.00%\tNeeds Improvement
"S121"\tDLF Avenue Mall - Saket\tNorth\tHimanshu\tMr.Neeraj \tBhawna\t72.00%\tFair
"S089"\tViviana Mall\tWest\tSanjay\tPrathamesh & Shubham\tPriyanka\t48.00%\tNeeds Improvement
"S069"\tTWC-Vijaya Bank Layout\tSouth\tSuresh  A\tSukanay\tMallika\t78.00%\tFair`;

function parseTSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  const data = lines.map(line => {
    // Split by tab preserving quoted fields
    // Simple approach: split on \t then trim quotes
    const parts = line.split('\t').map(p => p.trim());
    return parts.map(p => {
      if (p.startsWith('"') && p.endsWith('"')) {
        return p.slice(1, -1);
      }
      return p;
    });
  });
  return data;
}

const data = parseTSV(raw);

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Store Health');

const outPath = path.join(__dirname, '..', 'actual.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Wrote', outPath);
