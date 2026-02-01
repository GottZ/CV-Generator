# Projektkomplexitätsanalyse: CV-Generator

**Analysedatum:** 2026-02-01
**Analysiert von:** Claude (Opus 4.5)
**Repository:** GottZ/CV-Generator

---

## 1. Projektkennzahlen

| Metrik | Wert |
|--------|------|
| TypeScript Source Code | **~21.533 Zeilen** (160 Dateien) |
| HTML/CSS Templates | **~2.900 Zeilen** (Nunjucks + CSS) |
| Integrationstests | **~1.831 Zeilen** (Playwright) |
| Planungs-/Doku-Markdown | **~72.195 Zeilen** |
| JSON-Konfigurationen | **~344 Zeilen** |
| Git-Commits (sichtbar) | **50** |
| Packages (Monorepo) | **3** (@gottz/cvgen, @gottz/cv-core, @gottz/cv-templates) |
| Milestones | **3** (v1.0, v1.1, v1.2) |
| Entwicklungsphasen | **20** |
| Pläne | **65+** |
| Umgesetzte Requirements | **108** (41 + 20 + 47) |
| Direkte Abhängigkeiten | **30+** |

---

## 2. Technische Komplexitäts-Domänen

Das Projekt vereint **mindestens 12 distinkte Fachgebiete** in einem zusammenhängenden System:

### 2.1 Monorepo-Architektur & Build-System

- Bun-Workspaces mit 3 Packages und sauberer Dependency-Graph
- ESM-Module, TypeScript strict mode, kein klassischer Build-Step (Bun-Shebang)
- Biome für Linting und Formatting

### 2.2 CLI-Framework (Commander.js)

- 7 Hauptbefehle + 10 AI-Subcommands + Wizard-Subcommands
- Fuzzy-Matching (Fuse.js), Spinner (Ora), Progress-Indicators
- Farbige Terminal-Ausgabe (Picocolors)

### 2.3 Markdown-Parser mit Schema-Validierung

- Custom Parser für CV-spezifisches Markdown
- YAML-Frontmatter (gray-matter), Section-Extraktion
- Zod 4-Schema-Validierung mit Type-Inference
- Multi-Language Support (EN/DE)

### 2.4 Template-Engine (Nunjucks)

- 3 vollständige CV-Templates (Modern, Minimal, Classic)
- Shared Macros/Partials, Custom Filters
- Konfigurierbares Styling (Farben, Fonts, Margins)
- i18n-Layer mit Dayjs-Datumsformatierung

### 2.5 PDF-Generation-Pipeline

- Puppeteer für HTML-zu-PDF-Konvertierung
- Two-Pass-Generation (Sparse-Last-Page-Elimination)
- PDF-Bookmarks via pdf-lib, Metadata-Injection
- CSS-Fragmentation für korrekte Paginierung
- Flexbox-zu-Block-Umstellung für Break-Properties

### 2.6 DOCX-Generation

- CSS-zu-DOCX Style-Extraktion für visuelle Parität
- Sektionsweise Dokumentgenerierung (docx-Library)
- Format-übergreifende Konsistenz

### 2.7 AI/LLM-Integration (Vercel AI SDK)

- 3 Provider (Anthropic Claude, OpenAI, Ollama) mit einheitlicher Abstraktion
- 4-Stufen-Workflow mit persistentem State (.ai-state.json)
- 5 Content-Generatoren: Bullets, Summary, Keywords, Improve, Tailor
- Nunjucks-basierte Prompt-Templates
- Structured Output via Zod-Schemas

### 2.8 Review-System

- Git-add-p-Style Accept/Edit/Skip/Regenerate-Interface
- Diff-Display (side-by-side oder inline, abhängig von Terminal-Breite)
- Weak-Bullet-Detection (4 Kategorien: lacks_quantification, missing_outcome, too_generic, passive_voice)
- External-Editor-Integration ($VISUAL/$EDITOR/vi Fallback)
- Regeneration mit Temperature-Bumping und Jaccard-Deduplizierung

