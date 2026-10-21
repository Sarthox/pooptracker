'use strict';

(() => {
  const status = document.getElementById('status');

  function reportError(error) {
    console.error('Forschungsbericht:', error);
    status.className = 'error';
    status.setAttribute('role', 'alert');
    status.textContent = `${error.message} Bitte diesen Ordner über localhost bereitstellen. Die Ordner data und js/vendor müssen neben index.html erhalten bleiben.`;
  }

  async function bootstrap() {
    try {
      const archive = await StudyData.load();
      StudyStory.render(archive);
      await StudyCharts.render(archive);
      status.textContent = '';

      document.querySelectorAll('.export').forEach(button => {
        button.disabled = false;
        button.addEventListener('click', async () => {
          button.disabled = true;
          try {
            await StudyCharts.exportSvg(button.dataset.chart);
          } catch (error) {
            reportError(error);
          } finally {
            button.disabled = false;
          }
        });
      });

      const printButton = document.getElementById('print-report');
      printButton.disabled = false;
      printButton.addEventListener('click', async () => {
        printButton.disabled = true;
        printButton.textContent = 'Wird vorbereitet…';
        try {
          await StudyCharts.preparePrint();
          window.print();
        } catch (error) {
          reportError(error);
        } finally {
          printButton.disabled = false;
          printButton.textContent = 'Bericht drucken';
        }
      });
    } catch (error) {
      reportError(error);
    }
  }

  bootstrap();
})();
