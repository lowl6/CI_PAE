export function formatNumber(n){ return n==null?'-':Number(n).toLocaleString() }
export function sleep(ms){ return new Promise(r=>setTimeout(r, ms)) }
