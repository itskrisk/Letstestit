# Muncheez LaTeX Design System

> A precise extraction of the visual & structural design language used across all `.tex` files in this folder.
> Use this as the single source of truth when authoring any new Muncheez document so that nothing drifts off-brand.

---

## 0. Brand Update (2026) — `Limited`, not `Inc.`

As of 2026 Muncheez is preparing to incorporate as **`MUNCHEEZ TECHNOLOGIES LIMITED`** (a Kenyan private company limited by shares) — **not** `Muncheez Technologies Inc.` All existing `.tex` files in this folder still say `Inc.`; treat them as **legacy / pre-rebrand** content and re-render them with the new suffix where appropriate.

**Rule going forward:**

- New documents: write `Muncheez Technologies Limited` in full on first reference; `Muncheez.` (with the trailing blue period) wherever the wordmark is used.
- Legacy `.tex` files: leave them in place but flag for re-issue when they are next used in a live context.
- All new corporate & legal architecture lives in [`latexdocuments/corporate/`](latexdocuments/corporate/) — see that folder's `00-master-document-register.md`, `01-incorporation-critical-path.md`, and `02-documents-to-draft-now.md`.

---

## 1. Brand Identity Snapshot

- **Company:** `Muncheez Technologies Limited` (often shortened to `MUNCHEEZ` in headers/footers, all-caps in micro-typography).
- **Legal jurisdiction / default law referenced:** Republic of Kenya (Companies Act, 2015).
- **Operating geography:** Nairobi, Kenya (with reference neighborhoods Thika Greens, Ngoingwa, Juja).
- **Voice / Tone:**
  - Crisp, executive, minimalist-corporate.
  - "Zero Grey" philosophy — only solid blacks, pure whites, navy, and one accent blue.
  - Confident. Never decorative. Whitespace is a feature.
- **Wordmark rule (non-negotiable across every file):**
  ```
  {\fontsize{...}{...}\sffamily\bfseries\color{CorporateNavy} Muncheez\color{LinkBlue}{\textbf{.}}}
  ```
  The blue period (`.`) is rendered **in LinkBlue and bold** — it is the only blue inside the wordmark and functions as the brand's "full stop" mark.

---

## 2. Color Palette (Canonical)

Every document defines these via `\definecolor{...}{HTML}{...}`. The palette below is the **minimum viable set**; some documents extend it (e.g. cover slides add `SlateGray`, `BorderGray`, `DeepCharcoal`).

| Token | HTML | Role |
|---|---|---|
| `SolidBlack` | `#000000` | Default ink, body copy, primary type color |
| `PureWhite` | `#FFFFFF` | Page background |
| `LinkBlue` | `#0066CC` | **Accent only.** Used for: the brand period, micro-tags, hyperlinks, kicker labels, accent rules, the 1.5pt rule in callouts |
| `CorporateNavy` | `#0A192F` | Primary display color. Wordmark, H1/H2 headings, section titles, footer corporate names |
| `RuleNavy` | `#1E293B` | Horizontal divider rules (height 1–2pt), metadata footers |
| `DeepCharcoal` | `#2D3748` | Body text color (high-contrast readable alternative to pure black) |
| `SlateGray` | `#4A5568` | Secondary metadata text (when navy is too strong) |
| `BorderGray` | `#CBD5E1` (or `#E2E8F0`) | Hairline table borders, neutral separators |
| `LightSlate` | `#F8FAFC` | Soft fill (e.g. lanyard hole marker) |

### Color Discipline Rules

1. **LinkBlue is rationed.** It is restricted to:
   - The period/full stop in the `Muncheez.` wordmark.
   - Small uppercase kicker labels (`\textsf{\scriptsize\bfseries\color{LinkBlue}\uppercase{...}}`).
   - Hyperlinks (via `hyperref` or `\href`).
   - The short trailing segment of an "asymmetric dual-tone rule."
   - Vertical 1.5pt column separators in onboarding/checklist tables.
   - The 10/30/60 percent tints in chart fills (`LinkBlue!10`, `LinkBlue!30`, `LinkBlue!60`).
