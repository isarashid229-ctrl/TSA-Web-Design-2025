# Texas Resource Hub

A statewide, offline-capable Progressive Web App (PWA) for finding community resources across Texas. Features include a searchable directory, SOS Pack generator for emergency situations, and full offline functionality.

## Features

- **Statewide Resource Directory**: Search and filter resources by category, city, cost, and accessibility
- **Offline-First PWA**: Works without internet connection using service workers
- **SOS Pack Generator**: Create printable emergency resource packs for community mutual aid
- **Responsive Design**: Works on phones, tablets, and computers
- **Installable**: Can be installed as a native app on devices

## Categories Covered

- Food Assistance
- Mental Health
- Housing
- Education
- Legal Aid
- Employment
- Health
- Youth Services

## Run Locally

Use Live Server or any static file server to run the project locally:

1. Clone this repository
2. Open the project folder
3. Use Live Server extension in VS Code, or run a local server
4. Open `index.html` in your browser

## Live Site

**GitHub Pages URL**: https://isarashid229-ctrl.github.io/TSA-Web-Design-2025/

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **PWA Features**: Service Worker, Web App Manifest, Offline caching
- **PDF Generation**: jsPDF library for SOS Pack creation
- **No Backend Required**: Pure client-side implementation

## Project Structure

```
├── index.html              # Home page
├── resources.html          # Resource directory
├── highlights.html         # Featured organizations
├── submit.html            # Resource submission form
├── reference.html         # Official sources and citations
├── offline.html           # Offline fallback page
├── 404.html              # Custom 404 page
├── manifest.webmanifest   # PWA manifest
├── service-worker.js      # Service worker for offline functionality
├── css/
│   └── styles.css        # Main stylesheet
├── js/
│   ├── app.js           # Core app functionality
│   ├── directory.js     # Directory filtering and display
│   ├── form.js          # Form handling
│   ├── pdf-pack.js      # SOS Pack PDF generator
│   └── pwa-install.js   # PWA installation prompts
└── data/
    └── resources.json   # Resource data
```

## License

Student-created project for educational purposes.
