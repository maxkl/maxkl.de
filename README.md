# maxkl.de

My personal website, built with NodeJS.

## Installation

### Prerequisites:

- A running MongoDB instance (on your server or another, shouldn't matter)
- NodeJS
- A reverse proxy (e.g. nginx)

### Actual installation

- Create a config.json (look at server/lib/readConfig.js for available options)
- `yarn install`
- Ready to go! (`node server/app.js`)

## Adding projects

- Create a new folder under projects/: `mkdir -p projects/coolproject`
- (optional) Create project.json in that new directory for configuration options
  (for more info see server/lib/projects.js)
- Add code (index.js for server-side logic and public/ for client-side stuff
  (you can change these names in project.json if you want))
- Restart the server
- Open /projects in your browser to see the newly added project!