### 2.9 Interaktiver Wizard (Inquirer)

- Vollständige CV-Erstellung via geführte Prompts
- Input-Validierung, Defaults, Back-Navigation
- Markdown-Writer, Summary-Display
- STAR-Methode für Achievement-Bullets

### 2.10 Non-Interactive Mode

- TTY-Detection mit automatischem Mode-Switching
- Flag-basierter Input, JSON-Input, Stdin-Support
- Dry-Run-Mode, State-Builder mit Conflict-Detection
- CI/CD-taugliche Ausgabe (stderr/stdout-Separation)

### 2.11 Test-Infrastruktur

- Playwright Visual Regression (Pixel-Vergleich, 1% Toleranz)
- Text-Extraktion-Tests (ATS-Verifikation)
- Strukturelle HTML-Validierung
- Print-Parity-Tests (Browser Ctrl+P = CLI-PDF)
- Docker-Container für konsistentes Font-Rendering

### 2.12 CI/CD

- GitHub Actions Pipeline
- Docker-basierte Test-Umgebung (Chromium + Fonts)
- Artifact-Upload bei Failures
- JUnit-Reports

---

## 3. Architektur-Übersicht

```
┌─────────────────────────────────────┐
│      CLI Layer (@gottz/cvgen)       │
│  Commands: build, init, validate... │
│  AI Workflows & Interactive Wizard  │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────────┐  ┌──────────────┐
   │ Core Parser │  │   Renderer   │
   │  (@gottz/   │  │  (@gottz/cv- │
   │  cv-core)   │  │  templates)  │
   │             │  │              │
   │ - CV Parser │  │ - Nunjucks   │
   │ - Schema    │  │ - Config     │
   │ - Types     │  │ - i18n       │
   └─────────────┘  └──────────────┘
                 │
                 ▼
   ┌─────────────────────────────┐
   │     Output-Generierung      │
   │  - HTML + PDF (Puppeteer)   │
   │  - DOCX (docx Library)     │
   │  - Metadata & Bookmarks    │
   └─────────────────────────────┘
```

**Datenfluss:**
```
Markdown + YAML → [Core Parser] → Typisierte CV-Daten
→ [Renderer + Template + i18n] → HTML-String
→ [PDF-Generator | DOCX-Generator | HTML-Writer] → Ausgabedatei
```

---

## 4. Stundenschätzung

### 4.1 Detailaufschlüsselung

| Bereich | Senior (8+ J.) | Mid-Level (4-6 J.) | Begründung |
|---------|:-:|:-:|------------|
| Projektsetup, Architektur, Monorepo | 8–12 | 16–20 | Workspace-Config, TypeScript, Linting, Package-Struktur |
| Core Parser + Schema | 16–24 | 30–40 | Custom Markdown-Parsing, Zod-Schemas, Frontmatter, Section-Normalisierung |
| Template-Engine + i18n | 12–16 | 20–28 | Nunjucks-Integration, Filter, Loader, Config-System, 2 Sprachen |
| 3 HTML/CSS Templates | 24–40 | 40–60 | Je Template: Layout, Styling, Print CSS, ATS-Optimierung. Shared Components. |
| PDF-Pipeline | 16–24 | 28–40 | Puppeteer, Two-Pass, Bookmarks, Metadata, Paginierung |
| DOCX-Generation | 12–20 | 24–32 | CSS-Style-Extraktion, Format-Parität, wenig Referenzmaterial |
| HTML-Output + Bildverarbeitung | 6–10 | 10–16 | Self-Contained HTML, Base64-Embedding, Sharp-Integration |
| CLI-Framework (alle Commands) | 12–16 | 20–28 | 7 Commands, Optionen, Help-Text, Fuzzy-Matching, Spinner |
| AI-Subsystem (komplett) | 40–60 | 70–100 | Provider-Abstraktion, Workflow-State-Machine, 5 Generatoren, Prompt-Engineering, Review-UI |
| Wizard-System | 30–40 | 50–70 | Prompts für alle Sektionen, Validierung, Navigation, Markdown-Writer |
| Non-Interactive Mode | 12–16 | 20–28 | TTY-Detection, Flag/JSON-Input, Dry-Run, State-Builder |
| Template-Scaffolding | 10–14 | 16–24 | Copy/Validate, Customization-Prompts, Wizard |
| Test-Infrastruktur | 20–30 | 35–50 | Playwright, Visual Regression, Docker CI, Helpers, GitHub Actions |
| Konfigurations-System | 8–12 | 14–20 | Cascade (4 Ebenen), Schema-Validierung |
| Dokumentation | 12–16 | 16–24 | CLI-Doku, Markdown-Guide, Customization, FAQ, Contributing, Changelog |
| Integration, Debugging, Edge Cases | 20–30 | 40–60 | Cross-Format-Parität, ATS-Testing, Provider-Kompatibilität |

