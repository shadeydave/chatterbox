<?php
/**
 * Plugin Name: Chatterbox
 * Description: Adds ChatGPT text and image generation to your WordPress editor
 * Version: 1.0.0 Beta
 * Author: Dave Noel
 * License: GPL v2 or later
 */

// Prevent direct access to this file
if (!defined('ABSPATH')) {
    exit;
}

class Chatterbox {
    /**
     * Singleton instance
     * Ensures only one instance of the plugin exists in memory at once
     */
    private static $instance = null;
    private $plugin_path;
    private $plugin_url;

    /**
     * Singleton pattern implementation
     * Use this instead of creating new instances directly
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor: Sets up plugin basics and hooks
     * Private to enforce singleton pattern
     */
    private function __construct() {
        $this->plugin_path = plugin_dir_path(__FILE__);
        $this->plugin_url = plugin_dir_url(__FILE__);
        
        // Initialize all necessary WordPress hooks
        add_action('init', array($this, 'init'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor_assets'));
        add_action('wp_ajax_chatterbox_generate', array($this, 'handle_generate_request'));
    }

    /**
     * General initialization
     * Runs on WordPress 'init' hook
     */
    public function init() {
        // Load text domain for internationalization
        load_plugin_textdomain('chatterbox', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    /**
     * Admin-specific initialization
     * Registers settings and capabilities
     */
    public function admin_init() {
        // Register settings
        register_setting('chatterbox_options', 'chatterbox_api_key', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ));
        
        register_setting('chatterbox_options', 'chatterbox_model', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => 'gpt-4-0125-preview'
        ));
    }

    /**
     * Adds the admin menu page
     * Creates the settings page in WordPress admin
     */
    public function add_admin_menu() {
        add_options_page(
            'Chatterbox Settings',
            'Chatterbox',
            'manage_options',
            'chatterbox',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Enqueues assets for the block editor
     * Loads JavaScript and CSS files needed for the plugin
     */
    public function enqueue_block_editor_assets() {
        // Enqueue CSS first
        wp_enqueue_style(
            'chatterbox-styles',
            $this->plugin_url . 'css/styles.css',
            array(),
            $this->get_file_version('css/styles.css')
        );

        // Enqueue JS in correct dependency order
        $this->enqueue_script('utils/api.js', array('wp-blocks', 'wp-element', 'wp-data'));
        $this->enqueue_script('components/chat-interface.js', array('wp-components'));
        $this->enqueue_script('components/sidebar.js', array('wp-editor'));
        $this->enqueue_script('block-editor.js', array('wp-plugins', 'wp-edit-post'));

        // Pass necessary variables to JavaScript
        wp_localize_script('chatterbox-block-editor', 'chatterboxVars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('chatterbox_nonce'),
            'model' => get_option('chatterbox_model', 'gpt-4-0125-preview'),
            'debug' => WP_DEBUG
        ));
    }

    /**
     * Helper function to enqueue individual scripts
     * Maintains consistent naming and versioning
     */
    private function enqueue_script($path, $deps = array()) {
        $handle = 'chatterbox-' . str_replace('/', '-', substr($path, 0, -3));
        wp_enqueue_script(
            $handle,
            $this->plugin_url . 'js/' . $path,
            $deps,
            $this->get_file_version('js/' . $path),
            true
        );
        return $handle;
    }

    /**
     * AJAX handler for generate requests
     * Processes text and image generation requests
     */
    public function handle_generate_request() {
        // Security checks
        if (!check_ajax_referer('chatterbox_nonce', 'nonce', false)) {
            wp_send_json_error('Invalid nonce');
        }

        if (!current_user_can('edit_posts')) {
            wp_send_json_error('Insufficient permissions');
        }

        // Get and validate request data
        $prompt = sanitize_text_field($_POST['prompt'] ?? '');
        $type = sanitize_text_field($_POST['type'] ?? 'text');

        if (empty($prompt)) {
            wp_send_json_error('Prompt is required');
        }

        // Generate content based on type
        $result = $this->generate_content($prompt, $type);
        
        if ($result['success']) {
            wp_send_json_success($result['data']);
        } else {
            wp_send_json_error($result['data']);
        }
    }

    /**
     * Content generation handler
     * Makes API calls to OpenAI for text or image generation
     *
     * It would be cool if the text generation was continued from the last paragraph just below the current selected block. 
     * This would allow the user to continue writing without having to re-generate the entire prompt.
     * Note: This feature is not yet implemented.
     * For text generation, the API call returns a single completion that fills the page. 
     * It would be cool to have a summarizer or Cognitive layering that could generate multiple completions at varying levels of detail, in the author's original style.
     * Then on the front end, the user is presented with a choice of completions to choose from. This cognitive layering can
     * offer a user more options for writing and editing their post. And guarantees that summarized content contains the Gist of the original.
     * The additional hidden summarized content is presented in a collapsible section that can be toggled on and off by the user.
     */
    private function generate_content($prompt, $type) {
        $api_key = get_option('chatterbox_api_key');
        if (empty($api_key)) {
            return array('success' => false, 'data' => 'API key not configured');
        }

        if ($type === 'text') {
            // Text generation request
            $response = wp_remote_post('https://api.openai.com/v1/chat/completions', array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $api_key,
                    'Content-Type' => 'application/json',
                ),
                'body' => json_encode(array(
                    'model' => get_option('chatterbox_model', 'gpt-4o-mini'),
                    'messages' => array(
                        array('role' => 'user', 'content' => $prompt)
                    ),
                    'temperature' => 0.7,
                    'max_tokens' => 1000
                )),
                'timeout' => 30
            ));
        } elseif($type === 'image') {
        // Image generation request
        $response = wp_remote_post('https://api.openai.com/v1/images/generations', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'prompt' => $prompt,
                'n' => 1,
                'size' => '1792x1024',
                'model' => 'dall-e-3',
                'response_format' => 'b64_json'  // This requests base64 encoded PNG
            )),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            return array('success' => false, 'data' => $response->get_error_message());
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($body['error'])) {
            return array('success' => false, 'data' => $body['error']['message']);
        }

        // Decode base64 image
        $image_data = base64_decode($body['data'][0]['b64_json']);

        // Set up WordPress upload directory
        $upload_dir = wp_upload_dir();
        $filename = 'chatterbox-' . uniqid() . '.png';
        $filepath = $upload_dir['path'] . '/' . $filename;

        // Save the image file
        file_put_contents($filepath, $image_data);

        // Prepare the attachment
        $wp_filetype = wp_check_filetype($filename, null);
        $attachment = array(
            'post_mime_type' => $wp_filetype['type'],
            'post_title' => sanitize_file_name($filename),
            'post_content' => $prompt, // Store the prompt as the image description
            'post_status' => 'inherit'
        );

        // Insert the image into WordPress media library
        $attach_id = wp_insert_attachment($attachment, $filepath);
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        $attach_data = wp_generate_attachment_metadata($attach_id, $filepath);
        wp_update_attachment_metadata($attach_id, $attach_data);

        // Return the WordPress media URL instead of the DALL-E URL
        return array(
            'success' => true,
            'data' => array(
                'imageUrl' => wp_get_attachment_url($attach_id),
                'type' => 'image',
                'attachmentId' => $attach_id // This can be useful for the block editor
            )
        );
    }elseif ($type === 'audio') {
    /**
     * Audio generation handler
     * Makes API calls to OpenAI for audio generation
     * Note: This feature is not yet implemented.
     * 
     * Chunk the audio calls after the paragraphs are created. 
     * Generate the audio for each paragraph and then combine them into a single audio file.
     * Save that audio file in the media library
     * Return the URL as the source in an audio player block.
     */
    }

        // Handle API response
        if (is_wp_error($response)) {
            return array('success' => false, 'data' => $response->get_error_message());
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($body['error'])) {
            return array('success' => false, 'data' => $body['error']['message']);
        }

        // Format successful response
        return array(
            'success' => true,
            'data' => $type === 'text' 
                ? array('content' => $body['choices'][0]['message']['content'], 'type' => 'text')
                : array('imageUrl' => $body['data'][0]['url'], 'type' => 'image')
        );
    }

    /**
     * Gets the file version for cache busting
     * Uses file modification time in debug mode
     */
    private function get_file_version($file) {
        return WP_DEBUG 
            ? filemtime($this->plugin_path . $file)
            : '1.0.0';
    }

    /**
     * Renders the admin settings page
     * Creates the interface for API key configuration
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        include($this->plugin_path . './admin-settings.php');
    }
}

// Initialize the plugin
add_action('plugins_loaded', array('Chatterbox', 'get_instance'));