2. **Never use LinkBlue for body copy or section headings.** Section headings are always `CorporateNavy` or `SolidBlack`.
3. **`\color{SolidBlack}` + `\pagecolor{PureWhite}`** is set at the document preamble level to enforce default ink/paper globally.
4. **Body copy color choices:**
   - Legal/statutory docs → `SolidBlack` or `DeepCharcoal`.
   - Marketing/pitch → `DeepCharcoal` for paragraphs, `CorporateNavy` for headings.
   - Onboarding/operational letters → `SolidBlack` for paragraphs, navy/blue for kickers.

---

## 3. Typography

### 3.1 Font System (constant across all documents)

```latex
\usepackage[scaled=0.92]{helvet}
\renewcommand{\familydefault}{\sfdefault}
```

→ Forces Helvetica as the **only** family in the document. Every run of text is then wrapped in `\sffamily` (which is technically redundant after the `\sfdefault` reassignment, but is used consistently as a belt-and-braces convention).

### 3.2 Type Scale (observed ranges)

Use these as defaults; tune the absolute size by ±1pt to fit a document's density.

| Use case | Size (pt) | Leading | Style |
|---|---|---|---|
| Cover / hero wordmark | `36–56` | `42–64` | `\sffamily\bfseries\color{CorporateNavy}` |
| Cover document title | `24–28` | `30–34` | `\sffamily\bfseries\color{CorporateNavy}` (or `SolidBlack`) |
| Cover sub-tagline | `10–13` | `13–16` | `\sffamily\color{DeepCharcoal}` or `\color{SlateGray}` |
| H1 / Section opener | `18–22` | `22–28` | `\sffamily\bfseries\color{CorporateNavy}` |
| Section heading (`\section`) | `11–14` (`\normalsize`–`\large`) | – | `\sffamily\bfseries\uppercase` with a 0.5pt underline rule |
| Subsection heading (`\subsection`) | `10–11` (`\small`) | – | `\sffamily\bfseries` (no rule) |
| Body | `10–11` | `12–16` | `\sffamily` |
| Captions / footnotes / micro-meta | `8–9` (`\scriptsize`/`\footnotesize`) | – | `\sffamily` or `\textsf` |
| Cover metadata keys (bold) | `\small\bfseries` | – | `\color{CorporateNavy}` or `SolidBlack` |

### 3.3 Paragraph rhythm

- `\setlength{\parindent}{0pt}` — no first-line indent. (Universal.)
- `\setlength{\parskip}{...}` — varies:
  - **Tight / executive:** `0pt` (signage, nametags, RSVP cards)
  - **Standard:** `0.4em` (onboarding letters) or `8pt` (legal docs)
  - **Spacious / press:** `0.8em`
- `\setstretch{1.15}` – `1.22` — line spacing.
  - 1.15 → signage, nametags
  - 1.18 → onboarding letters, leave-behind
  - 1.20 → press, invitations, legal statutes
  - 1.22 → multi-section contracts

---

## 4. Geometry & Page Setup

### 4.1 Page

```latex
\documentclass[11pt,a4paper]{article}
```

`11pt` body / `a4paper` is **always** the base. The **only exception** is the investor pitch deck, which uses `beamer`:

```latex
\documentclass[aspectratio=169, 11pt]{beamer}
```

### 4.2 Margins

| Document class | margin (in) | top/bottom (in) |
|---|---|---|
| Long legal contracts (`employeecontract`) | `0.85` | `0.9` |
| Onboarding / operational letters | `0.85` | `0.8` |
| Leave-behind / brief | `0.9` | `0.9` |
| Invitations / RSVP / stage signage | `1.0` | `1.0` |
| Statutory filings (Articles, Memo, Founders) | `1.1` | `1.1` |
| Press release | `1.0` | `1.0` |
| Name tag (single sheet) | `0.7` | `0.6` |