### 4.2 Gesamtschätzung

| Entwickler-Level | Stunden | Ungefähr in Wochen (40h/Woche) |
|:-----------------|--------:|:-------------------------------|
| **Senior Developer** (8+ Jahre) | **260 – 380** | **6,5 – 9,5 Wochen** |
| **Mid-Level Developer** (4–6 Jahre) | **450 – 640** | **11 – 16 Wochen** |
| **Junior Developer** | Nicht realistisch umsetzbar | — |

---

## 5. Begründung der Schätzung

### 5.1 Hauptkostentreiber

**AI-Subsystem (~25% des Gesamtaufwands)**

Multi-Provider-Abstraktion mit 3 LLM-Anbietern, 4-Stufen-Workflow mit State-Persistenz, 5 separate Content-Generatoren, iteratives Prompt-Engineering und ein Review-System mit Accept/Edit/Skip/Regenerate. Das ist effektiv eine eigenständige Applikation innerhalb der Applikation.

**PDF/DOCX-Pipeline (~15%)**

Die Konvertierung HTML-zu-PDF mit korrekter Paginierung (CSS-Fragmentation, Two-Pass-Generation, Sparse-Page-Elimination) ist notorisch schwierig. DOCX-Generation mit Style-Parität aus CSS ist ein wenig dokumentiertes Gebiet mit viel Trial-and-Error.

**3 vollständige Templates (~10%)**

Jedes Template benötigt Layout-Design, Print-CSS (das sich grundlegend anders verhält als Screen-CSS), ATS-Kompatibilität und Cross-Format-Konsistenz. Die Print-Parität (Browser Ctrl+P = CLI-PDF) ist ein eigenes Testfeld.

**Wizard + Non-Interactive (~15%)**

Zwei komplett separate Execution-Pfade (interaktiv vs. non-interaktiv) für dieselbe Funktionalität, mit STAR-Methoden-Integration, AI-Enhancement und vollständiger Validierung.

**Test-Infrastruktur (~8%)**

Visual Regression Testing mit Pixel-Vergleichen, Docker-basierte CI für Font-Konsistenz und mehrere Testtypen (visuell, strukturell, Text-Extraktion, Parität).

### 5.2 Warum ein Junior-Entwickler scheitern würde

- Zu viele spezialisierte Domänen (PDF-Paginierung, LLM-Integration, Print CSS, DOCX-Spezifikation)
- Nicht-offensichtliche Probleme ohne etablierte Stack-Overflow-Lösungen
- Architektur-Entscheidungen mit langfristigen Konsequenzen (Monorepo-Design, Provider-Abstraktion)
- State-Management-Komplexität im AI-Workflow

---

## 6. Benötigte Skills

### 6.1 Must-Have

