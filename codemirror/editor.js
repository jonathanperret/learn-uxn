import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup';
import { Tag, tags, defaultHighlightStyle, classHighlightStyle, HighlightStyle } from "@codemirror/highlight";
import { UXNTAL, UxnTags }  from './uxntal-lang/uxntal.ts';
import { hoverTooltip } from "@codemirror/tooltip"
import { StateField } from "@codemirror/state"

// taken from https://codemirror.net/6/examples/tooltip/
// however we're looking for space boundaries
export const wordHover = hoverTooltip((view, pos, side) => {
  let {from, to, text} = view.state.doc.lineAt(pos)
  let start = pos, end = pos
  while (start > from && /[^ ]/.test(text[start - from - 1])) start--
  while (end < to && /[^ ]/.test(text[end - from])) end++
  if (start == pos && side < 0 || end == pos && side > 0)
    return null
  return {
    pos: start,
    end,
    above: true,
    class: 'cm-tooltip-hover',
    strictSide: true,
    create(view) {
      let dom = document.createElement("div")
      // in the example, this had a bug in it
      // where they slice the text, rather,
      // we need a slice of the doc object
      let word = view.state.doc.slice(start, end)

      if (word.length >= 3) {
        let three = word.slice(0, 3);
        let desc = tooltipData[three];

        if (desc) {
          dom.textContent = `${three} - ${desc}`;
        }
      }

      let one = word.slice(0, 1);
      let desc = tooltipData[one];
      if (desc) {
          dom.textContent = `${one} - ${desc}`;
      };

      return {dom};
    }
  }
})

let tooltipData = {
  'BRK': 'OpCode - Break',
  'LIT': 'OpCode - Break',
  'INC': 'OpCode - Increment: a → a',
  'DUP': 'OpCode - Duplicate: a → a a',
  'NIP': 'OpCode - Nip: a b → b',
  'OVR': 'OpCode - Over: a b → a b a ',
  'ROT': 'OpCode - Rotate: a b c → b c a',

  'EQU': 'OpCode - Equal: a b → flag',
  'NEQ': 'OpCode - NotEqual: a b → flag',
  'GTH': 'OpCode - GreatherThan: a b → flag',
  'LTH': 'OpCode - LessThan: a b → flag',
  'JMP': 'OpCode - Jump: a',
  'JCM': 'OpCode - Jump Condition: flag a',
  'JSR': 'OpCode - Jump Stash: a → rs',
  'STH': 'OpCode - Stash: a → rs',

  'LDZ': 'OpCode - Load Zeropage: a → val',
  'STZ': 'OpCode - Store Zeropage: val a',
  'LDR': 'OpCode - Load Relative: a → val',
  'STR': 'OpCode - Store Relative: val a',
  'LDA': 'OpCode - Load Absolute: a* → val',
  'STA': 'OpCode - Store Absolute: val a*',
  'DEI': 'OpCode - Device In: a → val',
  'DEO': 'OpCode - Device Out: val a',

  'ADD': 'OpCode - Add: a b → res',
  'SUB': 'OpCode - Subtract: a b → res',
  'MUL': 'OpCode - Multiply: a b → res',
  'DIV': 'OpCode - Divide: a b → res',
  'AND': 'OpCode - And: a b → res',
  'ORA': 'OpCode - Or: a b → res',
  'EOR': 'OpCode - Exclusive Or: a b → res',
  'SFT': 'OpCode - Shift : a b → res',

  '|': 'Rune - Pad (Absolute)',
  '$': 'Rune - Pad (Relative)',
  '%': 'Rune - Macro (Definition)',
  '@': 'Rune - Label (Definition)',
  '&': 'Rune - Sublabel (Definition)',
  '/': 'Rune - Sublabel spacer',
  '.': 'Rune - Literal Address (Zero-page)',
  ',': 'Rune - Literal Address (Relative)',
  ';': 'Rune - Literal Address (Absolute)',
  ':': 'Rune - Raw Address',
  '\'': 'Rune - Raw Character',
  '"': 'Rune - Raw Word',
  '#': 'Rune - Literal Hex',
}


const tagsToClass = Object.keys(UxnTags).map((item) => {
  return { tag: UxnTags[item], class: `highlight-${item.toLowerCase()}`}
});

const style = HighlightStyle.define(tagsToClass);

// eslint-disable-next-line
window.editor = new EditorView({
  state: EditorState.create({
    extensions: [
      basicSetup,
      UXNTAL(),
      classHighlightStyle,
      style,
      wordHover,
    ],
  }),
  parent: document.getElementById('editor'),
});
