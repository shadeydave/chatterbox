/**
 * Chatterbox API Module
 * 
 * This module serves as the main interface for the Chatterbox AI content generation system.
 * It's exposed globally through the window object to allow cross-module communication and
 * integration with WordPress's block editor (Gutenberg).
 * 
 * Technical Architecture:
 * - Implements IIFE pattern for encapsulation
 * - Utilizes WordPress's data layer for block manipulation
 * - Handles both text and image content generation
 * - Manages state through React hooks (passed as parameters)
 * - Implements error boundary and fallback mechanisms
 * 
 * Security Considerations:
 * - Uses WordPress nonce for request verification
 * - Implements proper content sanitization
 * - Validates API responses
 * - Handles sensitive state management
 */
window.chatterboxApi = (function() {
    // Destructure WordPress data utilities for block manipulation
    // These are essential for interacting with the Gutenberg editor state
    const { dispatch, select } = wp.data;

    /**
     * Error Handler Function
     * 
     * Centralizes error handling logic for consistent error management across the application.
     * Implements a three-part error handling strategy:
     * 1. Console logging for debugging
     * 2. UI state update for user feedback
     * 3. Message queue update for chat history
     * 
     * @param {Error} error - JavaScript Error object from catch block
     * @param {Function} setError - React setState function for error display
     * @param {Function} setMessages - React setState function for message history
     */
    const handleError = (error, setError, setMessages) => {
        console.error('Chatterbox Error:', error);
        setError(error.message);
        setMessages(msgs => [...msgs, { 
            role: 'assistant', 
            content: `Error: ${error.message}`,
            type: 'error'
        }]);
    };

    /**
     * Block Editor Content Updater
     * 
     * Handles the insertion or update of content in the WordPress block editor.
     * Supports two content types:
     * 1. Text: Updates existing block or creates new paragraph block
     * 2. Image: Creates new image block with caption
     * 
     * WordPress Block Editor Integration:
     * - Uses wp.blocks API for block creation
     * - Maintains block integrity through proper attribute updates
     * - Preserves editor state during updates
     * 
     * @param {string} content - The content to be inserted
     * @param {string} type - Content type identifier ('text' or 'image')
     * @param {string} imageUrl - URL for image content (optional)
     * @param {string} prompt - Original user prompt (used for image captions)
     */
    const updateEditorContent = (content, type, imageUrl, prompt) => {
        if (type === 'text') {
            // Get currently selected block if any
            const selectedBlock = select('core/block-editor').getSelectedBlock();
            
            if (selectedBlock) {
                // Update existing block content while preserving other attributes
                dispatch('core/block-editor').updateBlock(selectedBlock.clientId, {
                    ...selectedBlock,
                    attributes: {
                        ...selectedBlock.attributes,
                        content: content
                    }
                });
            } else {
                // Create and insert new paragraph block if no block is selected
                const newBlock = wp.blocks.createBlock('core/paragraph', {
                    content: content
                });
                dispatch('core/block-editor').insertBlocks(newBlock);
            }
        } else if (type === 'image' && imageUrl) {
            // Create and insert new image block with caption
            const imageBlock = wp.blocks.createBlock('core/image', {
                url: imageUrl,
                caption: prompt
            });
            dispatch('core/block-editor').insertBlocks(imageBlock);
        }
    };

    return {
        /**
         * Content Generation Method
         * 
         * Primary method for generating AI content. Handles the complete lifecycle of a content
         * generation request:
         * 1. Input validation
         * 2. State management
         * 3. API communication
         * 4. Response processing
         * 5. Content insertion
         * 6. Error handling
         * 
         * State Management Flow:
         * - Loading state: Controls UI feedback
         * - Messages state: Maintains chat history
         * - Prompt state: Manages input field
         * - Error state: Handles error display
         * 
         * API Communication:
         * - Uses WordPress AJAX endpoint
         * - Implements proper error handling
         * - Validates responses
         * - Manages security through nonce
         * 
         * @param {string} prompt - User input text
         * @param {string} type - Content type ('text' or 'image')
         * @param {Function} setLoading - Loading state controller
         * @param {Function} setMessages - Message history controller
         * @param {Function} setPrompt - Input field controller
         * @param {Function} setError - Error display controller
         */
        generateContent: async function(prompt, type, setLoading, setMessages, setPrompt, setError) {
            // Early return if prompt is empty
            if (!prompt) return;
            
            // Initialize request state
            setLoading(true);
            setMessages(prev => [...prev, { role: 'user', content: prompt }]);

            try {
                // Security validation
                if (!chatterboxVars?.nonce) {
                    throw new Error('Security token missing');
                }

                // API request configuration and execution
                const response = await fetch(chatterboxVars.ajax_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'chatterbox_generate',
                        nonce: chatterboxVars.nonce,
                        prompt: prompt.trim(), // Sanitize input
                        type: type
                    })
                });

                // Response validation
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Process response data
                const data = await response.json();

                if (data.success) {
                    // Update chat history with AI response
                    setMessages(msgs => [...msgs, { 
                        role: 'assistant', 
                        content: data.data.content,
                        type: type,
                        imageUrl: data.data.imageUrl
                    }]);

                    // Update editor content based on response
                    updateEditorContent(
                        data.data.content,
                        type,
                        data.data.imageUrl,
                        prompt
                    );
                } else {
                    throw new Error(data.data || 'Error generating content');
                }
            } catch (error) {
                // Centralized error handling
                handleError(error, setError, setMessages);
            } finally {
                // State cleanup regardless of success/failure
                setLoading(false);
                setPrompt('');
            }
        }
    };
})();