| Skill | Anwendungsbereich |
|-------|-------------------|
| **TypeScript** (fortgeschritten) | Strict Mode, Zod, ESM, Generics, Discriminated Unions |
| **Node.js/Bun Runtime** | Dateisystem-APIs, Streams, Child Processes |
| **CLI-Design** | Commander.js, Inquirer, Terminal-UX-Patterns |
| **HTML/CSS** | Print CSS, CSS-Fragmentation, ATS-taugliche Layouts |
| **Template Engines** | Nunjucks (Jinja2-ähnlich), Macros, Partials |
| **PDF-Generation** | Puppeteer, pdf-lib, Browser-Automatisierung |
| **Testing** | Playwright, Visual Regression, Docker-basierte CI |

### 6.2 Should-Have

| Skill | Anwendungsbereich |
|-------|-------------------|
| **LLM/AI-Integration** | Vercel AI SDK, Prompt-Engineering, Structured Output |
| **DOCX-Spezifikation** | Open XML Format, programmatische Dokumentgenerierung |
| **Monorepo-Management** | Workspace-Konfiguration, Package-Grenzen |
| **ATS-Systeme** | Verständnis von iCIMS und ähnlichen Systemen |
| **Bildverarbeitung** | Sharp, Base64-Encoding |

### 6.3 Nice-to-Have

| Skill | Anwendungsbereich |
|-------|-------------------|
| **Docker** | Container für Test-Konsistenz |
| **GitHub Actions** | CI/CD-Pipeline-Design |
| **Fuzzy Search** | Fuse.js-Integration |
| **i18n-Patterns** | Mehrsprachigkeit |

---

## 7. Benötigtes Expertise-Level

**Empfehlung: Senior-Level (8+ Jahre Erfahrung)**

### Begründung

1. **Architektonische Reife:** Das Monorepo mit 3 klar getrennten Packages, die saubere Dependency-Chain (`cli → core + templates`) und die Plugin-Architektur für LLM-Provider erfordern architektonisches Denken, das typischerweise erst mit mehreren Jahren Erfahrung kommt.

2. **Cross-Domain-Kompetenz:** Ein einzelner Entwickler muss CLI-Design, PDF-Rendering, DOCX-Generation, Template-Engineering, AI-Integration und Test-Infrastruktur beherrschen. Diese Breite ist untypisch für Mid-Level-Positionen.

3. **Nicht-offensichtliche Probleme:** Two-Pass-PDF-Generation, CSS-Fragmentation für Print, Flexbox-zu-Block-Umstellung für Break-Properties, ATS-Parseability — das sind Probleme, die man nur durch Erfahrung kennt. Es gibt kaum Referenzmaterial dazu.

4. **State-Machine-Design:** Der 4-Stufen AI-Workflow mit Persistence, Resume-Fähigkeit und inter-Stage Datenfluss erfordert gute Abstraktionsfähigkeiten.

5. **UX-Entscheidungen:** Das Review-System (git-add-p-Style), die Terminal-Breiten-adaptive Diff-Anzeige, die korrekte stderr/stdout-Separation für CI/CD-Tauglichkeit — das sind Designentscheidungen, die Developer-Experience voraussetzen.

---

## 8. Kontext-Einordnung

Das Projekt wurde laut Git-Historie und Meilenstein-Dokumentation in **~4 Tagen** (22.01. bis 26.01.2026) umgesetzt. Das ist konsistent mit intensiver AI-gestützter Entwicklung, wobei ein erfahrener Mensch die Architektur-Entscheidungen trifft und die AI den Großteil der Implementierung übernimmt.

Die 72.195 Zeilen Planungs-Dokumentation (3,4x mehr als der eigentliche Code) sind ein typisches Artefakt eines AI-gestützten Workflows mit strukturierter Phase-Plan-Execute-Verify-Methodik.

**Ohne AI-Unterstützung** wäre dasselbe Ergebnis in **260–380 Stunden (Senior)** bzw. **450–640 Stunden (Mid-Level)** zu erwarten — also grob **7–10 Wochen Vollzeit** für einen erfahrenen Einzelentwickler.

---

*Generiert am 2026-02-01 durch Analyse des vollständigen Git-Repositories, der Commit-Historie, des Source Codes und der Projektdokumentation.*
