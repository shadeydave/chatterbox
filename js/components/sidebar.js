window.ChatterboxSidebar = (function() {
    const { PanelBody } = wp.components;
    const { createElement, useState, useEffect } = wp.element;
    const { PluginSidebar } = wp.editor;
    const { useSelect } = wp.data;

    console.log('Chatterbox: Loading sidebar component', {
        components: {
            PanelBody: !!PanelBody,
            PluginSidebar: !!PluginSidebar,
            useSelect: !!useSelect
        }
    });

    return function ChatterboxSidebar() {
        console.log('Chatterbox: Rendering ChatterboxSidebar');
        
        // Track sidebar visibility
        const isSidebarOpen = useSelect(
            select => select('core/edit-post').isPluginSidebarOpened('chatterbox-sidebar'),
            []
        );

        const [prompt, setPrompt] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [messages, setMessages] = useState([]);
        const [error, setError] = useState(null);

        useEffect(() => {
            console.log('Chatterbox: Sidebar visibility changed:', isSidebarOpen);
            
            // Add initial message only when sidebar first opens
            if (isSidebarOpen && messages.length === 0) {
                setMessages([{ 
                    role: 'assistant', 
                    content: 'Chatterbox is ready! Try entering a prompt.',
                    type: 'text'
                }]);
            }
        }, [isSidebarOpen]);

        const handleGenerate = (type) => {
            console.log('Chatterbox: Generating content', { type, prompt });
            window.chatterboxApi.generateContent(prompt, type, setIsLoading, setMessages, setPrompt, setError);
        };

        console.log('Chatterbox: Current state:', {
            isSidebarOpen,
            hasError: !!error,
            messageCount: messages.length,
            prompt,
            isLoading
        });

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
                error && createElement('div', {
                    className: 'chatterbox-error',
                    style: {
                        color: 'red',
                        padding: '10px',
                        marginBottom: '10px'
                    }
                }, error),
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