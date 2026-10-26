# PDF Studio Web

Frontend pubblico di PDF Studio. Le conversioni e i documenti restano nel repository privato `MastroFornaio08/pdf-actions`.

## Attiva il sito una sola volta

1. Apri [Settings → Pages](https://github.com/MastroFornaio08/pdf-studio-web/settings/pages).
2. In **Build and deployment**, scegli **Source → Deploy from a branch**.
3. In **Branch**, scegli **main** e **/docs**, poi premi **Save**.
4. Attendi la pubblicazione. In questa stessa pagina comparirà **Visit site**.

L'indirizzo previsto, da usare dopo la pubblicazione, è:
https://mastrofornaio08.github.io/pdf-studio-web/

## Primo collegamento

Apri il sito e premi **Collega GitHub**. Lascia:
- Proprietario: `MastroFornaio08`
- Repository: `pdf-actions` (il repository privato dei documenti)

Crea un [fine-grained token](https://github.com/settings/personal-access-tokens/new) con scadenza breve:
- Repository access: **Only select repositories → pdf-actions**
- Repository permissions: **Contents: Read and write**, **Actions: Read and write**

Incolla il token soltanto nel campo della pagina. Non inviarlo in chat e non aggiungerlo a file o commit.
Il token viene usato in memoria per chiamare le API GitHub, senza cookie o archiviazione locale.
Il collegamento GitHub di ChatGPT non viene trasferito automaticamente a questo sito.

## Converti

Scegli formato e file, premi Converti e attendi la GitHub Action. Il pulsante
**Scarica ZIP su GitHub** apre il risultato su github.com: accedi con il tuo account.

Un file alla volta, massimo 20 MB. I PDF scansionati richiedono OCR per diventare
Word, Excel o TXT; OCR non incluso. Le tabelle PDF → Excel devono avere bordi riconoscibili.

I file vengono caricati nel repository privato `pdf-actions` e restano nella sua
cronologia Git. La conservazione di 1 giorno riguarda solo gli artifact dei risultati.
Non rendere pubblico il repository dei documenti per pubblicare questa interfaccia.

Questo repository contiene soltanto HTML, CSS, JavaScript e relativa licenza.
Non contiene documenti caricati, token o chiavi. Il codice del convertitore resta separato.
