import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorState, genKey, convertToRaw } from "draft-js";
import Editor from "@draft-js-plugins/editor";
import createMentionPlugin, {
  defaultSuggestionsFilter,
} from "@draft-js-plugins/mention";
import mentions from "./Mentions";
import { SendHorizontal } from "lucide-react";

function App() {
  const ref = useRef<Editor>(null);
  const [text, setText] = useState("");
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(mentions);

  const { MentionSuggestions, plugins } = useMemo(() => {
    const mentionPlugin = createMentionPlugin();
    const { MentionSuggestions } = mentionPlugin;
    const plugins = [mentionPlugin];
    return { plugins, MentionSuggestions };
  }, []);

  const onOpenChange = useCallback((_open: boolean) => {
    setOpen(_open);
  }, []);
  const onSearchChange = useCallback(({ value }: { value: string }) => {
    setSuggestions(defaultSuggestionsFilter(value, mentions));
  }, []);

  function onChange(editor: EditorState) {
    setEditorState(editor);
    localStorage.setItem("ssss", JSON.stringify(editor));
  }

  return (
    <main className="flex flex-1 items-center justify-center h-screen">
      <div className="w-[800px]">
        <h2 className="font-sans mb-3 text-xl leading-3 font-bold">
          Write your latter
        </h2>
        <div
          className="bg-[#fefefe] mb-3 rounded-xl font-sans p-4 cursor-text border-2 border-[#3E00FF] box-border"
          onClick={() => {
            ref.current!.focus();
          }}
        >
          <Editor
            editorKey={genKey()}
            editorState={editorState}
            onChange={onChange}
            plugins={plugins}
            ref={ref}
          />
          <MentionSuggestions
            open={open}
            onOpenChange={onOpenChange}
            suggestions={suggestions}
            onSearchChange={onSearchChange}
            onAddMention={() => {
              // get the mention object selected
            }}
          />
          <div className="flex items-center justify-between">
            <div className="text-slate-400">
              <p>@ You can Mention any one you want</p>
            </div>
            <button className="bg-[#3E00FF] px-3 py-2 w-30 rounded-xl text-white self-end flex items-center gap-2 font-bold">
              <SendHorizontal />
              Submit
            </button>
          </div>
        </div>
        <pre>{text}</pre>
      </div>
    </main>
  );
}

export default App;
