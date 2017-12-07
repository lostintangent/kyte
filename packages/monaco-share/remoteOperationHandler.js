const debug = require("debug")("monaco-share");

function applyRemoteDelete(model, startOffset, endOffset) {
  const startPosition = model.getPositionAt(startOffset);
  const endPosition = model.getPositionAt(endOffset);
  model.applyEdits([
    {
      range: new window.monaco.Range(
        startPosition.lineNumber,
        startPosition.column,
        endPosition.lineNumber,
        endPosition.column
      )
    }
  ]);
}

function applyRemoteInsert(model, text, offset) {
  const { column, lineNumber } = model.getPositionAt(offset);
  model.applyEdits([
    {
      range: new window.monaco.Range(lineNumber, column, lineNumber, column),
      text
    }
  ]);
}

module.exports = model => {
  return operation => {
    debug("Received document operation: %o", operation.o);

    let offset = 0;
    operation.o.forEach(part => {
      switch (typeof part) {
        case "number":
          offset += part;
          break;

        case "string":
          applyRemoteInsert(model, part, offset);
          offset += part.length;
          break;

        case "object":
          applyRemoteDelete(model, offset, offset + part.d);
          offset -= part.d;
          break;
      }
    });
  };
};
