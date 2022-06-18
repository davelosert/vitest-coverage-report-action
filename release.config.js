const config = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/github', {
        "assets": [
          {"path": "dist/index.js", "label": "Main Action File"},
        ]
      
  }],
  ["@semantic-release/exec", {
      "successCmd": "./moveTag.sh ${nextRelease.version}"
  }],
  ]
};

module.exports = config;
