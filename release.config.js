const config = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/github', {
        "assets": [
          {"path": "dist/index.js", "label": "Main Action File"},
        ]
      
    }]
  ]
};

module.exports = config;
