# Document Vision Viewer — Bubble Plugin

This is a repository based on the [Bubble](https://bubble.io) plugin 'Document Vision Viewer' (formerly 'PDF Vision Viewer'). This lets you use Github's functionality in terms of version control, forks and pull requests. Note that the plugin code is stored on Bubble's servers, and you need to synchronize your repository in the Bubble Plugin Editor.

An elegant and flexible document viewer suite for Bubble with three self-contained elements — **Pdf View**, **Doc View** and **Excel View** — sharing the same property layout (content & behavior, appearance, protection & UI panels) so any of the three can be dropped in and configured the same way, whatever the file type.

## Pdf View — PDF viewer element

Built on [PDF.js](https://mozilla.github.io/pdf.js/) (rendering) and [pdf-lib](https://pdf-lib.js.org/) (PDF tools). The viewer is fully self-contained — no external `viewer.html` dependency — and the PDF is downloaded only once per URL.

## Features

- Continuous-scroll viewer with lazy page rendering (fast even for large PDFs)
- Toolbar: page navigation, zoom presets, fit to width/page, rotate, search with highlight and match navigation, thumbnails/bookmarks sidebar, presentation mode (fullscreen), print, download
- Dark/light theme + custom background, text and accent colors
- UI languages: auto-detect, `en`, `pt`, `fr`, `es`, `de`
- Dynamic watermark overlay (e.g. current user's e-mail)
- Protected mode: hides download/print, blocks right-click, text selection and Ctrl/Cmd+S/P/C (note: client-side protection is never absolute)
- PDF tools powered by pdf-lib: extract pages, merge PDFs, fill AcroForm fields (with optional flatten), stamp an image (e.g. a signature) on a page

## Element properties (inputs)

| Property | Type | Description |
|---|---|---|
| PDF Url | file/text | PDF to render (https://, http:// or Bubble `//...` URLs) |
| Starting Page Number | number | Page shown after load; navigates when changed dynamically |
| Viewer Language | text | `auto`, `en`, `pt`, `fr`, `es`, `de` |
| Initial Zoom | dropdown | `auto`, `page-width`, `page-fit`, `50`–`200` |
| Search Word | text | Term searched/highlighted automatically; reactive |
| Rename Download File | text | Custom download file name (with `.pdf`) |
| Theme / Background / Text / Accent Color | — | Viewer chrome colors |
| Show Thumbnails Panel | boolean | Open the sidebar on load |
| Protected Mode | boolean | Hide download/print + block copy interactions |
| Watermark Text / Opacity | text/number | Diagonal repeated watermark over pages |
| Remove Download / Print / Search / Left Toggle / Presentation Mode / Bookmark / Top Toolbar | boolean | Hide individual UI pieces |
| App Name | text | (Optional) normalizes `*.cdn.bubble.io` URLs |
| pdf viewer ID, Page to Fit, Remove File Open, Remove Right toggle | — | Legacy, kept for backward compatibility |

All yes/no properties (Show Thumbnails Panel, Protected Mode, Remove Download/Print/Search/Left Toggle/Bookmark/Presentation Mode/Top Toolbar, Page to Fit) use the native **Checkbox** editor in the Bubble property panel instead of a dynamic-expression field, and are grouped under labeled categories: *Conteúdo e comportamento*, *Aparência*, *Proteção e Painéis da UI* and *Legadas*.

## Exposed states (outputs)

`Is Valid PDF?`, `Total Pdf Pages`, `Current Page`, `Zoom Level (%)`, `Is Loading?`, `Search Results Count`, `PDF Title`, `PDF Author`, `Error Message`

## Events

`PDF is loaded`, `PDF failed to load`, `Page changed`, `Search completed`, `Download started`, `Print started`

## Element actions

Go to page · Next/Previous page · Zoom in/out · Set zoom (%) · Fit to page · Fit to width · Search text · Clear search · Next/Previous search result · Download PDF · Print PDF · Rotate · Toggle thumbnails panel · Presentation mode · Extract pages & download · Merge PDFs & download · Fill PDF form & download · Stamp image on page & download

## Notes & limitations

- The PDF's host must allow cross-origin requests (CORS). Bubble-hosted files work out of the box.
- Hiding download/print (or Protected Mode) is UI-level only; anyone with the file URL can still fetch it. Use Bubble privacy rules for real protection.
- Dependencies are loaded from jsDelivr: `pdfjs-dist@3.11.174` and `pdf-lib@1.17.1`.

## Doc View — DOC/DOCX viewer element

A second, self-contained element (`Doc View`) mirrors "Pdf View" property-for-property (same categories, same checkboxes, same colors/watermark/protection controls) but renders Word documents instead of PDFs.

- `.docx` is rendered fully client-side with [docx-preview](https://github.com/VolodymyrBaydalka/docxpreview) (paginated, with headings extracted into the sidebar as an outline and page/document metadata read from `docProps/core.xml` via JSZip).
- `.doc` (legacy binary format) has no reliable in-browser parser, so it falls back to the Microsoft Office Online viewer (`view.officeapps.live.com`) in an iframe — this requires the file URL to be publicly reachable over the internet (a Bubble-hosted file works; `localhost` does not).
- Same toolbar (search & highlight, sidebar/outline toggle, presentation mode, print, download), same theme/watermark/protected-mode properties, and the same `Go to page` / `Next page` / `Previous page` actions as the PDF element.

| Property | Type | Description |
|---|---|---|
| Document Url | file/text | `.doc` or `.docx` file to render |
| Starting Page Number | number | Page shown after load (docx only) |
| Viewer Language, Initial Zoom, Search Word, Rename Download File, App Name | — | Same as Pdf View |
| Theme / Background / Text / Accent Color, Watermark Text / Opacity | — | Same as Pdf View |
| Protected Mode, Show Thumbnails Panel, Remove Download/Print/Search/Left Toggle/Bookmark/Presentation Mode/Top Toolbar | checkbox | Same as Pdf View |

Exposed states: `Is Valid Document?`, `Total Document Pages`, `Current Page`, `Zoom Level (%)`, `Is Loading?`, `Search Results Count`, `Document Title`, `Document Author`, `Error Message`. Events: `Document is loaded`, `Document failed to load`, `Page changed`, `Search completed`, `Download started`, `Print started`.

Dependencies are loaded from jsDelivr: `jszip@3.10.1` and `docx-preview@0.3.6`.

## Excel View — XLSX/XLS/CSV viewer element

A third element (`Excel View`) mirrors "Pdf View" and "Doc View" property-for-property, but renders spreadsheets. Each sheet in the workbook is treated as a "page": the sidebar lists sheet tabs, and `Go to page` / `Next page` / `Previous page` switch between them.

- `.xlsx`, `.xls` and `.csv` are parsed and rendered fully client-side with [SheetJS](https://sheetjs.com/) (`xlsx` library) — each sheet becomes an HTML table, with workbook title/author read from the file's own metadata where present.
- Same toolbar (search & highlight over the visible sheet, sheet-list/sidebar toggle, presentation mode, print, download), same theme/watermark/protected-mode properties as the other two elements.

| Property | Type | Description |
|---|---|---|
| Spreadsheet Url | file/text | `.xlsx`, `.xls` or `.csv` file to render |
| Starting Sheet Number | number | Sheet shown after load |
| Viewer Language, Initial Zoom, Search Word, Rename Download File, App Name | — | Same as Pdf View |
| Theme / Background / Text / Accent Color, Watermark Text / Opacity | — | Same as Pdf View |
| Protected Mode, Show Thumbnails Panel, Remove Download/Print/Search/Left Toggle/Bookmark/Presentation Mode/Top Toolbar | checkbox | Same as Pdf View |

Exposed states: `Is Valid Spreadsheet?`, `Total Sheets`, `Current Page`, `Zoom Level (%)`, `Is Loading?`, `Search Results Count`, `Spreadsheet Title`, `Spreadsheet Author`, `Error Message`. Events: `Spreadsheet is loaded`, `Spreadsheet failed to load`, `Page changed`, `Search completed`, `Download started`, `Print started`.

Dependencies are loaded from jsDelivr: `xlsx@0.18.5` (SheetJS).
