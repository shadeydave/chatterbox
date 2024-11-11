/**
 * Chatterbox Block Editor Plugin
 * 
 * This plugin integrates Chatterbox AI functionality into the WordPress Block Editor.
 * It creates a sidebar interface accessible through the editor's more menu.
 */
(function() {
    console.log('Chatterbox: Initial script load');

    // WordPress dependencies
    const { registerPlugin } = wp.plugins;
    const { PluginSidebarMoreMenuItem } = wp.editor;
    const { createElement, Fragment } = wp.element;
    const { dispatch, useDispatch } = wp.data;  // Added useDispatch for hook pattern

    /**
     * Error Boundary Component for catching and handling React errors gracefully
     */
    class ErrorBoundary extends React.Component {
        constructor(props) {
            super(props);
            this.state = { hasError: false };
        }

        static getDerivedStateFromError(error) {
            return { hasError: true };
        }

        componentDidCatch(error, errorInfo) {
            console.error('Chatterbox Error Boundary:', error, errorInfo);
            // Add error reporting service call here if needed
        }

        render() {
            if (this.state.hasError) {
                return createElement('div', null, 'Something went wrong with Chatterbox.');
            }
            return this.props.children;
        }
    }

    /**
     * Error handler function for plugin registration failures
     * @param {Error} error - The error object from the catch block
     */
    const errorHandler = (error) => {
        console.error('Chatterbox: Failed to register plugin:', error);
        // Add error reporting service call here
    };

    // Wait for DOM to be ready before initializing
    wp.domReady(function() {
        console.log('Chatterbox: DOM Ready');

        /**
         * Main Plugin Component
         * Implements the sidebar menu item and sidebar content
         */
        const ChatterboxPlugin = React.memo(() => {
            console.log('Chatterbox: Creating plugin component');

            // Use dispatch hook for better React integration
            const { openGeneralSidebar } = useDispatch('core/edit-post');

            // Memoized click handler to prevent unnecessary re-renders
            const handleMenuClick = React.useCallback(() => {
                console.log('Chatterbox: Menu item clicked');
                openGeneralSidebar('chatterbox/chatterbox-sidebar');
            }, [openGeneralSidebar]);

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
        });

        // Add PropTypes validation for better development experience
        ChatterboxPlugin.propTypes = {
            // Add relevant prop types when needed
        };

        /**
         * Wrap the main component with error boundary for safety
         */
        const SafeChatterboxPlugin = () => (
            createElement(ErrorBoundary, null,
                createElement(ChatterboxPlugin)
            )
        );

        try {
            console.log('Chatterbox: Attempting to register plugin');
            
            // Register the plugin with WordPress
            registerPlugin('chatterbox', {
                render: SafeChatterboxPlugin,
                icon: 'admin-comments'
            });
            
            console.log('Chatterbox: Plugin registered successfully');
            
            // Force open the sidebar on initial load
            dispatch('core/edit-post').openGeneralSidebar('chatterbox/chatterbox-sidebar');

        } catch (error) {
            errorHandler(error);
        }

        // Return cleanup function for proper teardown
        return () => {
            console.log('Chatterbox: Cleaning up plugin');
            dispatch('core/edit-post').closeGeneralSidebar();
            // Add any additional cleanup here
        };
    });
})();