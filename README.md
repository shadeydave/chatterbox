# Chatterbox - WordPress AI Content Assistant

Chatterbox is a WordPress plugin that integrates OpenAI's GPT and DALL-E capabilities directly into your WordPress editor. It provides a convenient sidebar interface for generating both text and images while writing your posts.

![Chatterbox Sidebar](./screenshot-plugin-list.png) <!-- You'll want to add a screenshot -->

## Features

- Real-time AI text generation using GPT-4
- Image generation using DALL-E 3
- Seamless integration with WordPress Block Editor
- Direct content insertion into posts
- Chat-style interface for context-aware interactions
- Easy-to-use sidebar interface

## Installation

1. Download the plugin files and upload to your `/wp-content/plugins/chatterbox` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings > Chatterbox and enter your OpenAI API key
4. Start using the Chatterbox sidebar in your post editor!

## Requirements

- WordPress 5.8+
- PHP 7.4+
- OpenAI API key

## Configuration

1. Obtain an API key from [OpenAI](https://platform.openai.com/api-keys)
2. In your WordPress admin panel, navigate to Settings > Chatterbox
3. Enter your API key and save changes

## Usage

1. Open the WordPress post editor
2. Click the "Chatterbox AI" button in the top-right menu to open the sidebar
3. Enter your prompt in the text area
4. Choose between generating text or images
5. Generated text can be automatically inserted into your current block
6. Generated images will be added as new image blocks

## Development

The plugin is built using WordPress's native JavaScript APIs and React components.

### File Structure
chatterbox/
├── js/
│ ├── components/
│ │ ├── sidebar.js
│ │ └── chat-interface.js
│ ├── utils/
│ │ └── api.js
│ └── block-editor.js
├── css/
│ └── styles.css
└── index.php

sql_more

Copy

### Building and Contributing

1. Clone the repository
2. Install WordPress development environment
3. Link or copy the plugin to your local WordPress plugins directory
4. Make your changes
5. Test thoroughly before submitting pull requests

## Security

- API keys are stored securely in WordPress options
- All AJAX calls are nonce-protected
- User capabilities are checked before any API calls
- Input is sanitized before processing

## Credits

Built using:
- WordPress Block Editor components
- OpenAI API (GPT-4 and DALL-E 3)
- React
- WordPress Plugin API

## License

GPL v2 or later

## Support

For bug reports and feature requests, please use the [GitHub Issues](link-to-your-issues-page) page.

## Roadmap

- [ ] Enhanced error handling
- [ ] Support for more GPT models
- [ ] Image editing capabilities
- [ ] Prompt templates
- [ ] History saving
- [ ] Export/import of conversations
- [ ] Multiple API key support
- [ ] Team collaboration features

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](link-to-contributing.md) before submitting pull requests.

---

Made with ❤️ for the WordPress community
