import React from "react";
import { EditorState, convertFromRaw, convertToRaw, genKey } from "draft-js";
import Editor from "draft-js-plugins-editor";
import createMentionPlugin, {
  defaultSuggestionsFilter,
} from "draft-js-mention-plugin";
import editorStyles from "./editorStyles.module.css";
import { api } from "../../../services/api";
import { Box, FormHelperText, Typography } from "@material-ui/core";
import { Chip, Stack } from "@mui/material";


const $companyName = `Nome da Empresa`;
const $customerName = `Nome do Cliente`;
const $reward = `Descrição da Oferta`;
const $expirationDate = `Data de Expiração`;

const Tag = ({ ...props }) => {
  return (
    <Chip
      {...props}
      style={{
        backgroundColor: "#F7D67F",
        fontWeight: "bold",
        borderRadius: 18,
      }}
    />
  );
};


class TexteareaWithMentions extends React.Component {
  constructor(props) {
    super(props);
    this.mentionPlugin = createMentionPlugin();
  }
  state = {
    editorState: EditorState.createEmpty(),
    suggestions: this.props.mentions,
    loading: false,
  };

  onChange = (editorState) => {
    this.setState({ editorState });
    const contentState = editorState.getCurrentContent();
    const raw = convertToRaw(contentState);
    const text = raw.blocks.reduce((text, raw) => {
      return text + " " + raw.text;
    }, "");
    if (text) {
      this.props.setValue(text);
    }
  };

  onSearchChange = ({ value }) => {
    this.setState({
      suggestions: defaultSuggestionsFilter(value, this.props.mentions),
    });
  };

  createEditorStateWithMentions = (text, entityRanges, entityMap) => {
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

  createentityRanges = (replacedText) => {
    const mentions = [$companyName, $customerName, $reward, $expirationDate];
    const entityRanges = mentions
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
                mentionData: this.props.mentions.find(
                  (item) => item.name.toLowerCase() === normalizedItem,
                ),
              });
              startIndex = endIndex + 1;
            }
          }
        }
        return acc;
      }, [])
      .sort((a, b) => a.offset - b.offset)
      .map((mention, index) => ({
        key: index,
        ...mention,
      }));

    return { entityRanges };
  };

  createEntityMap = (entityRanges) => {
    const entityMap = entityRanges.reduce((acc, mention) => {
      acc[mention.key] = {
        type: "mention",
        mutability: "SEGMENTED",
        data: {
          mention: mention.mentionData,
        },
      };
      return acc;
    }, {});
    return { entityMap };
  };

  createInitialState = (text) => {
    const replacedText = text
      .replace(/\$companyName/g, $companyName)
      .replace(/\$customerName/g, $customerName)
      .replace(/\$reward/g, $reward)
      .replace(/\$expirationDate/g, $expirationDate);

    // pegar as respectivas posicoes  e criar o objecto entitiRaw
    const { entityRanges } = this.createentityRanges(replacedText);
    // pegar as posicoes e criar o objecto entityMap
    const { entityMap } = this.createEntityMap(entityRanges);
    // Pegar EditorState
    const editorState = this.createEditorStateWithMentions(
      replacedText,
      entityRanges,
      entityMap,
    );
    this.setState({ editorState });
  };

  onExtractMentions = () => {
    const contentState = this.state.editorState.getCurrentContent();
    const raw = convertToRaw(contentState);
    let mentionedUsers = [];
    for (let key in raw.entityMap) {
      const ent = raw.entityMap[key];
      if (ent.type === "mention") {
        mentionedUsers.push(ent.data.mention);
      }
    }
    console.log(mentionedUsers);
  };

  async componentDidMount() {
    const GetOneMessage = async (companyId, type) => {
      this.setState({ loading: true });
      try {
        const { data } = await api.get(
          `loyalty-program/custom-messages/${companyId}/${type}`,
        );
        console.log("[GET ONE]", data);
        this.props.setMessageObj(data);
        this.createInitialState(data.message);
      } catch (error) {
        console.log("Error", error);
      } finally {
        this.setState({ loading: false });
      }
    };
    if (this.props.haveMessage) {
      await GetOneMessage(this.props.companyId, this.props.type);
    }
  }

  handleSelectTag = (item) => {
    console.clear()
    const newText = `${this.props.value.trim()} ${item.name}`
    console.log('=>', newText)
    this.createInitialState(newText);
  }

  render() {
    const { MentionSuggestions } = this.mentionPlugin;
    const plugins = [this.mentionPlugin];

    return (
      <>
        <Box
          style={{
            margin: "1rem auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box>
            <Typography style={{ fontWeight: "bolder" }} variant="h6">
              Personalizar Mensagem
            </Typography>
            <Typography style={{ fontWeight: "bold" }}>
              Tipo: <span style={{ color: "#F7D67F" }}>{this.props.type.label}</span>
            </Typography>
          </Box>
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            marginTop={1}
            marginBottom={1}
          >
            {this.props.mentions.map((item, i) => {
              return (
                <Tag
                  label={item.name}
                  onClick={() => this.handleSelectTag(item)}
                  key={i}
                />
              );
            })}
          </Stack>
          <Typography
            style={{
              fontSize: 12,
            }}
          >
            Clique nas tags acima para adicionar variáveis à sua mensagem, tal
            como no exemplo abaixo.
          </Typography>
          <Box
            style={{ backgroundColor: "whitesmoke", borderRadius: 6 }}
            marginTop={1}
            padding={0.8}
          >
            <Typography
              style={{
                fontSize: 10,
                lineHeight: 3,
              }}
            >
              Estimado Sr(a) <Tag label="Nome do Cliente" size="small" /> <br />
              Ganhou um <Tag label="Descrição da Oferta" size="small" /> por ter
              se registado. Pode reclamar a sua oferta na{" "}
              <Tag label="Nome da Empresa" size="small" /> apresentando o seu
              cartão de cliente. Válida até{" "}
              <Tag label="Data de Expiração" size="small" />
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography style={{ fontWeight: "bold" }}>Mensagem</Typography>
          {this.props.length >= 161 && (
            <FormHelperText
              style={{
                margin: 0,
                color: "red",
              }}
            >
              O texto da mensagem deve ter até 160 caracteres
            </FormHelperText>
          )}
          <div>
            {this.state.loading ? (
              <div style={{
                background: 'whitesmoke',
                height: 160,
                borderRadius: '2px',
                marginBottom: '5px',
                marginTop: '6px'
              }} />
            ) : (
              <div className={editorStyles.editor}>
                <Editor
                  editorState={this.state.editorState}
                  onChange={this.onChange}
                  plugins={plugins}
                  placeholder="Escreva @ para colocar a tag"
                />
                <MentionSuggestions
                  onSearchChange={this.onSearchChange}
                  suggestions={this.state.suggestions}
                />
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <span>{this.props.length}/160</span>
          </div>
        </Box>
      </>
    );
  }
}

export { TexteareaWithMentions };
