import monacoShare from "monaco-share";
import shareClient from "../../lib/shareClient";

shareClient(new WebSocket(`wss://${location.host}`)).then(monacoShare);
