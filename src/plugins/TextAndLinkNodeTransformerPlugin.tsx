import { LinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isElementNode, $isTextNode, LexicalNode, TextNode } from "lexical";
import { FC, useEffect } from "react";

/*  TextNodeTransformer
    used to add inline style to text nodes
*/

export const setInlineStyle = (node: TextNode) => {
  const oldAttr = node.getStyle();
  const oldAttrs = oldAttr.split(";");
  // const newStylesMap: Set<string> = new Set<string>();
  const newStylesMap: Map<string, string> = new Map<string, string>();

  for (var a of oldAttrs) {
    const keyValue = a.split(":");
    const key = keyValue[0];
    const value = keyValue[1];
    key && value && newStylesMap.set(key.trim(), value.trim());
  }

  if (node.hasFormat("bold")) {
    newStylesMap.set("font-weight", "bold");
  } else {
    newStylesMap.delete("font-weight");
  }

  if (node.hasFormat("italic")) {
    newStylesMap.set("font-style", "italic");
  } else {
    newStylesMap.delete("font-style");
  }

  const hasUnderline = node.hasFormat("underline");
  const hasStrikeThrough = node.hasFormat("strikethrough");

  if (hasUnderline && hasStrikeThrough) {
    newStylesMap.set("text-decoration", "underline line-through");
  } else if (hasUnderline) {
    newStylesMap.set("text-decoration", "underline");
  }

  if (hasStrikeThrough) {
    newStylesMap.set("text-decoration", "line-through");
  } else {
    newStylesMap.delete("text-decoration");
  }

  const attr = Array.from(newStylesMap.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join(";");

  oldAttr != attr && node.setStyle(attr);
};

export const setInlineStyleToChildren = (nodes: LexicalNode[]) => {
    for (const node of nodes) {
      if ($isTextNode(node)) {
        setInlineStyle(node);
      }
      if ($isElementNode(node)) {
        setInlineStyleToChildren(node.getChildren());
      }
    }
  };

const TextAndLinkNodeTransformer: FC<{}> = () => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.registerNodeTransform(LinkNode, (node) => {
        const children = node.getChildren();
        setInlineStyleToChildren(children);
    });
  }, [editor]);

  return null;
};

export default TextAndLinkNodeTransformer;