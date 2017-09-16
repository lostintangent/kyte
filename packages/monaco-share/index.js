function log(message, ...args) {
    console.log(`[monaco-share]: ${message}`, ...args)
}

module.exports = (shareDbDocument, { monacoModel = window.monaco.editor.getModels()[0],
                                     documentPath = "content",
                                     enableLogging = true } = {}) => {
    let changeDisposable, editsInProgress = false;
    
    // 1) Subscribe to the provided document, and update
    // the Monaco model with the current server state.
    shareDbDocument.subscribe(() => {
        if (!shareDbDocument.type) {
            enableLogging && log("Creating document");
            shareDbDocument.create({ [documentPath]: "" });
        }

        enableLogging && log("Client subscribed");
        monacoModel.setValue(shareDbDocument.data[documentPath]);

        // Begin listening for incoming operations from the
        // server so that we can apply them to the local editor.
        shareDbDocument.on("op", serverOperationListener);
    
        // Begin listening for local edits, so that they
        // can be sent to the server for other participants.
        changeDisposable = monacoModel.onDidChangeContent(({ changes }) => {
            if (editsInProgress) {
                return;
            }

            const operation = [];
            changes.forEach(({ range, rangeLength, text }) => {
                const offset = monacoModel.getOffsetAt(range.getStartPosition());
                if (offset > 0) {
                    operation.push(offset);
                }

                if (rangeLength > 0 && !text) {
                    operation.push({ d: rangeLength });
                }

                if (text) {
                    operation.push(text);
                }
            });

            const operationRecord = [{ p: [documentPath], t: "text", o: operation }];
            enableLogging && log("Submitting document operation", operationRecord);
            shareDbDocument.submitOp(operationRecord);
        });
    });

    function serverOperationListener(operations, isLocalOperation) {        
        if (isLocalOperation) {
            return;
        }

        operations.forEach((operation) => {
            // Ensure that the incoming operation is for the expected document path
            if (operation.p && operation.p.length === 1 && operation.p[0] === documentPath && operation.t === "text") {
                if (!Array.isArray(operation.o)) {
                    throw new Error("Unexpected non-Array op for text document");
                }

                editsInProgress = true;
                let textIndex = 0;
                operation.o.forEach((part) => {
                    switch (typeof part) {
                        case "number": 
                            textIndex += part;
                            break;
        
                        case "string":
                            const position = monacoModel.getPositionAt(textIndex);
                            monacoModel.applyEdits([{
                                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                                text: part
                            }]);
                            textIndex += part.length;
                            break;
        
                        case "object": 
                            const startPosition = monacoModel.getPositionAt(textIndex);
                            const endPosition = monacoModel.getPositionAt(textIndex + part.d);
                            monacoModel.applyEdits([{
                                range: new monaco.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column)
                            }]);
                            break;
                    }
                });
                editsInProgress = false;
            };
        });
    }

    return () => {
        // Stop listening to input from the server
        // as well as changes coming from the editor model.
        changeDisposable && changeDisposable.dispose();
        shareDbDocument.removeListener("op", serverOperationListener);
    };
};