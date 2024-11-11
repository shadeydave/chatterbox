/**
 * Chatterbox Sidebar Component
 * 
 * A WordPress Block Editor sidebar component that provides the interface for
 * AI-powered content generation. Implements a chat-like interface with
 * state management and real-time interaction.
 * 
 * Architecture:
 * - Implemented as a WordPress Plugin Sidebar
 * - Uses React hooks for state management
 * - Integrates with WordPress data layer
 * - Manages chat history and interaction state
 */
window.ChatterboxSidebar = (function() {
    // WordPress component and utility imports
    const { PanelBody } = wp.components;
    const { createElement, useState, useEffect, useCallback } = wp.element;
    const { PluginSidebar } = wp.editor;
    const { useSelect } = wp.data;

    // Development logging for dependency availability
    console.log('Chatterbox: Loading sidebar component', {
        components: {
            PanelBody: !!PanelBody,
            PluginSidebar: !!PluginSidebar,
            useSelect: !!useSelect
        }
    });

    /**
     * Main Sidebar Component
     * 
     * Manages:
     * - Chat interface state
     * - Content generation
     * - Error handling
     * - Sidebar visibility
     * 
     * @returns {React.Component} Rendered sidebar component
     */
    return function ChatterboxSidebar() {
        console.log('Chatterbox: Rendering ChatterboxSidebar');
        
        // Track sidebar visibility using WordPress data layer
        const isSidebarOpen = useSelect(
            select => select('core/edit-post').isPluginSidebarOpened('chatterbox-sidebar'),
            []
        );

        // State management using React hooks
        const [prompt, setPrompt] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [messages, setMessages] = useState([]);
        const [error, setError] = useState(null);

        /**
         * Sidebar Initialization Effect
         * 
         * Handles:
         * - Initial message display
         * - Sidebar visibility changes
         * - Chat history initialization
         */
        useEffect(() => {
            console.log('Chatterbox: Sidebar visibility changed:', isSidebarOpen);
            
            if (isSidebarOpen && messages.length === 0) {
                setMessages([{ 
                    role: 'assistant', 
                    content: 'Chatterbox is ready! Try entering a prompt.',
                    type: 'text'
                }]);
            }
        }, [isSidebarOpen, messages.length]);

        /**
         * Content Generation Handler
         * 
         * Memoized callback to prevent unnecessary rerenders
         * Manages the content generation process through the API
         * 
         * @param {string} type - Type of content to generate ('text' or 'image')
         */
        const handleGenerate = useCallback((type) => {
            console.log('Chatterbox: Generating content', { type, prompt });
            
            if (!prompt.trim()) {
                setError('Please enter a prompt');
                return;
            }

            // Clear any existing errors
            setError(null);
            
            window.chatterboxApi.generateContent(
                prompt,
                type,
                setIsLoading,
                setMessages,
                setPrompt,
                setError
            );
        }, [prompt]);

        // Development logging for state changes
        console.log('Chatterbox: Current state:', {
            isSidebarOpen,
            hasError: !!error,
            messageCount: messages.length,
            prompt,
            isLoading
        });

        /**
         * Error Display Component
         * Conditionally rendered error message
         */
        const ErrorDisplay = error && createElement('div', {
            className: 'chatterbox-error',
            style: {
                color: 'red',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderRadius: '4px'
            }
        }, error);

        /**
         * Render Method
         * 
         * Component Structure:
         * - PluginSidebar (container)
         *   - PanelBody (content wrapper)
         *     - ErrorDisplay (conditional)
         *     - ChatterboxChatInterface (main UI)
         */
        return createElement(
            PluginSidebar,
            {
                name: 'chatterbox-sidebar',
                title: 'Chatterbox AI',
                icon: 'admin-comments',
                className: 'chatterbox-sidebar',
                isPinned: true
            },
            createElement(PanelBody, 
                {
                    initialOpen: true,
                    className: 'chatterbox-panel'
                },
                ErrorDisplay,
                createElement(window.ChatterboxChatInterface, {
                    messages,
                    prompt,
                    setPrompt,
                    isLoading,
                    generateContent: handleGenerate
                })
            )
        );
    };
})();