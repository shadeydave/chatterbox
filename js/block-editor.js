(function() {
    console.log('Chatterbox: Initial script load');

    const { registerPlugin } = wp.plugins;
    const { PluginSidebarMoreMenuItem } = wp.editor;
    const { createElement, Fragment } = wp.element;
    const { dispatch } = wp.data;

    wp.domReady(function() {
        console.log('Chatterbox: DOM Ready');

        const ChatterboxPlugin = () => {
            console.log('Chatterbox: Creating plugin component');

            const handleMenuClick = () => {
                console.log('Chatterbox: Menu item clicked');
                // Force open the sidebar
                dispatch('core/edit-post').openGeneralSidebar('chatterbox/chatterbox-sidebar');
            };

            return createElement(
                Fragment,
                null,
                createElement(PluginSidebarMoreMenuItem, {
                    target: 'chatterbox-sidebar',
                    icon: 'admin-comments',
                    onClick: handleMenuClick
                }, 'Chatterbox AI'),
                createElement(window.ChatterboxSidebar)
            );
        };

        try {
            console.log('Chatterbox: Attempting to register plugin');
            registerPlugin('chatterbox', {
                render: ChatterboxPlugin,
                icon: 'admin-comments'
            });
            console.log('Chatterbox: Plugin registered successfully');
            
            // Force open the sidebar on initial load
            dispatch('core/edit-post').openGeneralSidebar('chatterbox/chatterbox-sidebar');
        } catch (error) {
            console.error('Chatterbox: Failed to register plugin:', error);
        }
    });
})();