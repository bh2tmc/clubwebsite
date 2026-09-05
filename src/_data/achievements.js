const SHEET_ID = '1_tPHsdo3uL3gPR41LXiT23axpvVjhIMZGGGDs5Xx5i0';
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

async function fetchSheet(sheetName) {
  if (!API_KEY) {
    console.warn('[achievements] GOOGLE_SHEETS_API_KEY not set, using fallback');
    return null;
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[achievements] Failed to fetch ${sheetName}: ${res.status}`);
    return null;
  }
  const json = await res.json();
  const rows = json.values || [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] || '']))
  );
}

function sortByYear(arr, key) {
  return arr.slice().sort((a, b) => parseInt(b[key]) - parseInt(a[key]));
}

module.exports = async function() {
  const [clubAwards, presidents, contestWins, areaGovernors] = await Promise.all([
    fetchSheet('ClubAwards'),
    fetchSheet('Presidents'),
    fetchSheet('ContestWins'),
    fetchSheet('AreaGovernors'),
  ]);

  // If any fetch failed, fall back to the static JSON
  if (!clubAwards || !presidents || !contestWins || !areaGovernors) {
    return require('./achievements-fallback.json');
  }

  return {
    clubAwards: sortByYear(clubAwards.map(r => ({ year: r.Year, award: r.Award, notes: r.Notes })), 'year'),
    presidents: presidents.map(r => ({ term: r.Term, number: r.Number, name: r.Name, note: r.Note }))
      .sort((a, b) => parseInt(b.number) - parseInt(a.number)),
    contestWins: sortByYear(contestWins.map(r => ({ year: r.Year, member: r.Member, achievement: r.Achievement })), 'year'),
    areaGovernors: sortByYear(areaGovernors.map(r => ({ term: r.Term, name: r.Name, role: r.Role })), 'term'),
    clubHistory: "Braddell Heights II Toastmasters Club was chartered in June 1998, having evolved along with three other clubs from the original Braddell Heights Toastmasters Club (chartered in 1990, the third CC-based Toastmasters club in Singapore). In its very first year under founding President Linda Ong, BH II achieved the World No. 5 Club ranking, the International Hall of Fame 1999 award, and the President's Distinguished Club title. BH II has gone on to achieve the President's Distinguished Club award every year since, a record that speaks to the dedication of every officer team and member across more than two decades."
  };
};
