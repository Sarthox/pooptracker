'use strict';

window.StudyCharts = (() => {
  const colors = {
    jakob: '#795548', sina: '#AA66FF', ink: '#263238',
    olive: '#606C38', forest: '#283618', sand: '#DDA15E', paper: '#E8EEDF'
  };
  const chartIds = [];
  const config = { responsive: true, displayModeBar: false, scrollZoom: false, locale: 'de' };
  const axis = {
    gridcolor: 'rgba(40,54,24,0.16)', zeroline: false, automargin: true,
    tickfont: { size: 10, color: colors.ink }, fixedrange: true
  };

  function draw(id, traces, options = {}) {
    const layout = {
      paper_bgcolor: colors.paper, plot_bgcolor: colors.paper,
      separators: ',.',
      font: { family: 'Arial, sans-serif', size: 11, color: colors.ink },
      margin: { l: 44, r: 18, t: 24, b: 46 },
      xaxis: { ...axis }, yaxis: { ...axis, rangemode: 'tozero' },
      legend: { orientation: 'h', x: 0, y: 1.16, font: { size: 11 } },
      hoverlabel: { bgcolor: colors.paper, font: { family: 'Arial, sans-serif', size: 12 } },
      ...options
    };
    chartIds.push(id);
    return Plotly.newPlot(id, traces, layout, config);
  }

  function participantBars(counts, jakobKey, sinaKey) {
    const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
    return [[jakobKey, 'Jakob', colors.jakob], [sinaKey, 'Sina', colors.sina]].map(([key, name, color]) => ({
      type: 'bar', name, x: entries.map(([period]) => period),
      y: entries.map(([, values]) => values[key]), marker: { color },
      hovertemplate: `%{x}<br>${name}: %{y} Ereignisse<extra></extra>`
    }));
  }

  async function render({ stats, daily, cumulative, jakobKey, sinaKey }) {
    if (!window.Plotly) throw new Error('Die lokale Plotly-Bibliothek fehlt.');
    Plotly.register({
      moduleType: 'locale', name: 'de', dictionary: {},
      format: {
        days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
        shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        shortMonths: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
        date: '%d.%m.%Y', dateTime: '%A, %e. %B %Y, %X', time: '%H:%M:%S',
        periods: ['vorm.', 'nachm.'], decimal: ',', thousands: '.', grouping: [3], currency: ['', ' €']
      }
    });
    const overall = stats.overall;
    const dates = cumulative.map(row => row.date);
    // Render sequentially to keep the initial workload modest on small devices.
    await draw('championship', [
      {
        type: 'scatter', mode: 'lines', name: 'Jakob führt die Wurstliga', x: dates,
        y: cumulative.map(row => Math.max(0, row.lead)),
        line: { color: colors.jakob, width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(121,85,72,0.12)',
        customdata: cumulative.map(row => row.lead),
        hovertemplate: '%{x|%d %b %Y}<br>Jakob minus Sina: %{customdata:+d}<extra></extra>'
      },
      {
        type: 'scatter', mode: 'lines', name: 'Sina führt die Wurstliga', x: dates,
        y: cumulative.map(row => Math.min(0, row.lead)),
        line: { color: colors.sina, width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(170,102,255,0.12)',
        hoverinfo: 'skip'
      }
    ], {
      xaxis: { ...axis, type: 'date', nticks: 6 },
      yaxis: { ...axis, title: { text: 'Haufen-Vorsprung (Meldungen)', font: { size: 11 } }, zeroline: true, zerolinecolor: '#a8a4a0' }
    });

    await draw('cumulative', [
      ['jakob', 'Jakob', colors.jakob], ['sina', 'Sina', colors.sina]
    ].map(([key, name, color]) => ({
      type: 'scatter', mode: 'lines', name, x: dates, y: cumulative.map(row => row[key]),
      line: { color, width: 2.5 },
      hovertemplate: `%{x|%d %b %Y}<br>${name}: %{y} Haufenmeldungen<extra></extra>`
    })), { xaxis: { ...axis, type: 'date', nticks: 4 }, yaxis: { ...axis, title: 'Haufenmeldungen' } });

    await draw('share', [{
      type: 'pie', labels: ['Jakob', 'Sina'],
      values: [overall.share_by_person_percent[jakobKey], overall.share_by_person_percent[sinaKey]],
      hole: .72, sort: false, direction: 'clockwise',
      marker: { colors: [colors.jakob, colors.sina], line: { color: colors.paper, width: 3 } },
      textinfo: 'label+value', texttemplate: '%{label}<br>%{value:.2f} %', textposition: 'outside',
      hovertemplate: '%{label}: %{value:.2f} %<extra></extra>', showlegend: false
    }], {
      margin: { l: 48, r: 48, t: 30, b: 30 },
      annotations: [{ text: `${overall.event_count.toLocaleString('de-DE')}<br><span style="font-size:11px">Haufenmeldungen</span>`,
        showarrow: false, x: .5, y: .5, font: { family: 'Georgia, serif', size: 28 } }]
    });

    await draw('monthly', participantBars(overall.monthly_counts, jakobKey, sinaKey), {
      barmode: 'stack', bargap: .28,
      xaxis: { ...axis, type: 'date', tickformat: '%b %Y', dtick: 'M4' }, yaxis: { ...axis, title: 'Haufenmeldungen' }
    });
    await draw('yearly', participantBars(overall.yearly_counts, jakobKey, sinaKey), {
      barmode: 'stack', bargap: .5, xaxis: { ...axis, type: 'category' }, yaxis: { ...axis, title: 'Haufenmeldungen' }
    });

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekdayLabels = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    await draw('weekday', [{
      type: 'bar', x: weekdayLabels.map(day => day.slice(0, 2)), y: weekdays.map(day => overall.weekday_counts[day]),
      customdata: weekdayLabels, marker: { color: colors.ink },
      hovertemplate: '%{customdata}: %{y} Haufenmeldungen<extra></extra>'
    }], { yaxis: { ...axis, title: 'Haufenmeldungen' }, bargap: .35 });

    const seasons = ['Winter', 'Frühling', 'Sommer', 'Herbst'];
    await draw('seasonal', [{
      type: 'pie', labels: seasons,
      values: seasons.map(season => overall.season_counts[season]),
      hole: .6, sort: false, textinfo: 'label+value', textposition: 'outside', showlegend: false,
      marker: { colors: [colors.olive, '#d6b8f6', colors.sand, colors.forest], line: { color: colors.paper, width: 3 } },
      hovertemplate: '%{label}: %{value} Haufenmeldungen<extra></extra>'
    }], { margin: { l: 55, r: 55, t: 30, b: 30 } });

    const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
    const peakHour = overall.most_active_hour.hour_range.slice(0, 2);
    await draw('hourly', [{
      type: 'bar', x: hours.map(hour => `${hour}:00`), y: hours.map(hour => overall.hourly_counts[hour]),
      marker: { color: hours.map(hour => hour === peakHour ? colors.sina : colors.sand) },
      hovertemplate: '%{x} Uhr: %{y} Haufenmeldungen<extra></extra>'
    }], {
      bargap: .22, xaxis: { ...axis, type: 'category', tickvals: ['00:00', '06:00', '09:00', '12:00', '18:00', '23:00'], tickangle: -45 },
      yaxis: { ...axis, title: 'Haufenmeldungen' },
      annotations: [{ x: `${peakHour}:00`, y: overall.most_active_hour.count, text: `${overall.most_active_hour.count} Haufen`,
        showarrow: false, yshift: 14, font: { size: 11, color: '#8642d3' } }]
    });

    const months = Object.keys(overall.monthly_counts).sort();
    const days = Array.from({ length: 31 }, (_, index) => index + 1);
    const byDate = new Map(daily.map(day => [day.date, day]));
    const rows = months.map(month => days.map(day => byDate.get(`${month}-${String(day).padStart(2, '0')}`)));
    await draw('heatmap', [{
      type: 'heatmap', x: days, y: months,
      z: rows.map(row => row.map(day => day ? day.total : null)),
      customdata: rows.map(row => row.map(day => day ? [day.date.split('-').reverse().join('.'), day.jakob, day.sina] : ['', null, null])),
      zmin: 0, zmax: overall.most_active_day.total, xgap: 3, ygap: 3, hoverongaps: false,
      colorscale: [[0, colors.paper], [.125, '#e5dfbd'], [.35, colors.sand], [.65, colors.olive], [1, colors.forest]],
      colorbar: { title: { text: 'Ereignisse', side: 'right' }, thickness: 8, len: .5, tickvals: [0, 2, 4, 6, 8], outlinewidth: 0 },
      hovertemplate: '%{customdata[0]}<br>Haufen gesamt: %{z}<br>Jakob: %{customdata[1]}<br>Sina: %{customdata[2]}<extra></extra>'
    }], {
      margin: { l: 70, r: 55, t: 36, b: 12 },
      xaxis: { ...axis, side: 'top', tickmode: 'linear', dtick: 1, showgrid: false, title: '' },
      yaxis: { ...axis, type: 'category', autorange: 'reversed', showgrid: false, tickmode: 'array',
        tickvals: months, ticktext: months.map(month => new Date(`${month}-01T00:00:00Z`).toLocaleDateString('de-DE', { month: 'short', year: 'numeric', timeZone: 'UTC' })) }
    });

    const minutes = [5, 15, 30, 60];
    await draw('synchronization', [{
      type: 'bar', orientation: 'h', y: minutes.map(value => `Bis ${value} Min.`),
      x: minutes.map(value => overall.cross_person_timing.thresholds[`cross_person_transitions_within_${value}_minutes`]),
      marker: { color: ['#795548', '#997869', '#b99adf', '#aa66ff'] },
      textposition: 'outside', texttemplate: '%{x}', cliponaxis: false,
      hovertemplate: '%{y}: %{x} Wechsel bei der Wurst-Staffel<extra></extra>'
    }], {
      margin: { l: 100, r: 50, t: 10, b: 45 },
      xaxis: { ...axis, title: 'Wurst-Staffelwechsel' },
      yaxis: { ...axis, autorange: 'reversed', type: 'category', showgrid: false }, bargap: .4
    });

    const participants = [[jakobKey, 'Jakob', colors.jakob], [sinaKey, 'Sina', colors.sina]];
    function personalBars(field, keys, labels) {
      return participants.map(([key, name, color]) => ({
        type: 'bar', name, x: labels, y: keys.map(bucket => stats.people[key][field][bucket]),
        marker: { color },
        hovertemplate: `${name}<br>%{x}: %{y} Haufenmeldungen<extra></extra>`
      }));
    }
    await draw('personal-hourly', personalBars('hourly_counts', hours, hours.map(hour => `${hour}:00`)), {
      barmode: 'group', bargap: .2,
      xaxis: { ...axis, type: 'category', tickvals: ['00:00', '06:00', '09:00', '12:00', '18:00', '23:00'], title: 'Tagesstunde', tickangle: -45 },
      yaxis: { ...axis, title: 'Haufenmeldungen' }
    });
    await draw('personal-weekday', personalBars('weekday_counts', weekdays, weekdayLabels), {
      barmode: 'group', bargap: .3,
      xaxis: { ...axis, type: 'category', tickvals: weekdayLabels, ticktext: weekdayLabels.map(day => day.slice(0, 2)) },
      yaxis: { ...axis, title: 'Haufenmeldungen' }
    });
    await draw('personal-seasonal', personalBars('season_counts', seasons, seasons), {
      barmode: 'group', bargap: .35,
      xaxis: { ...axis, type: 'category' }, yaxis: { ...axis, title: 'Haufenmeldungen' }
    });
  }

  function roundSvgBackground(dataUrl) {
    const svg = decodeURIComponent(dataUrl.slice(dataUrl.indexOf(',') + 1));
    const rounded = svg.replace(/<rect\b(?=[^>]*\bclass="bg")[^>]*\/?>/, match =>
      match.replace(/\s*\/?>$/, ending => ` rx="10" ry="10"${ending}`)
    );
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rounded)}`;
  }

  function imageOptions(id) {
    return { format: 'svg', width: 1000, height: id === 'heatmap' ? 1200 : 420 };
  }

  function printImageOptions(id, compact) {
    return {
      format: 'svg',
      width: compact ? 235 : 484,
      height: id === 'heatmap' ? 620 : compact ? 188 : 215
    };
  }

  async function exportSvg(id) {
    const url = roundSvgBackground(await Plotly.toImage(document.getElementById(id), imageOptions(id)));
    const link = document.createElement('a');
    link.href = url;
    link.download = `emoji-studie-${id}.svg`;
    document.body.append(link);
    link.click();
    link.remove();
  }

  async function preparePrint() {
    for (const id of chartIds) {
      const plot = document.getElementById(id);
      const figure = plot.closest('figure');
      if (figure.querySelector('.print-image')) continue;
      const image = new Image();
      image.className = 'print-image';
      image.alt = plot.getAttribute('aria-label');
      image.src = roundSvgBackground(await Plotly.toImage(
        plot, printImageOptions(id, Boolean(plot.closest('.chart-pair')))
      ));
      await image.decode();
      figure.append(image);
      figure.classList.add('print-ready');
    }
  }

  return { render, exportSvg, preparePrint };
})();