> **Rule of thumb:** Wider margins (`1.0–1.1")` for ceremonial / single-purpose documents; tighter margins (`0.7–0.85"`) for dense operational docs that need to fit lots of content.

### 4.3 Page Styles

- Single-page ceremonial docs (`invitationletter`, `pressreleasesample`, `merchantonboardingletter`, `rideronboardingletter`, `nametagmuncheez`, `leavebehindsheetsample`, `posteventthankyou`, `rsvpconfirmationemail`, `stagevenuesignage`):
  ```latex
  \pagestyle{empty}
  ```
- Multi-page legal docs that use a `\thispagestyle{empty}` cover then `fancy` with running header/footer (`employeecontract`):
  ```latex
  \pagestyle{fancy}
  \fancyhf{}
  \renewcommand{\headrulewidth}{0.0pt}
  \fancyhead[L]{\textsf{\scriptsize\textbf{MUNCHEEZ} \hspace{0.1cm}{\color{LinkBlue}\vrule width 1.5pt height 9pt depth 1pt}\hspace{0.1cm} <DOC TYPE>}}
  \fancyhead[R]{\textsf{\scriptsize CONFIDENTIAL \& PROPRIETARY}}
  \fancyfoot[C]{\textsf{\footnotesize Page \thepage\ of 4}}
  ```
  → Use the **blue vertical mini-rule** (`\vrule width 1.5pt height 9pt depth 1pt`) to separate `MUNCHEEZ` from the doc type. It is a recurring brand element.
- Statutory docs (`articlesofassociation`, `memorandumofassociation`, `foundersagreement`) use:
  ```latex
  \pagestyle{empty}      % on cover
  \pagestyle{plain}      % on body, with \pagenumbering{arabic}
  ```

---

## 5. The Brand Mark: `Muncheez.` Wordmark

This exact construction appears in **every** document:

```latex
{\fontsize{<size>}{<leading>}\sffamily\bfseries\color{CorporateNavy} Muncheez\color{LinkBlue}{\textbf{.}}}
```

### Wordmark sizing by document

| Document | Wordmark size/leading |
|---|---|
| Statutory filing covers | `44 / 52` |
| Employee contract cover | `36 / 42` |
| Invitation / thank-you header | `38 / 44` |
| Pitch deck cover | `42 / 48` |
| RSVP confirmation | `36 / 42` |
| Stage venue signage | `56 / 64` |
| Name tag | `48 / 54` |
| Onboarding letter header | `30 / 36` |
| Leave-behind header | `30 / 36` |
| Press release header | `28 / 34` |

> **Rule:** Wordmark size always matches document gravitas — bigger for ceremonial/poster-style, smaller for letterheads.

---

## 6. The "Asymmetric Dual-Tone" Divider Line

The single most recognizable recurring motif across the system. Used to separate header from body or section breaks.

```latex
\begin{tikzpicture}
    \draw[line width=2pt–3pt, color=CorporateNavy] (0,0) -- (\textwidth-<X>cm, 0);
    \draw[line width=2pt–3pt, color=LinkBlue]   (\textwidth-<X>cm,0) -- (\textwidth, 0);
\end{tikzpicture}
```

Variants observed:
- **`X = 3.5`, line width 3pt`** — corporate / statutory documents.
- **`X = 3.0`, line width 2.5pt`** — pitch deck (cover & closing).
- **`X = 2.5`, line width 2pt`** — invitation & thank-you letters.
- **`X = 1.5`, line width 1.5pt`** — name tag (thinner because narrower page).
- **Centered short variant** (`4cm` navy → `1.3cm` blue) — stage venue signage.

### Plain horizontal-rule alternative

Used in lieu of the asymmetric line when a horizontal full-width divider is more appropriate (employee contract section breaks, onboarding checklist caps, RSVP confirmation dividers, footer separators):

```latex
\color{RuleNavy}\hrule height 1.5pt   % corporate/statutory
\color{SolidBlack}\hrule height 0.5pt % operational/onboarding
\color{BorderGray}\hrule height 0.5pt % light documents (RSVP, leave-behind)
```

---

## 7. Layout Primitives (Reusable Building Blocks)

### 7.1 Two-column page header (left brand, right meta)

Used in nearly every letter/letterhead document:

```latex
\begin{tabularx}{\textwidth}{@{} X >{\raggedleft\arraybackslash}X @{}}
    {\fontsize{...}{...}\sffamily\bfseries\color{CorporateNavy} Muncheez\color{LinkBlue}{\textbf{.}}} &
    \begin{raggedleft}
        {\fontsize{11}{14}\sffamily\bfseries\color{CorporateNavy} <DOC TYPE TAG>} \\[0.05cm]
        {\fontsize{9}{12}\sffamily\bfseries\color{LinkBlue}\uppercase{<Sub-tagline>}
    \end{raggedleft} \\
    {\textsf{\scriptsize\bfseries\color{SolidBlack} DIGITAL SOFTWARE MARKETPLACE \& LOGISTICS INFRASTRUCTURE}} &
    \textsf{\scriptsize\color{SlateGray} <REF CODE>} \\
\end{tabularx}
```

Right column always uses `\raggedleft` via the `>{\raggedleft\arraybackslash}X` column specifier.

### 7.2 Two-column footer

```latex
\begin{tabularx}{\textwidth}{@{} X >{\raggedleft\arraybackslash}X @{}}
    \textsf{\small\bfseries\color{CorporateNavy} Muncheez Technologies Inc.} \newline
    \textsf{\scriptsize\color{SlateGray} Nairobi, Kenya} &
    \textsf{\small\bfseries\color{CorporateNavy} <DOC TYPE — INTERNAL LABEL>} \newline
    \textsf{\scriptsize\color{SlateGray} REF: MCH-2026-<CODE>} \\
\end{tabularx}
```

Always prefixed with a `\hrule` (height 1–1.5pt, color `RuleNavy`/`SolidBlack`/`BorderGray`).

### 7.3 Definition-list table (label / value rows)

Used for metadata, event details, key/value pairs:

```latex
\begin{tabularx}{\textwidth}{@{} p{<label-width>} X @{}}
    \textsf{\small\bfseries\color{CorporateNavy} <LABEL>} &
    \textsf{\small\color{DeepCharcoal} <value>} \\[0.5cm]
    ...
\end{tabularx}
```

Common label widths: `3.2cm` (compact), `3.8cm` (standard), `4.5cm` (ceremonial).

### 7.4 Callout / Checklist card with vertical accent rule

Pattern used in onboarding letters and contracts:

```latex
\color{SolidBlack}\hrule height 0.5pt
\vspace{0.25cm}
\textsf{\scriptsize\bfseries\color{LinkBlue}\uppercase{<Section Label>}} \\[0.2cm]

\begin{tabularx}{\textwidth}{@{} p{3.2cm} !{\color{LinkBlue}\vrule width 1.5pt} X @{}}
    \textsf{\small\bfseries\color{SolidBlack} 1. <STEP>} & \textsf{\small\color{SolidBlack} <description>} \\[0.15cm]
    \textsf{\small\bfseries\color{SolidBlack} 2. <STEP>} & \textsf{\small\color{SolidBlack} <description>} \\[0.15cm]
    ...
\end{tabularx}

\vspace{0.25cm}
\color{SolidBlack}\hrule height 0.5pt
```

→ The `\vrule width 1.5pt` in `LinkBlue` is the **same accent** used in the brand header divider — keep it 1.5pt.

### 7.5 Two-column comparison / split block

Used for "Market vs. Muncheez", "Challenge vs. Solution", "Today vs. Tomorrow":

```latex
\begin{tabularx}{\textwidth}{@{} X p{0.5cm} X @{}}
    <left column heading + body> & & <right column heading + body> \\
\end{tabularx}
```

Empty middle column provides the gutter.

### 7.6 Bullet lists with mid-dot leader

Used heavily in pitch deck & onboarding copy:

```latex
\textsf{\small \textperiodcentered\ <Bullet item>} \\
```

(`\textperiodcentered` = `·`). Always one space after the dot.

### 7.7 Numbered legal clauses

Used in statutes & contracts. Two styles:

**Plain prose numbers** (articles/memorandum):
```
1. The text of the first clause...
2. The text of the second clause...
```

**Sectioned with hierarchical `\section` / `\subsection`** (employee contract, founders agreement):
```latex
\section{1. Scope of Role \& Core Responsibilities}
\subsection{1.1 Role Purpose}
```

### 7.8 Capitalization table

Used in every statutory document and the founders agreement. Uses `booktabs`:

```latex
\begin{table}[h!]
\centering
\small
\begin{tabularx}{\textwidth}{@{} X p{4.5cm} >{\raggedleft\arraybackslash}X >{\raggedleft\arraybackslash}X @{}}
    \toprule
    \textbf{\color{CorporateNavy} Column A} & \textbf{\color{CorporateNavy} Column B} & \textbf{\color{CorporateNavy} Column C} & \textbf{\color{CorporateNavy} Column D} \\
    \midrule
    ...rows...
    \midrule
    \textbf{\color{CorporateNavy} TOTAL} & & & \textbf{\color{CorporateNavy} 100.00\%} \\
    \bottomrule
\end{tabularx}
\end{table}
```

Header row text is `CorporateNavy` and bold; the TOTAL row repeats the navy emphasis.

### 7.9 Signature blocks

Two distinct patterns:

**Two-party inline** (articles, founders, memorandum):
```latex
\begin{tabularx}{\textwidth}{@{} X X @{}}
    \rule{6.5cm}{1pt} \newline
    \textsf{\small\bfseries\color{CorporateNavy} <Name>} \newline
    \textsf{\scriptsize\bfseries\color{LinkBlue} <Role>} \newline
    \textsf{\scriptsize\color{SolidBlack} Muncheez Technologies Inc.} \newline
    \textsf{\scriptsize\color{SolidBlack} Date: \rule{3cm}{0.5pt}, 2026} &
    <second party...> \\
\end{tabularx}
```

**Side-by-side with vertical gutter** (employee contract, NDA):
```latex
\begin{tabularx}{\textwidth}{@{} X p{1.2cm} X@{}}
    \textbf{<party A heading>} & & \textbf{<party B heading>} \\[1.0cm]
    \cline{1-1} \cline{3-3}
    ...
\end{tabularx}
```

---

## 8. Document Templates — Reusable Skeletons

The folder contains five recurring templates. When authoring a new doc, pick the closest match:

### Template A — Statutory / Long Legal Cover + Body

**Used by:** [`articleofassociation.tex`](articleofassociation.tex:1), [`memorandumofassociation.tex`](memorandumofassociation.tex:1), [`foundersagreement.tex`](foundersagreement.tex:1)

1. `\pagestyle{empty}` + `\begin{titlepage}` cover.
2. `\vspace*{2.5cm}` push.
3. Wordmark at `\fontsize{44}{52}`.
4. Asymmetric dual-tone line (X=3.5cm, 3pt).
5. `\vfill` to push the metadata footer (Registrar / Secretarial) to the bottom.
6. Body: `\pagestyle{plain}` + `\pagenumbering{arabic}` after `\newpage`.
7. Each `PART` opener uses `{\fontsize{18}{22}\sffamily\bfseries\color{CorporateNavy}` followed by a `RuleNavy` 1.5pt rule.
8. Tables use `booktabs`.
9. Final `\vfill` + footer table.

### Template B — Multi-page Contract with Cover + Pages + Signatures

**Used by:** [`employeecontract.tex`](employeecontract.tex:1)

1. Cover page uses `\thispagestyle{empty}` (no `titlepage` environment).
2. `\vspace*{1.5cm}` + wordmark + a 50pt `LinkBlue` accent rule under the title.
3. Document metadata as a `tabularx` "DOCUMENT CONTROL METADATA" block at the bottom of the cover (`\vfill` before it).
4. After `\newpage`, set `\pagestyle{fancy}` with running header (left: brand + doc type, right: `CONFIDENTIAL & PROPRIETARY`) and centered footer `Page X of Y`.
5. Sections use `titlesec`-styled `\section` (uppercase, 0.5pt rule underneath, no numbering).
6. Subsections: `\subsection` (no rule, just `\small\bfseries`).
7. Each major part ends with a signature `tabularx` (side-by-side, `p{1.2cm}` gutter).

### Template C — Single-page Ceremonial Letter

**Used by:** [`invitationletter.tex`](invitationletter.tex:1), [`posteventthankyou.tex`](posteventthankyou.tex:1), [`pressreleasesample.tex`](pressreleasesample.tex:1), [`leavebehindsheetsample.tex`](leavebehindsheetsample.tex:1)

1. `\pagestyle{empty}`.
2. Brand header `tabularx` (left wordmark + tagline, right doc-type tag).
3. Asymmetric dual-tone line.
4. Title (24–28pt navy) + small sub-headline.
5. Body content in `DeepCharcoal` or `SolidBlack`.
6. Optional resource/details `tabularx` with `p{<width>}` labels.
7. `\vfill` to footer.
8. Rule + two-column footer.

### Template D — Onboarding / Operational Letter

**Used by:** [`merchantonboardingletter.tex`](merchantonboardingletter.tex:1), [`rideronboardingletter.tex`](rideronboardingletter.tex:1)

1. `\pagestyle{empty}`.
2. Brand header (uses `SolidBlack` for wordmark, `LinkBlue` for kicker — slightly more "operational" feel than Template C).
3. Recipient metadata `tabularx` (left recipient block, right date/ID).
4. Subject line in 13/16pt bold black.
5. Body greeting + 2 paragraphs.
6. **Activation/checklist callout** — bordered card with 4-step vertical-rule table (the `p{3.2cm} !{\color{LinkBlue}\vrule width 1.5pt} X @{}` pattern).
7. Closing support paragraph + "Sincerely," + signature `tabularx`.

### Template E — Beamer Pitch Deck

**Used by:** [`investorpitchdeck.tex`](investorpitchdeck.tex:1)

`\documentclass[aspectratio=169, 11pt]{beamer}` with:
```latex
\setbeamercolor{background canvas}{bg=PureWhite}
\setbeamercolor{normal text}{fg=DeepCharcoal}
\setbeamertemplate{navigation symbols}{}
```
Each `\begin{frame}` follows the pattern:
1. Kicker: `\textsf{\scriptsize\bfseries\color{LinkBlue}\uppercase{NN / <Section Title>}`.
2. Slide title at 22/28 in `CorporateNavy`.
3. Body via `tabularx` (1, 2, or 3 cols), with `\textperiodcentered` bullets or `\begin{enumerate}`.
4. Closing pull-quote line: `\textsf{\small ... }`.

Charts (pgfplots): use `LinkBlue` (orders), `CorporateNavy` (merchants), `DeepCharcoal` (riders) as the canonical series colors. Donut charts use 60/30/10 percent tints of the same three colors.

---

## 10. Kicker / Tag / Label Pattern

Tiny uppercase label that sits above titles or below them. Used as a section marker:

```latex
\textsf{\scriptsize\bfseries\color{LinkBlue}\uppercase{<LABEL TEXT>}}
```

Examples in the wild:
- `01 / The Thesis`, `02 / The Gap`, …, `27 / The Investment Opportunity` (pitch deck).
- `Confidential \textperiodcentered\ Founding Framework` (founders cover).
- `Statutory Filing \textperiodcentered\ Form CR2 Adoption` (articles cover).
- `PRIVATE PREVIEW INVITATION` (invitation).
- `RSVP CONFIRMATION` (RSVP).
- `OFFICIAL MEDIA BRIEFING` (thank-you).
- `FOR IMMEDIATE RELEASE` (press).
- `ZONE A \textperiodcentered\ MAIN HALL` (signage).

→ Always separated from the next element with `\vspace{0.2cm}`.

---

## 11. Micro-Typography Conventions

- Use `\textperiodcentered` (`·`) as the **only** separator between title segments — never pipes `|`, never em-dashes `—`.
- Use `\textbf` (or `\bfseries`) for emphasis; never underline except for fillable form fields.
- Dates are written `, 2026` (a literal comma + space + year) after a `\rule{<w>cm}{0.5pt}` for handwritten dates.
- Empty form fields use:
  ```latex
  \underline{\hspace{3.0cm}}
  \rule{3cm}{0.5pt}
  \rule{4cm}{0.4pt}
  ```
- Phone format on business cards / sign-offs: `+254 (0) 700 000 000`.
- Email format: `name@muncheez.com` (lowercase). Common inboxes: `press@`, `partners@`, `fleet@`, `invest@`, `events@`, `contact@`.
- Reference codes follow the pattern: `MCH-2026-<TYPE>-<NUMBER or ID>`.

---

## 12. Universal Package Loading Order

This exact ordering is used in every A4 article document in the folder and should be preserved:

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[margin=...]{geometry}
\usepackage{xcolor}
\usepackage{setspace}
\usepackage{tabularx}
\usepackage{tikz}              % only when asymmetric line / diagrams / QR needed
\usepackage{booktabs}           % only for legal tables
\usepackage[hidelinks]{hyperref}
\usepackage[scaled=0.92]{helvet}
\renewcommand{\familydefault}{\sfdefault}
```

Beamer deck adds:
```latex
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
```

`titlesec` and `enumitem` are added only when section numbering & list spacing need fine-tuning (employee contract).

---

## 13. Document Inventory & Their Distinguishing Markers

| File | Wordmark | Template | Distinguishing details |
|---|---|---|---|
| [`employeecontract.tex`](employeecontract.tex:1) | 36/42 black | B | Fancy header, NDA section as Schedule A, side-by-side signatures |
| [`articleofassociation.tex`](articleofassociation.tex:1) | 44/52 navy cover | A | Titlepage, BRS Form CR2 framing, booktabs cap table |
| [`memorandumofassociation.tex`](memorandumofassociation.tex:1) | 44/52 navy cover | A | Titlepage, CR2 statutory subscription table, witness block |
| [`foundersagreement.tex`](foundersagreement.tex:1) | 44/52 navy cover | A | Multi-document composite (4 sections), reverse vesting, leaver matrix |
| [`invitationletter.tex`](invitationletter.tex:1) | 38/44 navy header | C | Two-line right header, event details with hyperlink |
| [`merchantonboardingletter.tex`](merchantonboardingletter.tex:1) | 30/36 black header | D | 4-step checklist card, operational tone |
| [`rideronboardingletter.tex`](rideronboardingletter.tex:1) | 30/36 black header | D | Same skeleton as merchant; safety-first copy |
| [`pressreleasesample.tex`](pressreleasesample.tex:1) | 28/34 black header | C | Dateline in bold, `###` end marker, solid black palette only |
| [`leavebehindsheetsample.tex`](leavebehindsheetsample.tex:1) | 30/36 navy header | C | Two-column challenge/solution block with hairline divider |
| [`rsvpconfirmationemail.tex`](rsvpconfirmationemail.tex:1) | 36/42 navy header | C | QR code (tikz), event metadata side-by-side, schedule table |
| [`posteventthankyou.tex`](posteventthankyou.tex:1) | 38/44 navy header | C | Media archive resource list with hyperlinks |
| [`nametagmuncheez.tex`](nametagmuncheez.tex:1) | 48/54 navy | Special | QR + linear barcode in tikz, role banner block, lanyard cutout guide |
| [`stagevenuesignage.tex`](stagevenuesignage.tex:1) | 56/64 navy | Special | Massive hero wordmark, centered short dual-line, asymmetric content placement |
| [`investorpitchdeck.tex`](investorpitchdeck.tex:1) | 42/48 navy | E (Beamer) | 29 slides, kicker `NN / Title` system, three-color chart series |
| [`thankyoufollowup.tex`](thankyoufollowup.tex:1) | – | – | Empty file; needs filling using Template C |

---

## 14. Do's and Don'ts

**Do**
- Always set `\color{SolidBlack}` + `\pagecolor{PureWhite}` at the preamble.
- Always force `\sfdefault` with Helvetica.
- Always end the wordmark with the blue bold period.
- Always use the asymmetric dual-tone rule or a `RuleNavy`/`SolidBlack`/`BorderGray` plain rule — never a gradient or shaded bar.
- Always close single-page docs with `\vfill` before the footer block.
- Always prefix the footer's right column with a reference code (`REF: MCH-2026-...`).

**Don't**
- Don't introduce new colors without adding them to the canonical palette table.
- Don't use serif fonts (LaTeX defaults to Computer Modern — the helvet override is what enforces sans).
- Don't use bold blue body text.
- Don't use `tabular` when `tabularx` is required for full-width layout.
- Don't use `\hline` in legal tables — use `\toprule`, `\midrule`, `\bottomrule` from `booktabs`.
- Don't add drop shadows, gradients, rounded-corner boxes, or other "decorative" elements. The system is intentionally flat and orthogonal.
- Don't use bold-on-blue for long phrases; LinkBlue is an accent only.

---

## 15. Quick-Start: Bare-Bones Letter Skeleton

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[margin=1in,top=1in,bottom=1in]{geometry}
\usepackage{xcolor}
\usepackage{setspace}
\usepackage{tabularx}
\usepackage{tikz}
\usepackage[hidelinks]{hyperref}

\usepackage[scaled=0.92]{helvet}
\renewcommand{\familydefault}{\sfdefault}

\definecolor{SolidBlack}{HTML}{000000}
\definecolor{PureWhite}{HTML}{FFFFFF}
\definecolor{LinkBlue}{HTML}{0066CC}
\definecolor{CorporateNavy}{HTML}{0A192F}
\definecolor{RuleNavy}{HTML}{1E293B}

\color{SolidBlack}
\pagecolor{PureWhite}
\pagestyle{empty}
\setstretch{1.2}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}

