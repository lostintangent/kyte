## Supported operations

The Monaco editor is very feature-rich, and includes many "macro operations" in
addition to simply allowing you to type characters into it (e.g. toggle line
comments). The following list represents the set of editing operations that have
been explicitly supported by `monaco-share`, such that performing them will
correctly replicate their results to all participants in a collarative session:

1. Adding/deleting characters, including "smart indent" insertion and
   correction, as well as multi-cursor edits
1. Text replacement (i.e. selecting text and then typing something)
1. Typing a configured auto-closing character (e.g. `{`, `(`), with or without
   selecting a span of text
1. Copying a line up/down
1. Moving a line up/down
1. Toggling line and block comments
1. Find/replace
1. Format selection/document
1. Undo/redo _(including all of the above scenarios)_
