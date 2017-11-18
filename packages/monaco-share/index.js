const debug = require("debug")("monaco-share");

module.exports = (
  shareDbDocument,
  contentPath = "content",
  monacoModel = window.monaco.editor.getModels()[0]
) => {
  let changeDisposable,
    editsInProgress = false;

  shareDbDocument.subscribe(() => {
    if (!shareDbDocument.type) {
      shareDbDocument.create({ [contentPath]: "" });
    }

    monacoModel.setValue(shareDbDocument.data[contentPath]);

    // Begin listening for incoming operations from the
    // server so that we can apply them to the local editor.
    shareDbDocument.on("op", serverOperationListener);

    // Begin listening for local edits, so that they
    // can be sent to the server for other participants.
    changeDisposable = monacoModel.onDidChangeContent(contentChangeListener);
  });

  function contentChangeListener({ changes }) {
    if (editsInProgress) {
      return;
    }

    // Insert (simply insert, normal auto-closing char)
    // Delete (simple delete, normal undo)
    // Replace (Manual highselect/replace, or find/replace with a single match)
    // Replace, Replace, ... (Find replace) (NOT WORKING)
    // Insert, Delete (New line + removing previous smart indent)
    // Delete, Insert (Remove previous smart indent + insert newline)
    // Insert, Insert (auto-closing characters such as braces or quotes, when selecting a symbol)
    // Delete, Delete (undoing an auto-closing character that wraps a symbol)

    // TODO: Comment/uncomment block? Multi-cursor? Formatting (tons of inserts)?

    debug("Received local changes: %o", changes);

    let textCursor = 0;
    const operation = [];
    changes = changes
      .map(({ range, rangeLength, text }) => {
        return {
          offset: monacoModel.getOffsetAt(range.getStartPosition()),
          rangeLength,
          range,
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
      });

    if (changes.length === 2) {
      // Inserting a newline (plus smart indent), when
      // there is a subsequent line that has uncommitted "smart indentation"
      if (
        changes[0].text &&
        changes[1].rangeLength > 0 &&
        changes[0].text.startsWith("\n")
      ) {
        // Since a new line has been inserted, we need to shift
        // the second operation down a line
        changes[1].range.startLineNumber += 1;
        changes[1].offset = monacoModel.getOffsetAt(
          changes[1].range.getStartPosition()
        );
      }
    }

    let previousOperationCharacterImpact = 0;
    changes.forEach(({ offset, rangeLength, text }) => {
      let adjustedOffset = offset - textCursor;

      // Undoing an auto-closed character (quote, parens, bracket, brace) that was wrapped
      // around another string/symbol
      // Also includes find/replace
      if (rangeLength > 0) {
        adjustedOffset -= previousOperationCharacterImpact;
      }

      if (adjustedOffset > 0) {
        operation.push(adjustedOffset);
        textCursor += adjustedOffset;
      }

      if (rangeLength > 0) {
        operation.push({
          d: rangeLength
        });

        previousOperationCharacterImpact = rangeLength;
      }

      if (text) {
        operation.push(text);

        previousOperationCharacterImpact = text.length;
      }
    });

    debug("Submitting document operation: %o", operation);
    shareDbDocument.submitOp([{ p: [contentPath], t: "text", o: operation }]);
  }

  const applyRemoteOperation = require("./remoteOperationHandler")(monacoModel);
  function serverOperationListener(operations, isLocalOperation) {
    if (isLocalOperation) {
      return;
    }

    editsInProgress = true;

    operations.forEach(applyRemoteOperation);
    validateLocalState();

    editsInProgress = false;
  }

  function validateLocalState() {
    const localText = monacoModel.getValue();
    const remoteText = shareDbDocument.data[contentPath];

    if (localText !== remoteText) {
      debug("Local state out of sync, resetting to server snapshot");
      monacoModel.setValue(remoteText);
    }
  }

  return () => {
    // Stop listening to input from the server, as well
    // as changes coming from the provided editor model.
    changeDisposable && changeDisposable.dispose();
    shareDbDocument.removeListener("op", serverOperationListener);
  };
};
