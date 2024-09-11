/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from "react";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { CharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import LexicalClickableLinkPlugin from "@lexical/react/LexicalClickableLinkPlugin";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import useLexicalEditable from "@lexical/react/useLexicalEditable";
import { useEffect, useState } from "react";
import { CAN_USE_DOM } from "./shared/canUseDOM";

import { createWebsocketProvider } from "./collaboration";
import { useSettings } from "./context/SettingsContext";
import { useSharedHistoryContext } from "./context/SharedHistoryContext";
import ActionsPlugin from "./plugins/ActionsPlugin";
import AutocompletePlugin from "./plugins/AutocompletePlugin";
import AutoEmbedPlugin from "./plugins/AutoEmbedPlugin";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import CodeActionMenuPlugin from "./plugins/CodeActionMenuPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import CollapsiblePlugin from "./plugins/CollapsiblePlugin";
import CommentPlugin from "./plugins/CommentPlugin";
import ComponentPickerPlugin from "./plugins/ComponentPickerPlugin";
import ContextMenuPlugin from "./plugins/ContextMenuPlugin";
import DragDropPaste from "./plugins/DragDropPastePlugin";
import DraggableBlockPlugin from "./plugins/DraggableBlockPlugin";
import EmojiPickerPlugin from "./plugins/EmojiPickerPlugin";
import EmojisPlugin from "./plugins/EmojisPlugin";
import EquationsPlugin from "./plugins/EquationsPlugin";
import ExcalidrawPlugin from "./plugins/ExcalidrawPlugin";
import FigmaPlugin from "./plugins/FigmaPlugin";
import FloatingLinkEditorPlugin from "./plugins/FloatingLinkEditorPlugin";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingTextFormatToolbarPlugin";
import ImagesPlugin from "./plugins/ImagesPlugin";
import InlineImagePlugin from "./plugins/InlineImagePlugin";
import KeywordsPlugin from "./plugins/KeywordsPlugin";
import { LayoutPlugin } from "./plugins/LayoutPlugin/LayoutPlugin";
import LinkPlugin from "./plugins/LinkPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import MarkdownShortcutPlugin from "./plugins/MarkdownShortcutPlugin";
import { MaxLengthPlugin } from "./plugins/MaxLengthPlugin";
import MentionsPlugin from "./plugins/MentionsPlugin";
import PageBreakPlugin from "./plugins/PageBreakPlugin";
import PollPlugin from "./plugins/PollPlugin";
import SpeechToTextPlugin from "./plugins/SpeechToTextPlugin";
import TabFocusPlugin from "./plugins/TabFocusPlugin";
import TableCellActionMenuPlugin from "./plugins/TableActionMenuPlugin";
import TableCellResizer from "./plugins/TableCellResizer";
import TableOfContentsPlugin from "./plugins/TableOfContentsPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import TreeViewPlugin from "./plugins/TreeViewPlugin";
import TwitterPlugin from "./plugins/TwitterPlugin";
import {VariablesPlugin} from "./plugins/VariablesPlugin";
import YouTubePlugin from "./plugins/YouTubePlugin";
import ContentEditable from "./ui/ContentEditable";
import Placeholder from "./ui/Placeholder";
import TextAndLinkNodeTransformer from "./plugins/TextAndLinkNodeTransformerPlugin";

import ReactToPrint from "react-to-print";
import Button from "./ui/Button";
// import html2pdf from "html2pdf.js";
import Html2Pdf from "js-html2pdf";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import Settings from "./Settings";
import DocsPlugin from "./plugins/DocsPlugin";
import PasteLogPlugin from "./plugins/PasteLogPlugin";
import TestRecorderPlugin from "./plugins/TestRecorderPlugin";
import TypingPerfPlugin from "./plugins/TypingPerfPlugin";
import { isDevPlayground } from "./appSettings";
import jsPDF from "jspdf";
import { $createParagraphNode, $createTextNode, $getRoot, EditorState, ElementNode, LexicalEditor, LexicalNode, TextNode } from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import { $createListItemNode, $createListNode } from "@lexical/list";

function FloatingActionPlugins() {
  const {
    settings: { measureTypingPerf },
  } = useSettings();

  const [editor] = useLexicalComposerContext();

  console.log("editor", editor._editable);

  return (
    <>
      {editor._editable && <Settings />}
      {isDevPlayground && editor._editable ? <DocsPlugin /> : null}
      {isDevPlayground && editor._editable ? <PasteLogPlugin /> : null}
      {isDevPlayground && editor._editable ? <TestRecorderPlugin /> : null}

      {measureTypingPerf && editor._editable ? <TypingPerfPlugin /> : null}
    </>
  );
}

const skipCollaborationInit =
  // @ts-expect-error
  window.parent != null && window.parent.frames.right === window;

export default function Editor(): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const [editor] = useLexicalComposerContext();

  const {
    settings: {
      isCollab,
      isAutocomplete,
      isMaxLength,
      isCharLimit,
      isCharLimitUtf8,
      isRichText,
      showTreeView,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      tableCellMerge,
      tableCellBackgroundColor,
    },
  } = useSettings();
  const isEditable = useLexicalEditable();
  const text = isCollab
    ? "Enter some collaborative rich text..."
    : isRichText
      ? "Enter some rich text..."
      : "Enter some plain text...";
  const placeholder = <Placeholder>{text}</Placeholder>;
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const contentRef = React.useRef<HTMLDivElement>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  const embedDoc = (editor: LexicalEditor) => {
    const data ={
      "editorState": {
        "root": {
          "children": [
            {
              "children": [
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": "The playground is a demo environment built with ",
                  "type": "text",
                  "version": 1
                },
                {
                  "detail": 0,
                  "format": 16,
                  "mode": "normal",
                  "style": "",
                  "text": "@lexical/react",
                  "type": "text",
                  "version": 1
                },
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": ". Try typing in ",
                  "type": "text",
                  "version": 1
                },
                {
                  "detail": 0,
                  "format": 1,
                  "mode": "normal",
                  "style": "",
                  "text": "some text",
                  "type": "text",
                  "version": 1
                },
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": " with ",
                  "type": "text",
                  "version": 1
                },
                {
                  "detail": 0,
                  "format": 2,
                  "mode": "normal",
                  "style": "",
                  "text": "different",
                  "type": "text",
                  "version": 1
                },
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": " formats.",
                  "type": "text",
                  "version": 1
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "type": "paragraph",
              "version": 1,
              "textFormat": 0,
              "textStyle": ""
            },
            {
              "children": [
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": "Make sure to check out the various plugins in the toolbar. You can also use ",
                  "type": "text",
                  "version": 1
                },
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": "#hashtags",
                  "type": "hashtag",
                  "version": 1
                },
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": " or @-mentions too!",
                  "type": "text",
                  "version": 1
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "type": "paragraph",
              "version": 1,
              "textFormat": 0,
              "textStyle": ""
            },
            {
              "children": [
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": "If you'd like to find out more about Lexical, you can:",
                  "type": "text",
                  "version": 1
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "type": "paragraph",
              "version": 1,
              "textFormat": 0,
              "textStyle": ""
            },
            {
              "children": [
                {
                  "children": [
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "Visit the ",
                      "type": "text",
                      "version": 1
                    },
                    {
                      "children": [
                        {
                          "detail": 0,
                          "format": 0,
                          "mode": "normal",
                          "style": "",
                          "text": "Lexical website",
                          "type": "text",
                          "version": 1
                        }
                      ],
                      "direction": "ltr",
                      "format": "",
                      "indent": 0,
                      "type": "link",
                      "version": 1,
                      "rel": null,
                      "target": null,
                      "title": null,
                      "url": "https://lexical.dev/"
                    },
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": " for documentation and more information.",
                      "type": "text",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "type": "listitem",
                  "version": 1,
                  "value": 1
                },
                {
                  "children": [
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "Check out the code on our ",
                      "type": "text",
                      "version": 1
                    },
                    {
                      "children": [
                        {
                          "detail": 0,
                          "format": 0,
                          "mode": "normal",
                          "style": "",
                          "text": "GitHub repository",
                          "type": "text",
                          "version": 1
                        }
                      ],
                      "direction": "ltr",
                      "format": "",
                      "indent": 0,
                      "type": "link",
                      "version": 1,
                      "rel": null,
                      "target": null,
                      "title": null,
                      "url": "https://github.com/facebook/lexical"
                    },
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": ".",
                      "type": "text",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "type": "listitem",
                  "version": 1,
                  "value": 2
                },
                {
                  "children": [
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "Playground code can be found ",
                      "type": "text",
                      "version": 1
                    },
                    {
                      "children": [
                        {
                          "detail": 0,
                          "format": 0,
                          "mode": "normal",
                          "style": "",
                          "text": "here",
                          "type": "text",
                          "version": 1
                        }
                      ],
                      "direction": "ltr",
                      "format": "",
                      "indent": 0,
                      "type": "link",
                      "version": 1,
                      "rel": null,
                      "target": null,
                      "title": null,
                      "url": "https://github.com/facebook/lexical/tree/main/packages/lexical-playground"
                    },
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": ".",
                      "type": "text",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "type": "listitem",
                  "version": 1,
                  "value": 3
                },
                {
                  "children": [
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "Join our ",
                      "type": "text",
                      "version": 1
                    },
                    {
                      "children": [
                        {
                          "detail": 0,
                          "format": 0,
                          "mode": "normal",
                          "style": "",
                          "text": "Discord Server",
                          "type": "text",
                          "version": 1
                        }
                      ],
                      "direction": "ltr",
                      "format": "",
                      "indent": 0,
                      "type": "link",
                      "version": 1,
                      "rel": null,
                      "target": null,
                      "title": null,
                      "url": "https://discord.com/invite/KmG4wQnnD9"
                    },
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": " and chat with the team.",
                      "type": "text",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "type": "listitem",
                  "version": 1,
                  "value": 4
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "type": "list",
              "version": 1,
              "listType": "bullet",
              "start": 1,
              "tag": "ul"
            },
            {
              "children": [
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": "Lastly, we're constantly adding cool new features to this playground. So make sure you check back here when you next get a chance ",
                  "type": "text",
                  "version": 1
                },
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "token",
                  "style": "",
                  "text": "🙂",
                  "type": "emoji",
                  "version": 1,
                  "className": "emoji happysmile"
                },
                {
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": ".",
                  "type": "text",
                  "version": 1
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "type": "paragraph",
              "version": 1,
              "textFormat": 0,
              "textStyle": ""
            }
          ],
          "direction": "ltr",
          "format": "",
          "indent": 0,
          "type": "root",
          "version": 1
        }
      },
      "lastSaved": 1725970383350,
      "source": "Playground",
      "version": "0.17.1"
    };
  
    // editor.update(() => {
    //   const root = $getRoot();
  
    //   // Function to recursively create nodes from JSON
    //   const createNodesFromJSON = (jsonNodes: any[]) => {
    //     return jsonNodes.map(node => {
    //       if (node.type === 'paragraph') {
    //         const paragraphNode = $createParagraphNode();
    //         const childNodes: any = createNodesFromJSON(node.children);
    //         childNodes.forEach((childNode: any) => paragraphNode.append(childNode));
    //         return paragraphNode;
    //       } else if (node.type === 'text') {
    //         return $createTextNode(node.text);
    //       }
    //       // Add more conditions here for other node types if needed
    //       return null;
    //     }).filter(Boolean);
    //   };
  
    //   // Create nodes from the JSON data
    //   const newNodes = createNodesFromJSON(data.editorState.root.children);
  
    //   // Append the new nodes to the root
    //   newNodes.forEach(node => root.append(node as any));
    // });

    const editorState = editor.parseEditorState(JSON.stringify(data.editorState));

    if (typeof editorState === "object") {

      // editor.update(() => {
      //   const root = $getRoot();
      
      //   // Iterate over the node map of the parsed editor state
      //   for (let [key, node] of editorState._nodeMap) {
      //     let newNode: any;
      
      //     // Create element nodes
      //     switch (node.__type) {
      //       case 'paragraph':
      //         newNode = $createParagraphNode();
      //         break;
      //       case 'heading':
      //         newNode = $createHeadingNode(node.__tag); // Typically 'h1', 'h2', etc.
      //         break;
      //       case 'quote':
      //         newNode = $createQuoteNode();
      //         break;
      //       case 'code':
      //         newNode = $createCodeNode(node.__language); // For code blocks with optional language
      //         break;
      //       case 'listitem':
      //         newNode = $createListItemNode();
      //         break;
      //       case 'list':
      //         newNode = $createListNode(node.__listType); // 'bullet' or 'numbered'
      //         break;
      //       default:
      //         console.warn(`Unsupported element node type: ${node.__type}`);
      //     }
      
      //     // If the node has children (e.g., text inside a paragraph or heading), append them
      //     if (newNode && node.__children && node.__children.length > 0) {
      //       node.__children.forEach((childKey: any) => {
      //         const childNode = editorState._nodeMap.get(childKey);
      
      //         // Create text node and append to its parent node
      //         if (childNode && childNode.__type === 'text') {
      //           const textNode = $createTextNode(childNode.__text);
      //           textNode.setFormat(childNode.__format); // Preserve text formatting (bold, italic, etc.)
      //           textNode.setStyle(childNode.__style || ""); // Preserve styles if applicable
      //           newNode.append(textNode); // Append the text node to the parent element
      //         }
      //       });
      //     }
      
      //     // Append the element node to the root
      //     if (newNode) {
      //       root.append(newNode);
      //     }
      //   }
      // });

      // Step 1: Read the editor state and get the new root's children
let newRootChildren: LexicalNode[] = [];

editorState.read(() => {
  const newRoot = editorState._nodeMap.get('root'); // Access the root node from the new editor state
  if (newRoot) {
    newRootChildren = newRoot.getChildren();
  }
});

// Step 2: Update the current editor by appending the new root's children
editor.update(() => {
  const root = $getRoot(); // Get the current root node

  // Function to handle creating new nodes based on the type
  const createNodeFromData = (nodeData: any) => {
    if (nodeData.type === 'text') {
      const textNode = $createTextNode(nodeData.text);
      textNode.setFormat(nodeData.format); // Apply formatting
      textNode.setStyle(nodeData.style);   // Apply styles if applicable
      return textNode;
    } else if (nodeData.type === 'paragraph') {
      const paragraphNode = $createParagraphNode();
      nodeData.children.forEach((childData: any) => {
        const childNode = createNodeFromData(childData);
        if (childNode) {
          paragraphNode.append(childNode);
        }
      });
      return paragraphNode;
    } else if (nodeData.type === 'heading') {
      const headingNode = $createHeadingNode(nodeData.level); // Level is typically 1, 2, or 3
      nodeData.children.forEach((childData: any) => {
        const childNode = createNodeFromData(childData);
        if (childNode) {
          headingNode.append(childNode);
        }
      });
      return headingNode;
    } else if (nodeData.type === 'list') {
      const listNode = $createListNode(nodeData.listType); // 'bullet' or 'numbered'
      nodeData.children.forEach((childData: any) => {
        const listItemNode = $createListItemNode();
        const listItemChildren = childData.children;
        listItemChildren.forEach((itemChildData: any) => {
          const childNode = createNodeFromData(itemChildData);
          if (childNode) {
            listItemNode.append(childNode);
          }
        });
        listNode.append(listItemNode);
      });
      return listNode;
    } else if (nodeData.type === 'quote') {
      const quoteNode = $createQuoteNode();
      nodeData.children.forEach((childData: any) => {
        const childNode = createNodeFromData(childData);
        if (childNode) {
          quoteNode.append(childNode);
        }
      });
      return quoteNode;
    } else if (nodeData.type === 'code') {
      const codeNode = $createCodeNode(nodeData.language); // Optional language parameter
      nodeData.children.forEach((childData: any) => {
        const childNode = createNodeFromData(childData);
        if (childNode) {
          codeNode.append(childNode);
        }
      });
      return codeNode;
    }
    // Add other node types as necessary
    return null;
  };

  // Create and append nodes
  newRootChildren.forEach(childData => {
    const newNode = createNodeFromData(childData);
    if (newNode) {
      root.append(newNode);
    }
  });
});

      
    }

  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia("(max-width: 1025px)").matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);

    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  return (
    <>
      {isRichText && editor._editable && (
        <ToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
      )}
      <div
        className={`editor-container ${showTreeView ? "tree-view" : ""} ${!isRichText ? "plain-text" : ""
          }`}
      >
        {isMaxLength && <MaxLengthPlugin maxLength={30} />}
        <DragDropPaste />
        <AutoFocusPlugin />
        <ClearEditorPlugin />
        <ComponentPickerPlugin />
        <EmojiPickerPlugin />
        <AutoEmbedPlugin />

        <MentionsPlugin />
        <EmojisPlugin />
        <HashtagPlugin />
        <KeywordsPlugin />
        <SpeechToTextPlugin />
        <AutoLinkPlugin />
        {editor._editable && (
          <CommentPlugin
            providerFactory={isCollab ? createWebsocketProvider : undefined}
          />
        )}
        {isRichText ? (
          <>
            {isCollab ? (
              <CollaborationPlugin
                id="main"
                providerFactory={createWebsocketProvider}
                shouldBootstrap={!skipCollaborationInit}
              />
            ) : (
              <HistoryPlugin externalHistoryState={historyState} />
            )}
            <RichTextPlugin
              contentEditable={
                <div ref={contentRef}>
                  <div className="editor-scroller" id="editor-scroller">
                    <div className="editor" ref={onRef}>
                      <ContentEditable />
                    </div>
                  </div>
                </div>
              }
              placeholder={placeholder}
              ErrorBoundary={LexicalErrorBoundary}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                gap: 10,
                boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
                padding: 5,
                boxSizing: "border-box"
              }}
            >
              {/* {!editor._editable && */}
              <ReactToPrint
                trigger={() => (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Button onClick={() => { }}>Print</Button>
                  </div>
                )}
                content={() => contentRef.current as HTMLDivElement}
                print={async (printIframe: HTMLIFrameElement) => {
                  const document = printIframe.contentDocument;
                  if (document) {
                    const html = document.getElementsByTagName("html")[0];
                    console.log("html", html, document.lastChild as any);
                    // await html2pdf().from(document.lastChild).save();
                    // const exporter = new Html2Pdf(html, {
                    //   filename: "Note Simple.pdf",
                    // });
                    // exporter.getPdf(true);
                    console.log("html.lastElementChild", html, (html.children[1] as HTMLDivElement));
                    editor.setEditable(false);
                    if (html.lastElementChild) {
                      html.lastElementChild
                    }
                    (html.children[1] as HTMLDivElement).style.backgroundColor = "#ffffff";
                    (html.children[1] as HTMLDivElement).style.height = "100%";
                    (document.getElementById("editor-root") as HTMLDivElement).contentEditable = "false";
                    (document.getElementById("editor-scroller") as HTMLDivElement).style.resize = "none";
                    (document.getElementById("editor-scroller") as HTMLDivElement).style.height = "inherit";
                    // (document.getElementById("editor-root") as HTMLDivElement).style.height = "inherit";
                    const doc = new jsPDF("p", "pt", "letter");
                    doc.html(html, {
                      callback: function (doc) {
                        doc.save('sample.pdf');
                      }
                    });
                    // const a = document.createElement("a");
                    // a.setAttribute(
                    //   "href",
                    //   "data:text/plain;charset=utf-8," +
                    //     encodeURIComponent(html.innerHTML || "")
                    // );
                    // a.setAttribute("download", "check_rendered.html");
                    // a.style.display = "none";
                    // document.body?.appendChild(a);
                    // a.click();
                    // document.body?.removeChild(a);
                  }
                }}
              />
              {/* } */}

              {editor._editable && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10
                  }}
                >
                  <Button
                    onClick={() => {
                      editor.setEditable(false);
                      localStorage.setItem(
                        "editorState",
                        JSON.stringify(editor.getEditorState())
                      );
                      window.location.reload();
                    }}
                  >
                    Save
                  </Button>

                  <Button onClick={() => embedDoc(editor)}>Embed</Button>
                </div>
              )}

              {!editor._editable && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Button
                    onClick={() => {
                      editor.setEditable(true);
                      // window.location.reload();
                    }}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            <MarkdownShortcutPlugin />
            <CodeHighlightPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <ListMaxIndentLevelPlugin maxDepth={7} />
            <TablePlugin
              hasCellMerge={tableCellMerge}
              hasCellBackgroundColor={tableCellBackgroundColor}
            />
            <TableCellResizer />
            <ImagesPlugin />
            <InlineImagePlugin />
            <LinkPlugin />
            <PollPlugin />
            <TwitterPlugin />
            <YouTubePlugin />
            <FigmaPlugin />
            <VariablesPlugin />
            {!isEditable && <LexicalClickableLinkPlugin />}
            <HorizontalRulePlugin />
            <EquationsPlugin />
            <ExcalidrawPlugin />
            <TabFocusPlugin />
            <TabIndentationPlugin />
            <CollapsiblePlugin />
            <PageBreakPlugin />
            <LayoutPlugin />
            <TextAndLinkNodeTransformer />
            {floatingAnchorElem && !isSmallWidthViewport && (
              <>
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
                <TableCellActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge={true}
                />
                <FloatingTextFormatToolbarPlugin
                  anchorElem={floatingAnchorElem}
                />
              </>
            )}
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={<ContentEditable />}
              placeholder={placeholder}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin externalHistoryState={historyState} />
          </>
        )}
        {(isCharLimit || isCharLimitUtf8) && (
          <CharacterLimitPlugin
            charset={isCharLimit ? "UTF-16" : "UTF-8"}
            maxLength={5}
          />
        )}
        {isAutocomplete && <AutocompletePlugin />}
        <div>{showTableOfContents && <TableOfContentsPlugin />}</div>
        {shouldUseLexicalContextMenu && <ContextMenuPlugin />}
        {editor._editable && <ActionsPlugin isRichText={isRichText} />}
      </div>
      {showTreeView && editor._editable && <TreeViewPlugin />}
      <FloatingActionPlugins />
    </>
  );
}
