'use strict';

window.StudyData = (() => {
  let cached;

  async function fetchFile(path, asJson = false) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path} konnte nicht geladen werden (HTTP ${response.status}).`);
    return asJson ? response.json() : response.text();
  }

  async function readArchive() {
    if (!window.Papa) throw new Error('Die lokale PapaParse-Bibliothek fehlt.');
    const [stats, csv] = await Promise.all([
      fetchFile('data/stats.json', true),
      fetchFile('data/daily_summary.csv')
    ]);
    const parsed = Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
    if (parsed.errors.length) {
      console.error('Fehler in der Tagesdaten-CSV:', parsed.errors);
      throw new Error('Die Tagesdaten-CSV konnte nicht korrekt eingelesen werden. Einzelheiten stehen in der Browserkonsole.');
    }

    // Source sender names contain emoji suffixes; retain their exact keys for lookups.
    const jakobKey = Object.keys(stats.people).find(name => name === 'Jakob');
    const sinaKey = Object.keys(stats.people).find(name => name.startsWith('Sina'));
    if (!jakobKey || !sinaKey) throw new Error('Jakob und Sina wurden in der Statistik nicht gefunden.');
    const sinaColumn = `${sinaKey}_count`;
    if (!parsed.meta.fields.includes(sinaColumn) || !parsed.meta.fields.includes('Jakob_count')) {
      throw new Error('In der Tagesdaten-CSV fehlen die Zählspalten der Versuchspersonen.');
    }

    const daily = parsed.data.map(row => ({
      date: row.date,
      total: row.total,
      jakob: row.Jakob_count,
      sina: row[sinaColumn]
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Only the cumulative series is derived; precomputed aggregate statistics are never rebuilt.
    let jakob = 0;
    let sina = 0;
    const cumulative = daily.map(day => {
      jakob += day.jakob;
      sina += day.sina;
      return { date: day.date, jakob, sina, lead: jakob - sina };
    });
    return { stats, daily, cumulative, jakobKey, sinaKey };
  }

  return {
    load() {
      if (!cached) cached = readArchive();
      return cached;
    }
  };
})();
