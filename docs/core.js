(function (root) {
  'use strict';
  const formats = {
    pdf_to_word: ['pdf'], pdf_to_excel: ['pdf'], pdf_to_text: ['pdf'],
    pdf_to_png: ['pdf'], pdf_to_jpg: ['pdf'],
    office_to_pdf: ['doc', 'docx', 'odt', 'xls', 'xlsx', 'ods', 'ppt', 'pptx', 'odp'],
    images_to_pdf: ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'webp', 'bmp']
  };
  function validateFile(file, operation) {
    if (!file || !file.size) throw new Error('Scegli un file non vuoto.');
    if (file.size > 20 * 1024 * 1024) throw new Error('Il limite di questa interfaccia è 20 MB per file.');
    const extension = file.name.split('.').pop().toLowerCase();
    if (!formats[operation]?.includes(extension)) throw new Error('Il formato del file non è compatibile con la conversione scelta.');
    return extension;
  }
  function base64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return btoa(binary);
  }
  class GitHub {
    #token;
    constructor(owner, repo, token, fetcher = globalThis.fetch.bind(globalThis)) {
      if (!/^[\w-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) throw new Error('Indica proprietario e repository validi.');
      if (!token.trim()) throw new Error('Inserisci il token GitHub.');
      this.owner = owner; this.repo = repo; this.#token = token.trim(); this.fetcher = fetcher;
      this.path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    }
    clear() { this.#token = ''; }
    async request(path, method = 'GET', body) {
      if (!this.#token) throw new Error('Ricollega GitHub per continuare.');
      const response = await this.fetcher('https://api.github.com' + this.path + path, {
        method, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${this.#token}`,
          'X-GitHub-Api-Version': '2022-11-28', ...(body ? {'Content-Type': 'application/json'} : {}) },
        ...(body ? {body: JSON.stringify(body)} : {}), signal: AbortSignal.timeout(60000), cache: 'no-store'
      });
      if (response.status === 204) return null;
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const hints = {401: 'Token non valido o scaduto.', 403: 'Permessi insufficienti o quota GitHub raggiunta.',
          404: 'Repository o workflow non accessibile. Controlla il nome e i repository autorizzati nel token.',
          422: 'GitHub non ha accettato la richiesta. Verifica che il workflow sia sul branch predefinito.'};
        throw new Error(hints[response.status] || `GitHub ha risposto con errore ${response.status}.`);
      }
      return data;
    }
    async connect() {
      const repo = await this.request('');
      if (!repo.permissions?.push) throw new Error('Il token deve consentire la scrittura nel repository.');
      await this.request('/actions/workflows/convert.yml');
      this.branch = repo.default_branch;
      this.private = repo.private;
      return repo;
    }
    async start(file, operation, publicConfirmed = false) {
      const extension = validateFile(file, operation);
      const latest = await this.request('');
      this.private = latest.private;
      if (!latest.private && !publicConfirmed) throw new Error('Il repository è pubblico: conferma prima la visibilità del documento.');
      this.branch = latest.default_branch;
      const id = crypto.randomUUID();
      const source = `input/web-${id}/documento.${extension}`;
      const content = base64(await file.arrayBuffer());
      await this.request('/contents/' + source, 'PUT', {
        message: `Upload conversion ${id}`, branch: this.branch, content
      });
      // Conserva il riferimento anche se l'avvio fallisce: il file è già su GitHub.
      this.lastSource = source;
      await this.dispatch(source, operation);
      return source;
    }
    async dispatch(source, operation) {
      await this.request('/actions/workflows/convert.yml/dispatches', 'POST', {
        ref: this.branch, inputs: {operation, source}
      });
    }
    async findRun(source) {
      const data = await this.request('/actions/workflows/convert.yml/runs?event=workflow_dispatch&per_page=50');
      return data.workflow_runs.find(run => run.display_title === `PDF • ${source}`) || null;
    }
    async run(id) { return this.request('/actions/runs/' + id); }
    async artifacts(id) {
      const result = await this.request(`/actions/runs/${id}/artifacts`);
      return result.artifacts.filter(item => !item.expired && item.name.startsWith('conversione-'));
    }
    web(path = '') { return `https://github.com/${this.owner}/${this.repo}${path}`; }
  }
  const exports = {GitHub, formats, validateFile, base64};
  if (typeof module !== 'undefined' && module.exports) module.exports = exports;
  else root.PdfGitHub = exports;
})(globalThis);
