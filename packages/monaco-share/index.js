const debug = require("debug")("monaco-share");

module.exports = (
  shareDbDocument,
  contentPath = "content",
  monacoModel = window.monaco.editor.getModels()[0]
) => {
  let changeDisposable,
    editsInProgress = false;

  let oldModel;
  shareDbDocument.subscribe(() => {
    if (!shareDbDocument.type) {
      shareDbDocument.create({ [contentPath]: "" });
    }

    monacoModel.setValue(shareDbDocument.data[contentPath]);
    oldModel = monacoModel;

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

    debug("Received changes from editor: %o", changes);

    let textCursor = 0;
    const operation = [];

    // Monaco provides the list of changes in descending order (starting from the end of the
    // document and moving up), but ShareDB operations need to move forward through the doc,
    // so we simply need to reverse the change list before prcessing them. Array.prototype.reverse
    // is technically slower the reverse iteration, however, the list of changes is typically only
    // a couple of items at most, so I'm leaving it since it reads more more intituively.
    // https://jsperf.com/reverse-foreach-vs-reversal-iteration
    changes.reverse().forEach(({ range, rangeLength, text }) => {
      const offset = oldModel.getOffsetAt(range.getStartPosition());
      let adjustedOffset = offset - textCursor;

      if (adjustedOffset > 0) {
        operation.push(adjustedOffset);
        textCursor += adjustedOffset;
      }

      if (rangeLength > 0) {
        operation.push({
          d: rangeLength
        });
        textCursor += rangeLength;
      }

      if (text) {
        operation.push(text);
      }
    });

    debug("Submitting operation to server: %o", operation);
    shareDbDocument.submitOp([
      {
        p: [contentPath],
        t: "text",
        o: operation
      }
    ]);

    // Snapshot the current document so that the next
    // editor can use it to determine the correct offsets.
    oldModel = window.monaco.editor.createModel(monacoModel.getValue());
  }

  const applyRemoteOperation = require("./remoteOperationHandler")(monacoModel);
  function serverOperationListener(operations, isLocalOperation) {
    if (isLocalOperation) {
      return;
    }

    editsInProgress = true;
    operations.forEach(applyRemoteOperation);
    editsInProgress = false;
  }

  return () => {
    oldModel = null;

    changeDisposable && changeDisposable.dispose();
    shareDbDocument.removeListener("op", serverOperationListener);
  };
};
