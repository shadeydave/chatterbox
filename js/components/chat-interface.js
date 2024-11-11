/**
 * Chatterbox Chat Interface Component
 * 
 * A React-based chat interface for AI content generation.
 * Provides user interaction through text input and displays
 * conversation history with support for both text and image content.
 * 
 * Features:
 * - Real-time message display
 * - Text/Image generation support
 * - Loading state management
 * - Responsive design
 * - Accessibility support
 */
window.ChatterboxChatInterface = (function() {
    // WordPress component imports
    const { TextareaControl, Button, Spinner } = wp.components;
    const { createElement, memo } = wp.element;

    /**
     * Message Display Component
     * Renders individual message items with appropriate styling
     * 
     * @param {Object} props - Message properties
     * @returns {React.Element} Rendered message component
     */
    const Message = memo(({ msg, index }) => {
        const baseMessageStyle = {
            marginBottom: '10px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
            wordBreak: 'break-word'
        };

        const messageStyles = {
            user: {
                ...baseMessageStyle,
                backgroundColor: '#e9ecef',
                marginLeft: '20px'
            },
            assistant: {
                ...baseMessageStyle,
                backgroundColor: '#ffffff',
                marginRight: '20px'
            },
            error: {
                ...baseMessageStyle,
                backgroundColor: '#ffe6e6',
                color: '#dc3545'
            }
        };

        return createElement('div', {
            key: index,
            className: `chatterbox-message ${msg.role}`,
            style: messageStyles[msg.role] || messageStyles.assistant,
            role: 'listitem',
            'aria-label': `${msg.role} message`
        },
            msg.type === 'image' && msg.imageUrl ? 
                createElement('img', {
                    src: msg.imageUrl,
                    alt: msg.content,
                    style: { 
                        maxWidth: '100%', 
                        height: 'auto',
                        borderRadius: '2px'
                    },
                    loading: 'lazy'
                }) :
                msg.content
        );
    });

    /**
     * Button Group Component
     * Renders action buttons with loading states
     * 
     * @param {Object} props - Button properties
     * @returns {React.Element} Rendered button group
     */
    const ActionButtons = memo(({ isLoading, prompt, generateContent }) => {
        const buttonStyle = {
            flex: 1,
            justifyContent: 'center',
            minWidth: '120px'
        };

        return createElement('div', {
            className: 'chatterbox-buttons',
            style: {
                display: 'flex',
                gap: '10px',
                marginTop: '10px',
                flexWrap: 'wrap'
            },
            role: 'group',
            'aria-label': 'Content generation actions'
        },
            ['text', 'image'].map(type => 
                createElement(Button, {
                    key: type,
                    isPrimary: true,
                    onClick: () => generateContent(type),
                    disabled: isLoading || !prompt.trim(),
                    style: buttonStyle,
                    icon: type === 'image' ? 'format-image' : 'text',
                    'aria-busy': isLoading
                }, 
                    isLoading ? createElement(Spinner) : `Generate ${type.charAt(0).toUpperCase() + type.slice(1)}`
                )
            )
        );
    });

    /**
     * Main Chat Interface Component
     * 
     * @param {Object} props Component properties
     * @param {Array} props.messages Chat message history
     * @param {string} props.prompt Current prompt value
     * @param {Function} props.setPrompt Prompt update function
     * @param {boolean} props.isLoading Loading state
     * @param {Function} props.generateContent Content generation handler
     * @returns {React.Element|null} Rendered chat interface
     */
    return function ChatInterface(props) {
        console.log('Chatterbox: Rendering ChatInterface', props);
        
        // Prop validation
        if (!props) {
            console.error('Chatterbox: ChatInterface props are missing');
            return null;
        }

        // Prop destructuring with defaults
        const {
            messages = [],
            prompt = '',
            setPrompt,
            isLoading = false,
            generateContent
        } = props;

        return createElement('div', { 
            className: 'chatterbox-interface',
            role: 'application',
            'aria-label': 'Chat interface'
        },
            // Messages area
            createElement('div', {
                className: 'chatterbox-messages',
                style: {
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginBottom: '20px',
                    padding: '10px',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6'
                },
                role: 'log',
                'aria-live': 'polite'
            },
                messages.map((msg, index) => 
                    createElement(Message, { msg, index, key: index })
                )
            ),
            
            // Input area
            createElement(TextareaControl, {
                label: 'Enter your prompt',
                value: prompt,
                onChange: setPrompt,
                placeholder: 'Type your prompt here...',
                disabled: isLoading,
                className: 'chatterbox-input',
                rows: 3,
                'aria-label': 'Prompt input',
                onKeyDown: (e) => {
                    if (e.key === 'Enter' && e.ctrlKey && !isLoading && prompt.trim()) {
                        e.preventDefault();
                        generateContent('text');
                    }
                }
            }),
            
            // Action buttons
            createElement(ActionButtons, {
                isLoading,
                prompt,
                generateContent
            })
        );
    };
})();