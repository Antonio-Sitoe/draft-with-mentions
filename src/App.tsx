/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useRef, useState } from "react";
import { EditorState, genKey, convertToRaw, convertFromRaw } from "draft-js";
import Editor from "@draft-js-plugins/editor";
import createMentionPlugin, {
  MentionData,
  defaultSuggestionsFilter,
} from "@draft-js-plugins/mention";
import mentions from "./Mentions";
import { SendHorizontal } from "lucide-react";

interface IentityRanges {
  length: number;
  offset: number;
  type: string;
  mentionData: MentionData | undefined;
}

type IentityRangesType = IentityRanges & {
  key: string | number;
};
interface entityMap {
  entityRanges: IentityRangesType[];
}

const mentionsArray = mentions.map(({ name }) => name);

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
    const contentState = editor.getCurrentContent();
    const raw = convertToRaw(contentState);
    const text = raw.blocks.reduce((text, raw) => {
      return text + " " + raw.text;
    }, "");
    setText(text);
  }

  const createEditorStateWithMentions = (
    text: string,
    entityRanges: any,
    entityMap: any
  ) => {
    const stateToRaw = {
      blocks: [
        {
          key: genKey(), //Use the genKey function from draft
          text: text,
          type: "unstyled",
          inlineStyleRanges: [],
          data: {},
          depth: 0,
          entityRanges,
        },
      ],
      entityMap,
    };
    const ContentState = convertFromRaw(stateToRaw);
    return EditorState.createWithContent(ContentState);
  };

  function createentityRanges(replacedText: string): entityMap {
    const entityRanges = mentionsArray
      .reduce((acc, mention) => {
        const normalizedText = replacedText.toLowerCase(); // Normaliza o texto para tornar a
        const normalizedItem = mention.toLowerCase();
        if (normalizedText.includes(normalizedItem)) {
          let startIndex = 0;
          while (startIndex !== -1) {
            startIndex = normalizedText.indexOf(normalizedItem, startIndex);
            if (startIndex !== -1) {
              const endIndex = startIndex + normalizedItem.length - 1;
              const entityLength = normalizedItem.length;
              acc.push({
                length: entityLength,
                offset: startIndex,
                type: "mention",
                mentionData: mentions.find(
                  (item) => item.name.toLowerCase() === normalizedItem
                ),
              });
              startIndex = endIndex + 1;
            }
          }
        }
        return acc;
      }, [] as IentityRanges[])
      .sort((a, b) => a.offset - b.offset)
      .map((mention, index) => ({
        key: index,
        ...mention,
      }));

    return { entityRanges };
  }

  function createEntityMap(entityRanges: IentityRangesType[]) {
    const entityMap = entityRanges.reduce((acc, mention) => {
      acc[mention.key] = {
        type: "mention",
        mutability: "SEGMENTED",
        data: {
          mention: mention.mentionData,
        },
      };
      return acc;
    }, {} as any);
    return { entityMap };
  }

  function createInitialState(text: string) {
    const replacedText = text;
    const { entityRanges } = createentityRanges(replacedText);
    const { entityMap } = createEntityMap(entityRanges);
    const editorState = createEditorStateWithMentions(
      replacedText,
      entityRanges,
      entityMap
    );
    setEditorState(editorState);
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
            <button
              onClick={() => [createInitialState("")]}
              className="bg-[#3E00FF] px-3 py-2 w-30 rounded-xl text-white self-end flex items-center gap-2 font-bold"
            >
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
