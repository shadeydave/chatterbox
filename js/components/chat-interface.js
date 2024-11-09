window.ChatterboxChatInterface = (function() {
    const { TextareaControl, Button, Spinner } = wp.components;
    const { createElement } = wp.element;

    return function ChatInterface(props) {
        console.log('Chatterbox: Rendering ChatInterface', props);
        
        if (!props) {
            console.error('Chatterbox: ChatInterface props are missing');
            return null;
        }

        const {
            messages = [],
            prompt = '',
            setPrompt,
            isLoading = false,
            generateContent
        } = props;

        return createElement('div', { className: 'chatterbox-interface' },
            // Messages area
            createElement('div', {
                className: 'chatterbox-messages',
                style: {
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginBottom: '20px',
                    padding: '10px'
                }
            },
                messages.map((msg, index) => createElement('div', {
                    key: index,
                    className: `chatterbox-message ${msg.role}`,
                    style: {
                        marginBottom: '10px',
                        padding: '8px',
                        borderRadius: '4px',
                        backgroundColor: msg.role === 'user' ? '#e9ecef' : '#ffffff',
                        border: '1px solid #dee2e6'
                    }
                },
                    msg.type === 'image' && msg.imageUrl ? 
                        createElement('img', {
                            src: msg.imageUrl,
                            alt: msg.content,
                            style: { maxWidth: '100%', height: 'auto' }
                        }) :
                        msg.content
                ))
            ),
            
            // Input area
            createElement(TextareaControl, {
                label: 'Enter your prompt',
                value: prompt,
                onChange: setPrompt,
                placeholder: 'Type your prompt here...',
                disabled: isLoading
            }),
            
            // Buttons
            createElement('div', {
                className: 'chatterbox-buttons',
                style: {
                    display: 'flex',
                    gap: '10px',
                    marginTop: '10px'
                }
            },
                createElement(Button, {
                    isPrimary: true,
                    onClick: () => generateContent('text'),
                    disabled: isLoading || !prompt,
                    style: { flex: 1 }
                }, isLoading ? createElement(Spinner) : 'Generate Text'),
                createElement(Button, {
                    isPrimary: true,
                    onClick: () => generateContent('image'),
                    disabled: isLoading || !prompt,
                    style: { flex: 1 }
                }, isLoading ? createElement(Spinner) : 'Generate Image')
            )
        );
    };
})();