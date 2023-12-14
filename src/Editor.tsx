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
        className={`editor-container ${showTreeView ? "tree-view" : ""} ${
          !isRichText ? "plain-text" : ""
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
                justifyContent: "center",
                gap: 21,
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
                      <Button onClick={() => {}}>Print</Button>
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
                      console.log("html.lastElementChild",  html, (html.children[1] as HTMLDivElement));
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
                      // const doc = new jsPDF("p", "pt", "letter");
                      // doc.html(html, {
                      //   callback: function (doc) {
                      //     doc.save('sample.pdf');
                      //   }
                      // });
                      const a = document.createElement("a");
                      a.setAttribute(
                        "href",
                        "data:text/plain;charset=utf-8," +
                          encodeURIComponent(html.innerHTML || "")
                      );
                      a.setAttribute("download", "check_rendered.html");
                      a.style.display = "none";
                      document.body?.appendChild(a);
                      a.click();
                      document.body?.removeChild(a);
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
