# Generování tokenu pro CMS (návod pro správce)

Předpoklad: servisní účet je už založený, přidaný do organizace `Staticke-weby`
a má write přístup k danému webu. Tohle je postup **jen pro vygenerování tokenu**.

## Postup

1. Přihlas se **servisním účtem** na https://github.com.
2. Vpravo nahoře **avatar → Settings**.
3. Vlevo dole **Developer settings**.
4. **Personal access tokens → Fine-grained tokens** → **Generate new token**.

Nastav přesně toto:

| Pole | Hodnota |
| --- | --- |
| **Token name** | např. `CMS – Rychlé čištění Praha` |
| **Expiration** | **1 rok** (po vypršení vygeneruj nový) |
| **Resource owner** | **Staticke-weby** ← organizace, ne osobní účet |
| **Repository access** | **Only select repositories** → **`RychleCisteniPraha.cz`** |
| **Permissions → Repository permissions → Contents** | **Read and write** |
| **Metadata** | *Read-only* (doplní se samo, neměň) |
| Vše ostatní | nechat **No access** |

5. **Generate token** → zobrazí se `github_pat_…` → **hned zkopíruj** (podruhé se neukáže).
6. Ulož si token do správce hesel a poznamenej, ke kterému webu patří.

## Předání klientovi

- Předávej **zabezpečeně** (Bitwarden Send / 1Password apod.), nikdy e-mailem ani chatem.
- Klient se přihlásí na `…/admin/` → **Sign In Using Access Token** → vloží token.
- Návod pro klienta: `docs/navod-cms-token.md`.

## Kontrola, že je token správný

- V CMS se přihlásí **a uložení změny projde** (commit se objeví v repu).
- Když ukládání hlásí chybu, chybí **Contents: Read and write** nebo je špatný Resource owner.

## Obnova a revokace

- **1× ročně** (a vždy při odchodu klienta / podezření na únik): starý token **Delete**,
  vygeneruj nový stejným postupem a předej ho klientovi.
- Jeden token = **jeden web**. Pro další web opakuj stejný postup.
