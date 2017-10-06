function log(message, ...args) {
  console.log(`[monaco-share]: ${message}`, ...args);
}

module.exports = (
  shareDbDocument,
  {
    monacoModel = window.monaco.editor.getModels()[0],
    documentPath = "content",
    enableLogging = true
  } = {}
) => {
  let changeDisposable,
    editsInProgress = false;

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
    changeDisposable = monacoModel.onDidChangeContent(contentChangeListener);
  });

  function contentChangeListener({ changes }) {
    console.log(changes);

    if (editsInProgress) {
      return;
    }

    const operation = [];
    let textCursor = 0;
    changes
      .map(({ range, rangeLength, text }) => {
        return {
          offset: monacoModel.getOffsetAt(range.getStartPosition()),
          rangeLength,
          text
        };
      })
      .sort((a, b) => {
        if (a.offset > b.offset) {
          return 1;
        } else if (a.offset < b.offset) {
          return -1;
        } else {
          return 0;
        }
      })
      .forEach(({ offset, rangeLength, text }) => {
        const adjustedOffset = offset - textCursor;
        textCursor += adjustedOffset;

        if (adjustedOffset > 0) {
          operation.push(adjustedOffset);
        }

        if (rangeLength > 0 && !text) {
          operation.push({ d: rangeLength });
        } else if (text) {
          operation.push(text);
        }
      });

    enableLogging && log("Submitting document operation", operation);
    shareDbDocument.submitOp([{ p: [documentPath], t: "text", o: operation }]);
  }

  function serverOperationListener(operations, isLocalOperation) {
    if (isLocalOperation) {
      return;
    }

    const editOperations = [];
    operations.forEach(operation => {
      if (
        operation.p &&
        operation.p.length === 1 &&
        operation.p[0] === documentPath &&
        operation.t === "text"
      ) {
        if (!Array.isArray(operation.o)) {
          throw new Error("Unexpected non-Array op for text document");
        }

        editsInProgress = true;
        let textIndex = 0;
        operation.o.forEach(part => {
          switch (typeof part) {
            case "number":
              textIndex += part;
              break;

            case "string":
              const { column, lineNumber } = monacoModel.getPositionAt(
                textIndex
              );
              monacoModel.applyEdits([
                {
                  range: new monaco.Range(
                    lineNumber,
                    column,
                    lineNumber,
                    column
                  ),
                  text: part
                }
              ]);

              textIndex += part.length;
              break;

            case "object":
              const startPosition = monacoModel.getPositionAt(textIndex);
              const endPosition = monacoModel.getPositionAt(textIndex + part.d);
              monacoModel.applyEdits([
                {
                  range: new monaco.Range(
                    startPosition.lineNumber,
                    startPosition.column,
                    endPosition.lineNumber,
                    endPosition.column
                  )
                }
              ]);
              break;
          }
        });
        editsInProgress = false;
      }
    });
  }

  return () => {
    // Stop listening to input from the server
    // as well as changes coming from the editor model.
    changeDisposable && changeDisposable.dispose();
    shareDbDocument.removeListener("op", serverOperationListener);
  };
};
