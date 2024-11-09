<?php
/**
 * Plugin Name: Chatterbox
 * Description: AI-powered content generation for WordPress blocks
 * Version: 0.1 Beta
 * Author: Dave Noel
 * License: MIT Whatevs...
 */

if (!defined('ABSPATH')) {
    exit;
}

class Chatterbox {
    private $api_key;
    private $plugin_path;
    private $plugin_url;

    public function __construct() {
        $this->plugin_path = plugin_dir_path(__FILE__);
        $this->plugin_url = plugin_dir_url(__FILE__);
        $this->api_key = get_option('chatterbox_api_key', '');

        // Initialize hooks
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor_assets'));
        add_action('wp_ajax_chatterbox_generate', array($this, 'ajax_generate_content'));
        
        // Add initialization hook
        add_action('init', array($this, 'init'));
    }

    public function init() {
        // Initialize any required features
        if (WP_DEBUG) {
            error_log('Chatterbox: Plugin initialized');
        }
    }

    public function add_admin_menu() {
        add_options_page(
            'Chatterbox Settings',
            'Chatterbox',
            'manage_options',
            'chatterbox-settings',
            array($this, 'settings_page')
        );
    }

    public function register_settings() {
        register_setting('chatterbox_settings', 'chatterbox_api_key', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ));
    }

    public function settings_page() {
        ?>
        <div class="wrap">
            <h2>Chatterbox Settings</h2>
            <form method="post" action="options.php">
                <?php settings_fields('chatterbox_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">OpenAI API Key</th>
                        <td>
                            <input type="password" 
                                   name="chatterbox_api_key" 
                                   value="<?php echo esc_attr($this->api_key); ?>" 
                                   class="regular-text">
                            <p class="description">Enter your OpenAI API key here</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function enqueue_block_editor_assets() {
        if (WP_DEBUG) {
            error_log('Chatterbox: Enqueuing editor assets');
        }
    
        // First enqueue the CSS
        wp_enqueue_style(
            'chatterbox-styles',
            $this->plugin_url . 'css/styles.css',
            array(),
            $this->get_file_version('css/styles.css')
        );
    
        // Then enqueue scripts in correct order
        wp_enqueue_script(
            'chatterbox-utils-api',
            $this->plugin_url . 'js/utils/api.js',
            array('wp-blocks', 'wp-element', 'wp-data'),
            $this->get_file_version('js/utils/api.js'),
            true
        );
    
        wp_enqueue_script(
            'chatterbox-components-chat-interface',
            $this->plugin_url . 'js/components/chat-interface.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'chatterbox-utils-api'),
            $this->get_file_version('js/components/chat-interface.js'),
            true
        );
    
        wp_enqueue_script(
            'chatterbox-components-sidebar',
            $this->plugin_url . 'js/components/sidebar.js',
            array('wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'chatterbox-components-chat-interface'),
            $this->get_file_version('js/components/sidebar.js'),
            true
        );
    
        wp_enqueue_script(
            'chatterbox-block-editor',
            $this->plugin_url . 'js/block-editor.js',
            array(
                'wp-blocks',
                'wp-element',
                'wp-editor',  // Make sure this is included
                'wp-components',
                'wp-i18n',
                'wp-data',
                'wp-plugins',
                'wp-dom-ready',
                'chatterbox-components-sidebar'
            ),
            $this->get_file_version('js/block-editor.js'),
            true
        );
    
        // Add debug information
        wp_localize_script('chatterbox-block-editor', 'chatterboxVars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('chatterbox_nonce'),
            'debug' => WP_DEBUG,
            'pluginUrl' => $this->plugin_url,
            'version' => $this->get_file_version('js/block-editor.js')
        ));
    }

    private function get_file_version($relative_path) {
        $file_path = $this->plugin_path . $relative_path;
        return file_exists($file_path) ? filemtime($file_path) : '1.0';
    }

    public function ajax_generate_content() {
        check_ajax_referer('chatterbox_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }

        if (empty($this->api_key)) {
            wp_send_json_error('API key not configured');
            return;
        }

        $prompt = sanitize_text_field($_POST['prompt']);
        $type = sanitize_text_field($_POST['type']);

        try {
            if ($type === 'image') {
                $response = $this->generate_image($prompt);
            } else {
                $response = $this->generate_text($prompt);
            }
            wp_send_json_success($response);
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }

    private function generate_text($prompt) {
        $url = 'https://api.openai.com/v1/chat/completions';
        
        $args = array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => 0.7,
                'max_tokens' => 10000
            )),
            'timeout' => 30
        );

        $response = wp_remote_post($url, $args);
        
        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($body['choices'][0]['message']['content'])) {
            return array('content' => $body['choices'][0]['message']['content']);
        }

        throw new Exception('Error generating response');
    }

    private function generate_image($prompt) {
        $url = 'https://api.openai.com/v1/images/generations';
        
        $args = array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'model' => 'dall-e-3',
                'prompt' => $prompt,
                'n' => 1,
                'size' => '1024x1024'
            )),
            'timeout' => 30
        );

        $response = wp_remote_post($url, $args);
        
        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($body['data'][0]['url'])) {
            return array(
                'content' => 'Generated image from prompt: ' . $prompt,
                'imageUrl' => $body['data'][0]['url']
            );
        }

        throw new Exception('Error generating image');
    }
}

// Initialize the plugin
new Chatterbox();