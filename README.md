# PDF Vision Viewer — Bubble Plugin

This is a repository based on the [Bubble](https://bubble.io) plugin 'PDF Vision Viewer'. This lets you use Github's functionality in terms of version control, forks and pull requests. Note that the plugin code is stored on Bubble's servers, and you need to synchronize your repository in the Bubble Plugin Editor.

An elegant and flexible PDF viewer for Bubble, built on [PDF.js](https://mozilla.github.io/pdf.js/) (rendering) and [pdf-lib](https://pdf-lib.js.org/) (PDF tools). The viewer is fully self-contained — no external `viewer.html` dependency — and the PDF is downloaded only once per URL.

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
