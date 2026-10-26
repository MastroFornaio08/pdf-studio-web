'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const {GitHub, formats, validateFile} = PdfGitHub;
  let client = null, chosen = null, busy = false, source = null, runId = null, timer = null, generation = 0;
  const names = {pdf_to_word: 'Word', pdf_to_excel: 'Excel', pdf_to_text: 'testo', pdf_to_png: 'PNG',
    pdf_to_jpg: 'JPG', office_to_pdf: 'PDF', images_to_pdf: 'PDF'};
  const dialog = $('connection-dialog');
  function notice(message = '') { $('notice').textContent = message; $('notice').hidden = !message; }
  function refresh() {
    $('convert-button').disabled = !client || !chosen || busy || (!client.private && !$('public-consent').checked);
    $('connection-button').disabled = busy;
    $('dropzone').disabled = busy;
    $('operation').disabled = busy;
    document.querySelectorAll('[data-operation]').forEach(button => { button.disabled = busy; });
  }
  function operationChanged() {
    const operation = $('operation').value;
    document.querySelectorAll('[data-operation]').forEach(button => {
      const selected = operation === button.dataset.operation;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', selected);
    });
    $('convert-button').replaceChildren(document.createTextNode(`Converti in ${names[operation]} `));
    const arrow = document.createElement('span'); arrow.textContent = '↗'; $('convert-button').append(arrow);
    $('file-input').accept = formats[operation].map(extension => '.' + extension).join(',');
    const pdf = operation.startsWith('pdf_');
    $('format-note').textContent = operation === 'pdf_to_excel'
      ? 'Estrae tabelle delimitate da bordi. Non ricostruisce formule o l’intero foglio originale.'
      : pdf && !['pdf_to_png', 'pdf_to_jpg'].includes(operation)
        ? 'Serve un PDF con testo selezionabile. Le scansioni richiedono OCR, non incluso.'
        : operation === 'images_to_pdf' ? 'Un PDF per immagine. I TIFF multipagina conservano tutti i frame.'
          : operation === 'office_to_pdf' ? 'Conversione con LibreOffice. Font e impaginazione possono differire dall’originale.'
            : 'Un’immagine per pagina, a 150 DPI. Funziona anche con PDF scansionati.';
    $('file-title').textContent = chosen ? chosen.name : pdf ? 'Trascina qui il tuo PDF' : 'Trascina qui il tuo file';
    $('file-tag').textContent = formats[operation].map(s => s.toUpperCase()).join(' / ') + ' · FINO A 20 MB';
    if (chosen) {
      try { validateFile(chosen, operation); notice(); }
      catch (error) { chosen = null; $('file-input').value = ''; notice(error.message); $('file-title').textContent = 'Scegli un file compatibile'; $('file-description').textContent = 'Clicca o trascina qui il nuovo file'; }
    }
    refresh();
  }
  function pick(file) {
    if (busy) return;
    try {
      validateFile(file, $('operation').value);
      chosen = file;
      $('public-consent').checked = false;
      $('file-title').textContent = file.name;
      $('file-description').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · clicca per sostituire`;
      notice();
    } catch (error) { notice(error.message); }
    refresh();
  }
  $('operation').addEventListener('change', operationChanged);
  document.querySelectorAll('[data-operation]').forEach(button => button.addEventListener('click', () => {
    $('operation').value = button.dataset.operation; operationChanged();
  }));
  $('dropzone').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', event => pick(event.target.files[0]));
  ['dragover', 'dragenter'].forEach(type => $('dropzone').addEventListener(type, event => {
    event.preventDefault(); if (!busy) $('dropzone').classList.add('dragging');
  }));
  ['dragleave', 'drop'].forEach(type => $('dropzone').addEventListener(type, event => {event.preventDefault(); $('dropzone').classList.remove('dragging');}));
  $('dropzone').addEventListener('drop', event => {
    if (event.dataTransfer.files.length !== 1) return notice('Carica un solo file alla volta.');
    pick(event.dataTransfer.files[0]);
  });
  // Evita che un file trascinato fuori dall'area sostituisca la pagina corrente.
  window.addEventListener('dragover', event => event.preventDefault());
  window.addEventListener('drop', event => event.preventDefault());
  $('public-consent').addEventListener('change', refresh);
  $('connection-button').addEventListener('click', () => { $('connection-error').textContent = ''; dialog.showModal(); });
  $('close-dialog').addEventListener('click', () => { $('token').value = ''; dialog.close(); });
  dialog.addEventListener('cancel', () => { $('token').value = ''; });
  $('connection-form').addEventListener('submit', async event => {
    event.preventDefault();
    const candidate = $('token').value;
    $('token').value = '';
    $('connection-error').textContent = '';
    $('connect-submit').disabled = true;
    $('close-dialog').disabled = true;
    let next;
    try {
      next = new GitHub($('owner').value.trim(), $('repository').value.trim(), candidate);
      const repository = await next.connect();
      if (client) client.clear();
      client = next;
      generation++; clearTimeout(timer); source = null; runId = null;
      $('progress-card').hidden = true;
      $('connection-label').textContent = `${client.owner} / ${client.repo}`;
      $('connection-dot').classList.add('connected');
      $('destination').textContent = `${repository.private ? 'Repository privato' : 'Repository pubblico'} · ${client.owner}/${client.repo}`;
      $('public-warning').hidden = repository.private;
      $('public-consent').checked = false;
      $('repo-link').href = client.web();
      $('disconnect').hidden = false;
      dialog.close(); notice(); refresh();
    } catch (error) { if (next) next.clear(); $('connection-error').textContent = error.message; }
    finally { $('connect-submit').disabled = false; $('close-dialog').disabled = false; }
  });
  $('disconnect').addEventListener('click', () => {
    generation++; clearTimeout(timer);
    if (client) client.clear();
    client = null; busy = false; source = null; runId = null;
    $('connection-label').textContent = 'Collega GitHub';
    $('connection-dot').classList.remove('connected');
    $('destination').textContent = 'Collega il tuo repository per iniziare';
    $('public-warning').hidden = true; $('disconnect').hidden = true;
    $('progress-card').hidden = true; $('resume-button').hidden = true;
    $('token').value = ''; dialog.close(); refresh();
  });
  function progress(title, message, percent, done = false) {
    $('progress-card').hidden = false; $('progress-title').textContent = title;
    $('progress-message').textContent = message; $('progress-bar').style.width = percent + '%';
    $('progress-icon').classList.toggle('done', done);
  }
  function linkToRun(id) {
    $('run-link').href = client.web(`/actions/runs/${id}`); $('run-link').hidden = false;
  }
  async function watch(started, currentGeneration) {
    if (!client || currentGeneration !== generation) return;
    try {
      const run = runId ? await client.run(runId) : await client.findRun(source);
      if (currentGeneration !== generation) return;
      const minutes = Math.floor((Date.now() - started) / 60000);
      $('elapsed').textContent = minutes ? `${minutes} min` : 'Appena avviata';
      if (run) {
        runId = run.id; linkToRun(runId);
        if (run.status === 'completed') {
          const artifacts = await client.artifacts(runId);
          if (currentGeneration !== generation) return;
          if (artifacts.length) {
            const artifact = artifacts.sort((a, b) => b.id - a.id)[0];
            $('download-link').href = client.web(`/actions/runs/${runId}/artifacts/${artifact.id}`);
            $('download-link').hidden = false;
          }
          const success = run.conclusion === 'success';
          progress(success && artifacts.length ? 'Il tuo documento è pronto' : success ? 'Conversione completata' : 'La conversione non è riuscita',
            success ? artifacts.length ? 'Scarica lo ZIP con il file convertito e il report.' : 'Il risultato non è disponibile. Controlla gli artifact su GitHub: potrebbero essere scaduti.'
              : artifacts.length ? 'Scarica lo ZIP e leggi report.json per il motivo. Per esempio, una scansione richiede OCR.'
                : 'Apri l’esecuzione su GitHub e controlla il passaggio in errore.', 100, true);
          busy = false; $('resume-button').hidden = true; refresh(); return;
        }
        progress(run.status === 'in_progress' ? 'Conversione in corso' : 'In attesa di GitHub',
          run.status === 'in_progress' ? 'La tua Action sta preparando le librerie ed elaborando il documento.'
            : 'Il file è caricato. GitHub sta assegnando un runner alla conversione.', run.status === 'in_progress' ? 65 : 35);
      } else progress('Avvio della conversione', 'Il file è su GitHub. Attendo che la nuova Action compaia.', 25);
      if (Date.now() - started > 30 * 60000) throw new Error('Il controllo automatico si è fermato dopo 30 minuti. Puoi riprenderlo o aprire GitHub.');
      timer = setTimeout(() => watch(started, currentGeneration), 8000);
    } catch (error) {
      if (currentGeneration !== generation) return;
      busy = false; notice(error.message);
      $('resume-button').hidden = !source; refresh();
    }
  }
  $('convert-button').addEventListener('click', async () => {
    if (!client || !chosen || busy) return;
    clearTimeout(timer); generation++;
    const currentGeneration = generation;
    source = null; runId = null; client.lastSource = null; busy = true; notice(); refresh();
    $('run-link').hidden = true; $('download-link').hidden = true; $('resume-button').hidden = true;
    $('elapsed').textContent = '';
    progress('Caricamento su GitHub', 'Il documento viene caricato nel repository selezionato.', 10);
    try {
      source = await client.start(chosen, $('operation').value, $('public-consent').checked);
      await watch(Date.now(), currentGeneration);
    } catch (error) {
      busy = false;
      $('public-warning').hidden = client.private;
      progress('Avvio interrotto', client.lastSource
        ? 'Il file è stato caricato, ma la richiesta di avvio non è stata confermata. Controlla le Actions prima di riprovare.'
        : 'Il caricamento non è stato completato. Puoi correggere il problema e riprovare.', 0, true);
      notice(error.message);
      if (client.lastSource) {
        source = client.lastSource;
        $('run-link').href = client.web('/actions/workflows/convert.yml'); $('run-link').hidden = false;
        $('resume-button').hidden = false;
      }
      refresh();
    }
  });
  $('resume-button').addEventListener('click', () => {
    if (!client || !source || busy) return;
    busy = true; notice(); $('resume-button').hidden = true; refresh();
    watch(Date.now(), generation);
  });
  window.addEventListener('beforeunload', event => {
    if (busy) { event.preventDefault(); event.returnValue = ''; }
  });
  operationChanged();
})();
