# PDF Actions

Un piccolo convertitore open source per uso personale tramite GitHub Actions.
Il progetto include codice Python, workflow pronti e **PDF Studio**, un frontend
con caricamento drag-and-drop e controllo delle conversioni. Per pubblicare e
collegare la pagina leggi [FRONTEND.md](FRONTEND.md). Puoi anche usare la scheda
**Actions** di GitHub direttamente.

## Usa questo repository

Il codice e i workflow sono gia installati. Se il repository e pubblico,
rendilo privato prima di caricare documenti personali: **Settings → General →
Danger Zone → Change repository visibility**.

1. Carica il PDF nella cartella `input/` e conferma il commit.
2. Apri **Actions → Converti documenti → Run workflow**.
3. Scegli `pdf_to_word` e indica `input/nomefile.pdf` in `source`.
4. Attendi la fine del job e scarica il risultato dalla sezione **Artifacts**.

## Primo avvio senza terminale

1. Estrai lo ZIP sul computer.
2. Crea un repository GitHub **privato** per i tuoi documenti personali.
3. Carica il **contenuto** della cartella `pdf-actions` nella radice del repository.
   Anche `.github/workflows/` deve essere caricato: potrebbe essere nascosto
   nel tuo sistema. Il percorso finale deve essere `.github/workflows/convert.yml`,
   non `pdf-actions/.github/workflows/convert.yml`. In alternativa crea i due
   workflow con **Add file → Create new file** e incolla i contenuti dei file.
4. Carica un documento nella cartella `input/` con **Add file → Upload files**
   e conferma il commit.
5. Apri **Actions → Converti documenti → Run workflow** sul branch predefinito.
6. Scegli `pdf_to_word`, inserisci `input/nomefile.pdf` in `source` e avvia.
7. Apri l'esecuzione terminata e scarica lo ZIP nella sezione **Artifacts**.
   Contiene il risultato e `report.json`. Ogni file ha una propria sottocartella.

Se imposti `source` su `input`, vengono elaborati tutti i file compatibili,
anche nelle sottocartelle. I percorsi con spazi sono supportati.
I workflow non partono automaticamente quando carichi documenti.

## Conversioni

| Operazione | Ingresso | Risultato e limiti |
| --- | --- | --- |
| `pdf_to_word` | PDF testuali o scansionati | DOCX modificabile; OCR automatico ita/eng, con impaginazione semplificata per le scansioni |
| `pdf_to_excel` | PDF con tabelle delimitate da bordi | XLSX, un foglio per tabella; non ricostruisce formule o interi fogli originali |
| `pdf_to_text` | PDF testuali o scansionati | TXT UTF-8, OCR automatico ita/eng |
| `pdf_to_png` | PDF | Una PNG per pagina, 150 DPI |
| `pdf_to_jpg` | PDF | Una JPG per pagina, 150 DPI |
| `office_to_pdf` | DOC/DOCX/ODT, XLS/XLSX/ODS, PPT/PPTX/ODP | PDF tramite LibreOffice |
| `images_to_pdf` | PNG/JPG/TIFF/WEBP/BMP | Un PDF per immagine; TIFF multipagina conservati |

Per Word e testo, le pagine senza testo vengono riconosciute con OCR italiano/inglese.
Il Word generato tramite OCR ha testo modificabile e impaginazione semplificata:
non ricostruisce tabelle e immagini. Verifica sempre nomi, numeri e accenti.
Le tabelle delle scansioni non sono supportate nella conversione Excel.
I PDF protetti da password vengono
rifiutati. PDF complessi, colonne, font mancanti e documenti Office possono
avere differenze grafiche. PDF → PowerPoint non incluso.

`pdf2docx` e open source ma Artifex non ne cura piu lo sviluppo attivo.
La versione diretta e fissata in `requirements.txt`; le altre dipendenze hanno
intervalli di compatibilita, quindi non si tratta di un lock completo.

## Riservatezza e costi

GitHub Actions esegue il convertitore su un runner GitHub: i documenti vengono
quindi caricati su GitHub. Non vengono inviati a servizi commerciali di conversione.
**I file caricati nel repository rimangono nella cronologia Git anche dopo un
normale commit di cancellazione.** Non caricare documenti riservati in un repository
pubblico. Puoi pubblicare il codice in un repository e usarne una copia privata
per le conversioni. Per evitare del tutto il caricamento usa la CLI sul computer.

Gli artifact dei risultati hanno conservazione richiesta di **1 giorno**.
Questo non cancella input, cronologia Git o log. Le impostazioni del repository
governano la conservazione dei log. Chi ha accesso al repository puo accedere
ai risultati secondo i permessi GitHub. Anche i log delle librerie potrebbero
contenere informazioni sui documenti.

I repository privati hanno quote di minuti e spazio in base al piano; oltre le
quote possono esserci costi. Il workflow ha un limite di 20 minuti. Non e un
server sempre acceso: per ogni conversione occorre avviare e attendere un job.

## Uso locale

Richiede Python 3.11. Installa LibreOffice soltanto per Office → PDF.
Per OCR installa anche Tesseract e i pacchetti lingua italiano/inglese.
Su Ubuntu: `sudo apt-get install tesseract-ocr tesseract-ocr-ita tesseract-ocr-eng`.
Il workflow GitHub installa automaticamente queste dipendenze per Word e testo.

```bash
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows PowerShell, in alternativa:
# .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python convert.py --operation pdf_to_word --source "input/documento.pdf"
```

Sposta o elimina la cartella `output/` prima di una nuova esecuzione locale,
oppure usa `--output output-nuovo`. Il convertitore rifiuta di sovrascrivere
una cartella non vuota. Se un file fallisce, gli altri vengono comunque elaborati,
il job termina in errore e i risultati parziali e il report restano scaricabili.

## Test

```bash
python -m unittest discover -s tests -v
```

I test generano documenti sintetici, controllano contenuto Word/testo/tabelle,
immagini e gestione degli errori. Quelli Office vengono eseguiti se LibreOffice
e installato; il workflow di verifica lo installa.

## Licenze e fonti

Il codice di questo repository e MIT; le dipendenze hanno licenze proprie.
In particolare PyMuPDF e distribuito con opzioni AGPL/commerciale: consultare
la sua licenza quando si ridistribuisce una soluzione che lo include.
Le dipendenze non sono incluse nello ZIP, vengono installate al primo avvio.

- [pdf2docx e stato del progetto](https://github.com/ArtifexSoftware/pdf2docx)
- [PyMuPDF e licenza](https://github.com/pymupdf/PyMuPDF)
- [LibreOffice: conversione da riga di comando](https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html)
- [Artifact GitHub Actions](https://docs.github.com/en/actions/tutorials/store-and-share-data)
- [Quote e fatturazione Actions](https://docs.github.com/en/actions/concepts/billing-and-usage)

Questa e una prima versione indipendente, senza affiliazione con iLovePDF.
