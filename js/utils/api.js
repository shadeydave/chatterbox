window.chatterboxApi = (function() {
    const { dispatch, select } = wp.data;

    return {
        generateContent: async function(prompt, type, setLoading, setMessages, setPrompt, setError) {
            if (!prompt) return;
            
            setLoading(true);
            setMessages(prev => [...prev, { role: 'user', content: prompt }]);

            try {
                const response = await fetch(chatterboxVars.ajax_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'chatterbox_generate',
                        nonce: chatterboxVars.nonce,
                        prompt: prompt,
                        type: type
                    })
                });

                const data = await response.json();

                if (data.success) {
                    setMessages(msgs => [...msgs, { 
                        role: 'assistant', 
                        content: data.data.content,
                        type: type,
                        imageUrl: data.data.imageUrl
                    }]);

                    if (type === 'text') {
                        const selectedBlock = select('core/block-editor').getSelectedBlock();
                        if (selectedBlock) {
                            dispatch('core/block-editor').updateBlock(selectedBlock.clientId, {
                                ...selectedBlock,
                                attributes: {
                                    ...selectedBlock.attributes,
                                    content: data.data.content
                                }
                            });
                        } else {
                            const newBlock = wp.blocks.createBlock('core/paragraph', {
                                content: data.data.content
                            });
                            dispatch('core/block-editor').insertBlocks(newBlock);
                        }
                    } else if (type === 'image' && data.data.imageUrl) {
                        const imageBlock = wp.blocks.createBlock('core/image', {
                            url: data.data.imageUrl,
                            caption: prompt
                        });
                        dispatch('core/block-editor').insertBlocks(imageBlock);
                    }
                } else {
                    throw new Error(data.data || 'Error generating content');
                }
            } catch (error) {
                console.error('Error:', error);
                setError(error.message);
                setMessages(msgs => [...msgs, { 
                    role: 'assistant', 
                    content: `Error: ${error.message}`,
                    type: 'error'
                }]);
            }

            setLoading(false);
            setPrompt('');
        }
    };
})();