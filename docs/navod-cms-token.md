# Návod: přihlášení do CMS (Rychlé čištění Praha)

Tento návod popisuje, jak si vygenerovat **přístupový token** a přihlásit se do
administrace webu, kde můžete upravovat texty, ceny, fotky a další obsah.

Administrace (CMS): **https://staticke-weby.github.io/RychleCisteniPraha.cz/admin/**
(po nasazení na vlastní doménu to bude `https://www.rychlecistenipraha.cz/admin/`)

---

## Co budete potřebovat

1. **GitHub účet** (registrace zdarma na https://github.com/signup).
2. **Přístup do repozitáře** `Staticke-weby/RychleCisteniPraha.cz` s právem zápisu
   (zařídí správce webu – přidá vás jako spolupracovníka / člena organizace).
3. 5 minut času.

---

## 1. Vytvoření tokenu

1. Přihlaste se na **https://github.com**.
2. Vpravo nahoře klikněte na svou **fotku/avatar** → **Settings**.
3. V levém menu úplně dole klikněte na **Developer settings**.
4. Otevřete **Personal access tokens** → **Fine-grained tokens**.
5. Klikněte na **Generate new token**.
6. Vyplňte:
   - **Token name:** `Sveltia CMS`
   - **Expiration:** např. **1 rok** (po vypršení vygenerujete nový)
   - **Resource owner:** vyberte **`Staticke-weby`**
     > ⚠️ Tady je nejčastější chyba. Musí být zvolená **organizace** `Staticke-weby`,
     > ne vaše vlastní jméno. Jinak se repozitář v dalším kroku vůbec nezobrazí.
7. **Repository access:** zvolte **Only select repositories** → vyberte
   **`RychleCisteniPraha.cz`**.
8. **Permissions** → rozbalte **Repository permissions** → u položky **Contents**
   nastavte **Read and write**.
   (Položka **Metadata** se nastaví sama, té se nedotýkejte.)
9. Klikněte na **Generate token**.
10. Zobrazí se token začínající **`github_pat_…`**. **Hned ho zkopírujte** –
    po zavření stránky už ho znovu neuvidíte.
11. Uložte si ho do **správce hesel** (např. Bitwarden, 1Password) nebo alespoň
    do bezpečných poznámek – budete ho potřebovat při každém přihlášení.

> 🔒 **Token je jako heslo.** Nikomu ho neposílejte (ani e-mailem, ani zprávou).
> Kdo ho má, může měnit obsah webu.

---

## 2. Přihlášení do CMS

1. Otevřete **https://staticke-weby.github.io/RychleCisteniPraha.cz/admin/**
2. Klikněte na **Sign In Using Access Token**.
3. Vložte zkopírovaný token `github_pat_…` (pozor na mezery navíc).
4. Klikněte na **Sign In**.

Hotovo – můžete upravovat obsah. Změny se po uložení samy zveřejní (web se
přegeneruje, obvykle do 1–2 minut).

---

## 3. Co token umí

- Umožní vám **upravovat obsah** tohoto jednoho webu.
- Platí jen pro repozitář `RychleCisteniPraha.cz` a jen na **čtení/zápis souborů**.
- Pod jménem, kterým token vytvoříte, se zapíší i provedené změny (commity).

---

## 4. Když se token ztratí nebo vyprší

Stačí vygenerovat **nový** stejným postupem jako v sekci 1 a v CMS se přihlásit
jím. Token se v prohlížeči obvykle drží, takže přihlášení děláte jen občas.

---

## 5. Když to nefunguje

**V „Resource owner" nevidím `Staticke-weby`:**
nejste členem organizace. Napište správci webu, ať vás přidá.

**Repo `RychleCisteniPraha.cz` se nezobrazí:**
- nemáte právo zápisu do repozitáře, nebo
- organizace vyžaduje schválení tokenu (čeká na „Pending approval") – musí ho
  schválit správce organizace.

**Přihlášení hlásí „Nemáte přístup k repozitáři":**
nejčastěji je špatně zvolený **Resource owner** (musí být `Staticke-weby`) nebo
token nemá **Contents: Read and write**. Zkontrolujte a případně vytvořte token nový.

**Záložní varianta (když fine-grained token nejde použít):**
vytvořte **classic** token: Settings → Developer settings → Personal access tokens →
**Tokens (classic)** → Generate new token (classic) → zaškrtněte scope **`repo`** →
Generate. Funguje také, ale platí na všechny vaše repozitáře.

---

## Kontakt

Kdykoli se zaseknete, pošlete zprávu správci webu (Radek Ingr) a vyřešíme to.
