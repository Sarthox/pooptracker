'use strict';

window.StudyStory = (() => {
  const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
  const date = value => new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString('de-DE', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  });
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  const precise = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 4 });
  const secondsNumber = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 3 });
  const timestamp = value => `${date(value)} · ${value.slice(11)} Uhr`;

  function duration(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = Number((seconds % 60).toFixed(3));
    return [
      days ? `${days} T.` : '',
      hours ? `${hours} Std.` : '',
      minutes ? `${minutes} Min.` : '',
      remainder || seconds === 0 ? `${secondsNumber.format(remainder)} Sek.` : ''
    ].filter(Boolean).join(' ');
  }

  function recordCards(id, records) {
    document.getElementById(id).replaceChildren(...records.map(([label, value, note, css = '']) =>
      card('record', [['span', 'record-label', label], ['span', `record-value ${css}`, value], ['p', '', note]])
    ));
  }

  function tableRows(id, rows) {
    document.getElementById(id).replaceChildren(...rows.map(values => {
      const row = document.createElement('tr');
      values.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) cell.scope = 'row';
        cell.textContent = value;
        row.append(cell);
      });
      return row;
    }));
  }

  function renderAppendix(stats, jakobKey, sinaKey) {
    const overall = stats.overall;
    const participants = [[jakobKey, 'Jakob', 'jakob'], [sinaKey, 'Sina', 'sina']];
    recordCards('activity-cards', [
      ['Aktive Tage', number.format(overall.active_days_anyone), 'Mindestens eine Person hat ein Ereignis dokumentiert.'],
      ['Tage mit beiden Personen', number.format(overall.days_both_people_active), 'Doppelt besetzter Forschungsbetrieb.'],
      ['Tage ohne Meldung', number.format(overall.days_with_no_matching_event_in_observed_range), 'Keine passende Nachricht im beobachteten Zeitraum.'],
      ['Ereignisse je aktivem Tag', precise.format(overall.overall_average_per_active_day), 'Gemeinsamer Durchschnitt, nur über Tage mit mindestens einem Ereignis.']
    ]);

    document.getElementById('personal-profiles').replaceChildren(...participants.map(([key, name, css]) => {
      const person = stats.people[key];
      const profile = card(`detail-card personal-profile ${css}`, [
        ['span', 'eyebrow', 'Individuelle Leistungsakte'],
        ['h3', '', name],
        ['p', '', 'Persönliche Kennzahlen. Ohne Leistungsbeurteilung durch die Personalabteilung.']
      ]);
      const list = document.createElement('dl');
      const facts = [
        ['Dokumentierte Ereignisse', number.format(person.count)],
        ['Anteil am Gesamtaufkommen', `${number.format(person.share_percent)} %`],
        ['Aktive Kalendertage', number.format(person.active_days)],
        ['Ereignisse je Kalendertag', precise.format(person.average_per_calendar_day_in_observed_period)],
        ['Ereignisse je eigenem aktivem Tag', precise.format(person.average_per_active_day)],
        ['Persönliche Spitzenstunde', `${person.most_active_hour} Uhr`],
        ['Erste Meldung', timestamp(person.first_event)],
        ['Letzte Meldung', timestamp(person.last_event)]
      ];
      for (const [label, value] of facts) {
        const term = document.createElement('dt');
        const detail = document.createElement('dd');
        term.textContent = label;
        detail.textContent = value;
        list.append(term, detail);
      }
      profile.append(list);
      profile.append(card('appendix-note', [['p', '', 'Kalendertagesmittel beziehen sich auf den gesamten gemeinsamen Beobachtungszeitraum; Aktivtagesmittel nur auf eigene Tage mit mindestens einer Meldung.']]));
      return profile;
    }));

    const intervalSummary = summary => [
      number.format(summary.count), duration(summary.mean_seconds), duration(summary.median_seconds),
      duration(summary.min_seconds), duration(summary.max_seconds)
    ];
    tableRows('interval-rows', [
      ['Gesamtes Archiv', ...intervalSummary(overall.overall_intervals_between_consecutive_events)],
      ...participants.map(([key, name]) => [name, ...intervalSummary(stats.people[key].intervals_between_own_events)])
    ]);
    recordCards('personal-gap-cards', participants.flatMap(([key, name]) => {
      const person = stats.people[key];
      return [
        ['shortest_own_interval', 'Kürzester eigener Abstand'],
        ['longest_own_interval', 'Längster eigener Abstand']
      ].map(([field, label]) => {
        const interval = person[field];
        return [`${name} · ${label}`, duration(interval.seconds),
          `${timestamp(interval.from)} → ${timestamp(interval.to)}`, 'compact'];
      });
    }));

    const streaks = [
      ['Mindestens eine Person aktiv', overall.active_day_streak_anyone],
      ['Beide Personen aktiv', overall.active_day_streak_both_people],
      ...participants.map(([key, name]) => [`${name} aktiv`, stats.people[key].active_day_streak])
    ];
    tableRows('streak-rows', streaks.map(([label, streak]) => [
      label, `${number.format(streak.longest_days)} Tage`, date(streak.start), date(streak.end), number.format(streak.streak_count)
    ]));
    tableRows('waiting-rows', participants.map(([key, name]) => [
      `${name} → ${key === jakobKey ? 'Sina' : 'Jakob'}`,
      ...intervalSummary(overall.next_other_person_event_after_each_person_event[key])
    ]));
  }

  function card(className, entries) {
    const element = document.createElement('div');
    element.className = className;
    for (const [tag, css, value] of entries) {
      const child = document.createElement(tag);
      child.className = css;
      child.textContent = value;
      element.append(child);
    }
    return element;
  }

  function render({ stats, jakobKey, sinaKey }) {
    const overall = stats.overall;
    const range = stats.metadata.date_range;
    text('sample-size', number.format(overall.event_count));
    text('observation-period', `${date(range.start)} – ${date(range.end)}`);
    const kpis = [
      [overall.event_count, 'Ereignisse insgesamt', ''],
      [overall.observed_calendar_days_inclusive, 'Beobachtungstage', ''],
      [overall.total_by_person[jakobKey], 'Ereignisse von Jakob', 'jakob'],
      [overall.total_by_person[sinaKey], 'Ereignisse von Sina', 'sina'],
      [overall.overall_average_per_calendar_day, 'Durchschnitt je Kalendertag', ''],
      [overall.active_day_streak_anyone.longest_days, 'Längste aktive Serie · Tage', '']
    ];
    document.getElementById('kpis').replaceChildren(...kpis.map(([value, label, css]) =>
      card(`kpi ${css}`, [['span', 'kpi-value', number.format(value)], ['span', 'kpi-label', label]])
    ));

    const lead = overall.total_by_person[jakobKey] - overall.total_by_person[sinaKey];
    text('lead-summary', lead === 0 ? 'Endstand: unentschieden.' :
      `Endstand: ${lead > 0 ? 'Jakob' : 'Sina'} führt mit ${number.format(Math.abs(lead))} Ereignissen.`);
    text('share-summary', `Jakob ${number.format(overall.share_by_person_percent[jakobKey])} % · Sina ${number.format(overall.share_by_person_percent[sinaKey])} %. Arbeitsteilung, wenn man so möchte.`);
    text('peak-summary', `Spitzenstunde: ${overall.most_active_hour.hour_range} Uhr · ${number.format(overall.most_active_hour.count)} Ereignisse. Die Morgenbesprechung, die niemand angesetzt hat.`);
    text('morning-finding', `Die aktivste dokumentierte Stunde ist ${overall.most_active_hour.hour_range} Uhr mit ${number.format(overall.most_active_hour.count)} Ereignissen. Das Archiv zeigt eine klare Präferenz dafür, die Dinge frühzeitig hinter sich zu bringen.`);
    text('summer-finding', `Mit ${number.format(overall.season_counts.Sommer)} dokumentierten Ereignissen verzeichnet der Sommer den höchsten saisonalen Rohwert. Unterschiedliche Beobachtungsdauern verhindern einen fairen Ratenvergleich. Eine Beteiligung der Sonne bleibt unbewiesen.`);
    text('event-definition', 'Eine Nachricht zählt genau einmal, wenn ihr vollständiger Inhalt nach Entfernen äußerer Leerzeichen exakt dem festgelegten Emoji entspricht. Zusätzlicher Text, weitere Emojis und mehrzeilige Inhalte zählen nicht. Die Erfassung kennt kein „fast richtig“.');
    text('archive-date', `Archiv erstellt am ${date(stats.metadata.generated_at)}`);

    const busiest = overall.most_active_day;
    const closest = overall.cross_person_timing.closest_pair;
    const gap = overall.longest_consecutive_event_gap;
    const streak = overall.active_day_streak_anyone;
    const records = [
      ['Produktivster Tag', `${number.format(busiest.total)} Ereignisse`, `${date(busiest.date)} · Jakob ${busiest.by_person[jakobKey]} / Sina ${busiest.by_person[sinaKey]}`, ''],
      ['Kürzester Abstand zwischen Personen', `${number.format(closest.gap_seconds)} Sekunden`, `${date(closest.from_timestamp)} · ${closest.from_timestamp.slice(11)} → ${closest.to_timestamp.slice(11)} Uhr`, ''],
      ['Längste Sendepause', gap.formatted.replace(/(\d+)([dhms])/g, (_, value, unit) => `${value} ${{ d: 'T.', h: 'Std.', m: 'Min.', s: 'Sek.' }[unit]}`), `${date(gap.from_timestamp)} → ${date(gap.to_timestamp)}. Vorgänge außerhalb des Chats unbekannt.`, 'compact'],
      ['Längste aktive Serie', `${number.format(streak.longest_days)} Tage`, `${date(streak.start)} → ${date(streak.end)} · Täglich mindestens eine Person aktiv.`, '']
    ];
    document.getElementById('record-cards').replaceChildren(...records.map(([label, value, note, css]) =>
      card('record', [['span', 'record-label', label], ['span', `record-value ${css}`, value], ['p', '', note]])
    ));
    renderAppendix(stats, jakobKey, sinaKey);
  }
  return { render };
})();