\begin{document}

% --- BRAND HEADER ---
\begin{tabularx}{\textwidth}{@{} X >{\raggedleft\arraybackslash}X @{}}
    {\fontsize{36}{42}\sffamily\bfseries\color{CorporateNavy} Muncheez\color{LinkBlue}{\textbf{.}}} &
    \begin{raggedleft}
        {\fontsize{11}{14}\sffamily\bfseries\color{CorporateNavy} <DOC TYPE>} \\[0.05cm]
        {\fontsize{9}{12}\sffamily\bfseries\color{LinkBlue}\uppercase{<Sub-tagline>}
    \end{raggedleft} \\
\end{tabularx}

\vspace{0.4cm}

% --- ASYMMETRIC DUAL-TONE LINE ---
\begin{tikzpicture}
    \draw[line width=2pt, color=CorporateNavy] (0,0) -- (\textwidth-2.5cm, 0);
    \draw[line width=2pt, color=LinkBlue] (\textwidth-2.5cm,0) -- (\textwidth, 0);
\end{tikzpicture}

\vspace{0.8cm}

% --- TITLE ---
{\fontsize{24}{30}\sffamily\bfseries\color{CorporateNavy} <Title>}

\vspace{0.4cm}

% --- BODY ---
\textsf{\small\color{SolidBlack} <body copy here>}

\vfill

% --- FOOTER RULE ---
\color{RuleNavy}\hrule height 1pt
\vspace{0.4cm}

\begin{tabularx}{\textwidth}{@{} X >{\raggedleft\arraybackslash}X @{}}
    \textsf{\small\bfseries\color{CorporateNavy} Muncheez Technologies Inc.} \newline
    \textsf{\scriptsize\color{SolidBlack} Nairobi, Kenya} &
    \textsf{\small\bfseries\color{CorporateNavy} <SECRETARIAT>} \newline
    \textsf{\scriptsize\color{SolidBlack} REF: MCH-2026-<CODE>} \\
\end{tabularx}

\end{document}
```

---

## 16. File Reference (Cross-Links)

- [`latexdocuments/articleofassociation.tex`](latexdocuments/articleofassociation.tex:1)
- [`latexdocuments/employeecontract.tex`](latexdocuments/employeecontract.tex:1)
- [`latexdocuments/foundersagreement.tex`](latexdocuments/foundersagreement.tex:1)
- [`latexdocuments/investorpitchdeck.tex`](latexdocuments/investorpitchdeck.tex:1)
- [`latexdocuments/invitationletter.tex`](latexdocuments/invitationletter.tex:1)
- [`latexdocuments/leavebehindsheetsample.tex`](latexdocuments/leavebehindsheetsample.tex:1)
- [`latexdocuments/memorandumofassociation.tex`](latexdocuments/memorandumofassociation.tex:1)
- [`latexdocuments/merchantonboardingletter.tex`](latexdocuments/merchantonboardingletter.tex:1)
- [`latexdocuments/nametagmuncheez.tex`](latexdocuments/nametagmuncheez.tex:1)
- [`latexdocuments/posteventthankyou.tex`](latexdocuments/posteventthankyou.tex:1)
- [`latexdocuments/pressreleasesample.tex`](latexdocuments/pressreleasesample.tex:1)
- [`latexdocuments/rideronboardingletter.tex`](latexdocuments/rideronboardingletter.tex:1)
- [`latexdocuments/rsvpconfirmationemail.tex`](latexdocuments/rsvpconfirmationemail.tex:1)
- [`latexdocuments/stagevenuesignage.tex`](latexdocuments/stagevenuesignage.tex:1)
- [`latexdocuments/thankyoufollowup.tex`](latexdocuments/thankyoufollowup.tex:1) — empty; needs authoring