<form method="post" action="options.php">
    <?php
    settings_fields('chatterbox_options');
    do_settings_sections('chatterbox_options');
    ?>
    <table>
        <tr>
            <th>API Key:</th>
            <td>
                <input type="text" name="chatterbox_api_key" value="<?php echo esc_attr(get_option('chatterbox_api_key')); ?>">
            </td>
        </tr>
        <tr>
            <th>Model:</th>
            <td>
                <input type="text" name="chatterbox_model" value="<?php echo esc_attr(get_option('chatterbox_model', 'gpt-4-0125-preview')); ?>">
            </td>
        </tr>
    </table>
    <?php submit_button(); ?>
</form>
