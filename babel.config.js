export default {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    plugins: [
        // Add plugin to handle import.meta.url
        function () {
            return {
                visitor: {
                    MetaProperty(path) {
                        if (ath.node.meta.name === 'import' && path.node.property.name === 'meta') {
                            // Replace import.meta with a process-based alternative
                            path.replaceWithSourceString('({ url: `file://${__filename}` })');
                        }
                    }
                }
            };
        }
    ]
};