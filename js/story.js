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
      ['Aktive Tage', number.format(overall.active_days_anyone), 'Mindestens eine Wurst aktenkundig.'],
      ['Gemeinsame Geschäftstage', number.format(overall.days_both_people_active), 'Doppelschicht auf dem stillen Örtchen.'],
      ['Tage ohne Meldung', number.format(overall.days_with_no_matching_event_in_observed_range), 'Im Chat blieb die Schüssel leer.'],
      ['Ereignisse je aktivem Tag', precise.format(overall.overall_average_per_active_day), 'Haufenmittel an Tagen mit Meldung.']
    ]);

    document.getElementById('personal-profiles').replaceChildren(...participants.map(([key, name, css]) => {
      const person = stats.people[key];
      const profile = card(`detail-card personal-profile ${css}`, [
        ['span', 'eyebrow', 'Persönliche Wurst-Akte'],
        ['h3', '', name],
        ['p', '', 'Die eigene Haufenbilanz. Von der Personalabteilung nicht anerkannt.']
      ]);
      const list = document.createElement('dl');
      const facts = [
        ['Aktenkundige Haufen', number.format(person.count)],
        ['Anteil am Wurstaufkommen', `${number.format(person.share_percent)} %`],
        ['Aktive Kalendertage', number.format(person.active_days)],
        ['Geschäfte je Kalendertag', precise.format(person.average_per_calendar_day_in_observed_period)],
        ['Geschäfte je eigenem Aktivtag', precise.format(person.average_per_active_day)],
        ['Hauptgeschäftszeit', `${person.most_active_hour} Uhr`],
        ['Erste Aktennotiz', timestamp(person.first_event)],
        ['Letzter Stuhlgangsbericht', timestamp(person.last_event)]
      ];
      for (const [label, value] of facts) {
        const term = document.createElement('dt');
        const detail = document.createElement('dd');
        term.textContent = label;
        detail.textContent = value;
        list.append(term, detail);
      }
      profile.append(list);
      profile.append(card('appendix-note', [['p', '', 'Aktivtage zählen persönliche Haufen, nicht bloß Anwesenheit im Gruppenchat.']]));
      return profile;
    }));

    const intervalSummary = summary => [
      number.format(summary.count), duration(summary.mean_seconds), duration(summary.median_seconds),
      duration(summary.min_seconds), duration(summary.max_seconds)
    ];
    tableRows('interval-rows', [
      ['Haufen zu Haufen', ...intervalSummary(overall.overall_intervals_between_consecutive_events)],
      ...participants.map(([key, name]) => [name, ...intervalSummary(stats.people[key].intervals_between_own_events)])
    ]);
    recordCards('personal-gap-cards', participants.flatMap(([key, name]) => {
      const person = stats.people[key];
      return [
        ['shortest_own_interval', 'Kürzester eigener Abstand'],
        ['longest_own_interval', 'Längster eigener Abstand']
      ].map(([field, label]) => {
        const interval = person[field];
        const wittyLabel = field === 'shortest_own_interval' ? 'Sprint zur Schüssel' : 'Längste Wurstpause';
        return [`${name} · ${wittyLabel}`, duration(interval.seconds),
          `${timestamp(interval.from)} → ${timestamp(interval.to)}`, 'compact'];
      });
    }));

    const streaks = [
      ['Mindestens eine Wurst im Rennen', overall.active_day_streak_anyone],
      ['Beide auf Haufenmission', overall.active_day_streak_both_people],
      ...participants.map(([key, name]) => [`${name}: tägliches Geschäft`, stats.people[key].active_day_streak])
    ];
    tableRows('streak-rows', streaks.map(([label, streak]) => [
      label, `${number.format(streak.longest_days)} Tage`, date(streak.start), date(streak.end), number.format(streak.streak_count)
    ]));
    tableRows('waiting-rows', participants.map(([key, name]) => [
      `${name} → ${key === jakobKey ? 'Sina' : 'Jakob'}: Wurst-Staffel`,
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
      [overall.event_count, 'Haufenmeldungen insgesamt', ''],
      [overall.observed_calendar_days_inclusive, 'Aktenkundige Tage', ''],
      [overall.total_by_person[jakobKey], 'Jakobs Haufenmeldungen', 'jakob'],
      [overall.total_by_person[sinaKey], 'Sinas Haufenmeldungen', 'sina'],
      [overall.overall_average_per_calendar_day, 'Haufen pro Kalendertag', ''],
      [overall.active_day_streak_anyone.longest_days, 'Darm im Dienst · Tage', '']
    ];
    document.getElementById('kpis').replaceChildren(...kpis.map(([value, label, css]) =>
      card(`kpi ${css}`, [['span', 'kpi-value', number.format(value)], ['span', 'kpi-label', label]])
    ));

    const lead = overall.total_by_person[jakobKey] - overall.total_by_person[sinaKey];
    text('lead-summary', lead === 0 ? 'Endstand: Haufen-Gleichstand.' :
      `Endstand: ${lead > 0 ? 'Jakob' : 'Sina'} führt die Wurstliga mit ${number.format(Math.abs(lead))} Haufen.`);
    text('share-summary', `Jakob ${number.format(overall.share_by_person_percent[jakobKey])} % · Sina ${number.format(overall.share_by_person_percent[sinaKey])} %. Eine runde Wurstaufteilung.`);
    text('peak-summary', `Spitzenzeit: ${overall.most_active_hour.hour_range} Uhr · ${number.format(overall.most_active_hour.count)} Haufen. Die Frühschicht fragt nicht nach Dienstbeginn.`);
    text('morning-finding', `${overall.most_active_hour.hour_range} Uhr: ${number.format(overall.most_active_hour.count)} Meldungen. Der Darm stempelt früh ein.`);
    text('summer-finding', `${number.format(overall.season_counts.Sommer)} Meldungen machen den Sommer zum Haufenmeister. Beobachtungszeiten variieren; die Sonne bleibt unverdächtig.`);
    text('event-definition', 'Ein Geschäft zählt nur, wenn der bereinigte Nachrichteninhalt exakt dem vereinbarten Emoji entspricht. Beitext, Zusatz-Emoji oder mehrzeilige Wurst: nicht gewertet. Die Erfassung kennt kein „fast ein Haufen“.');
    text('archive-date', `Haufenarchiv erstellt am ${date(stats.metadata.generated_at)}`);

    const busiest = overall.most_active_day;
    const closest = overall.cross_person_timing.closest_pair;
    const gap = overall.longest_consecutive_event_gap;
    const streak = overall.active_day_streak_anyone;
    const records = [
      ['Haufen-Hochsaison', `${number.format(busiest.total)} Meldungen`, `${date(busiest.date)} · Jakob ${busiest.by_person[jakobKey]} / Sina ${busiest.by_person[sinaKey]} · Gleichstand auf der Schüssel.`, ''],
      ['Blitz-Wurst zwischen Personen', `${number.format(closest.gap_seconds)} Sekunden`, `${timestamp(closest.from_timestamp)} → ${timestamp(closest.to_timestamp)}`, ''],
      ['Die längste Stille im Porzellanpalast', gap.formatted.replace(/(\d+)([dhms])/g, (_, value, unit) => `${value} ${{ d: 'T.', h: 'Std.', m: 'Min.', s: 'Sek.' }[unit]}`), `${date(gap.from_timestamp)} → ${date(gap.to_timestamp)}. Offline-Geschäfte bleiben Privatsache.`, 'compact'],
      ['Dauerbetrieb am stillen Örtchen', `${number.format(streak.longest_days)} Tage`, `${date(streak.start)} → ${date(streak.end)} · Mindestens ein Darm im Dienst.`, '']
    ];
    document.getElementById('record-cards').replaceChildren(...records.map(([label, value, note, css]) =>
      card('record', [['span', 'record-label', label], ['span', `record-value ${css}`, value], ['p', '', note]])
    ));
    renderAppendix(stats, jakobKey, sinaKey);
  }
  return { render };
})();
